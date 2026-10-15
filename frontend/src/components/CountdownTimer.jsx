/**
 * CountdownTimer component.
 * Displays MM:SS countdown with dynamic color classes:
 *   - green: > 30s
 *   - amber: < 30s
 *   - red: < 10s (blinking)
 * Calls onExpire callback when timer reaches 0 to auto-submit the current answer.
 */
import useCountdown from '../hooks/useCountdown'

export default function CountdownTimer({ seconds = 120, onExpire, isActive = true }) {
  const { secondsLeft } = useCountdown(seconds, onExpire, isActive)

  const minutes = Math.floor(secondsLeft / 60)
  const remainingSecs = secondsLeft % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`

  let colorClass = 'timer-green'
  if (secondsLeft < 10) {
    colorClass = 'timer-red'
  } else if (secondsLeft < 30) {
    colorClass = 'timer-amber'
  }

  return (
    <div className={`countdown-timer ${colorClass}`}>
      <span className="label" style={{ fontSize: '0.65rem' }}>TIME LEFT:</span>
      <span className="mono timer-digits" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
        {formatted}
      </span>
    </div>
  )
}
