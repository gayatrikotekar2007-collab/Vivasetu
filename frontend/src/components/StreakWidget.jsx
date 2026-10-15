/**
 * StreakWidget component.
 * Displays daily drill study streak.
 * No date calculations performed in render body.
 */
export default function StreakWidget({ streakCount = 0 }) {
  const isZero = !streakCount || streakCount === 0

  return (
    <div
      className="surface"
      style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeft: isZero ? '3px solid var(--border)' : '3px solid var(--accent-warn)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🔥</span>
        <div>
          <div
            className="mono"
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: isZero ? 'var(--text-muted)' : 'var(--accent-warn)',
            }}
          >
            {isZero ? '0' : streakCount} {streakCount === 1 ? 'DAY' : 'DAYS'}
          </div>
          <div className="label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {isZero ? 'Start your streak today' : 'Daily practice streak'}
          </div>
        </div>
      </div>
      <span className="label" style={{ color: 'var(--text-muted)' }}>STREAK</span>
    </div>
  )
}
