import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_CHANNEL_ID = process.env.SLACK_FEEDBACK_CHANNEL_ID

// In-memory rate limiting: userId -> timestamps[]
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(userId) ?? []
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  rateLimitMap.set(userId, recent)

  if (recent.length >= RATE_LIMIT_MAX) return true

  recent.push(now)
  rateLimitMap.set(userId, recent)
  return false
}

const TYPE_EMOJI: Record<string, string> = {
  bug: ':bug:',
  feature: ':bulb:',
  general: ':speech_balloon:',
}

const TYPE_LABEL: Record<string, string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  general: 'General Feedback',
}

export async function POST(request: Request) {
  try {
    // Authenticate
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit
    if (isRateLimited(user.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Parse form data
    const formData = await request.formData()
    const type = formData.get('type') as string
    const message = formData.get('message') as string
    const screenshot = formData.get('screenshot') as File | null
    const route = formData.get('route') as string | null
    const appVersion = formData.get('appVersion') as string | null
    const viewport = formData.get('viewport') as string | null
    const browser = formData.get('browser') as string | null
    const isOnline = formData.get('isOnline') as string | null

    // Validate
    if (!type || !['bug', 'feature', 'general'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Gracefully no-op if Slack is not configured (local dev)
    if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID) {
      console.log('[feedback] Slack not configured, skipping:', { type, message: message.slice(0, 100) })

      return NextResponse.json({ ok: true })
    }

    // Fetch user profile for display name/email
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single()

    const displayName = profile?.display_name || 'Unknown'
    const email = profile?.email || user.email || 'unknown'

    // Build status string
    const statusStr = isOnline === 'false' ? 'Offline' : 'Online'

    // Format Slack message
    const emoji = TYPE_EMOJI[type] || ':speech_balloon:'
    const label = TYPE_LABEL[type] || 'Feedback'

    const contextParts = [
      route ? `*Page:* ${route}` : null,
      `*Version:* ${appVersion || 'unknown'} | ${viewport || 'unknown'} | ${browser || 'unknown'}`,
      `*Status:* ${statusStr}`,
    ].filter(Boolean).join('\n')

    const slackText = [
      `${emoji} *${label}* from ${displayName} (${email})`,
      '---',
      contextParts,
      '',
      `> ${message.trim().replace(/\n/g, '\n> ')}`,
    ].join('\n')

    if (screenshot && screenshot.size > 0) {
      // Upload with files.uploadV2 (3-step process)
      // Step 1: Get upload URL
      const getUrlRes = await fetch('https://slack.com/api/files.getUploadURLExternal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          filename: screenshot.name || 'screenshot.png',
          length: String(screenshot.size),
        }),
      })
      const getUrlData = await getUrlRes.json()

      if (!getUrlData.ok) {
        console.error('[feedback] files.getUploadURLExternal failed:', getUrlData)
        // Fall back to posting text only
        await postTextMessage(slackText)
        return NextResponse.json({ ok: true })
      }

      // Step 2: Upload file to the URL
      const fileBuffer = Buffer.from(await screenshot.arrayBuffer())
      await fetch(getUrlData.upload_url, {
        method: 'POST',
        body: fileBuffer,
      })

      // Step 3: Complete upload with channel and message
      const completeRes = await fetch('https://slack.com/api/files.completeUploadExternal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: [{ id: getUrlData.file_id, title: 'Screenshot' }],
          channel_id: SLACK_CHANNEL_ID,
          initial_comment: slackText,
        }),
      })
      const completeData = await completeRes.json()

      if (!completeData.ok) {
        console.error('[feedback] files.completeUploadExternal failed:', completeData)
      }
    } else {
      await postTextMessage(slackText)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[feedback] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function postTextMessage(text: string) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: SLACK_CHANNEL_ID,
      text,
    }),
  })
  const data = await res.json()
  if (!data.ok) {
    console.error('[feedback] chat.postMessage failed:', data)
  }
}
