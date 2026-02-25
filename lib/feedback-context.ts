export type FeedbackContext = {
  route: string
  appVersion: string
  viewport: string
  browser: string
  isOnline: boolean
}

function getBrowserName(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (ua.includes('CriOS')) return 'Chrome (iOS)'
  if (ua.includes('FxiOS')) return 'Firefox (iOS)'
  if (ua.includes('EdgiOS') || ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Firefox')) return 'Firefox'
  return 'Other'
}

export function getFeedbackContext(): FeedbackContext {
  return {
    route: typeof window !== 'undefined' ? window.location.pathname : '',
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    viewport: typeof window !== 'undefined'
      ? `${window.innerWidth}x${window.innerHeight}`
      : 'unknown',
    browser: getBrowserName(),
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  }
}
