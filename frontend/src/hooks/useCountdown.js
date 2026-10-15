/**
 * useCountdown hook.
 * Single source of truth for countdown timers.
 * Initialized strictly inside useEffect (never inline in component render).
 */
import { useEffect, useRef, useState } from 'react'

export default function useCountdown(initialSeconds, onExpire, isActive = true) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  // Sync initial seconds when prop changes
  useEffect(() => {
    setSecondsLeft(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    if (!isActive || secondsLeft <= 0) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (onExpireRef.current) {
            onExpireRef.current()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, secondsLeft])

  const reset = (newSeconds = initialSeconds) => {
    setSecondsLeft(newSeconds)
  }

  return {
    secondsLeft,
    reset,
  }
}
