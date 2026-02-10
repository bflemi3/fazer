import { useRef, useCallback } from 'react'

type UseLongPressOptions = {
  delay?: number
  moveThreshold?: number
}

export function useLongPress(
  onLongPress: () => void,
  { delay = 500, moveThreshold = 10 }: UseLongPressOptions = {},
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pressedRef = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      startPos.current = { x: e.clientX, y: e.clientY }
      pressedRef.current = false
      timerRef.current = setTimeout(() => {
        pressedRef.current = true
        timerRef.current = null
        onLongPress()
      }, delay)
    },
    [onLongPress, delay],
  )

  const onPointerUp = useCallback(() => {
    clear()
  }, [clear])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!timerRef.current) return
      const dx = e.clientX - startPos.current.x
      const dy = e.clientY - startPos.current.y
      if (Math.abs(dx) > moveThreshold || Math.abs(dy) > moveThreshold) {
        clear()
      }
    },
    [clear, moveThreshold],
  )

  const shouldSuppress = useCallback(() => {
    if (pressedRef.current) {
      pressedRef.current = false
      return true
    }
    return false
  }, [])

  const handlers = {
    onPointerDown,
    onPointerUp,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onPointerMove,
  }

  return { handlers, shouldSuppress }
}
