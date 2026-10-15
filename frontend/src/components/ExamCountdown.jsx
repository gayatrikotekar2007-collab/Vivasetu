/**
 * ExamCountdown component.
 * Displays countdown to exam date.
 * Strictly adheres to rule: date comparisons computed in useEffect, not render body.
 */
import { useEffect, useState } from 'react'

export default function ExamCountdown({ examDate }) {
  const [daysRemaining, setDaysRemaining] = useState(null)

  useEffect(() => {
    if (!examDate) {
      setDaysRemaining(null)
      return
    }

    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const target = new Date(examDate)
    const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate())
    const diffMs = targetMidnight.getTime() - todayMidnight.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    setDaysRemaining(diffDays)
  }, [examDate])

  if (daysRemaining === null) return null

  let message = ''
  if (daysRemaining > 1) {
    message = `${daysRemaining} days until your viva`
  } else if (daysRemaining === 1) {
    message = '1 day until your viva'
  } else if (daysRemaining === 0) {
    message = 'Your viva is today!'
  } else {
    message = `Your viva was ${Math.abs(daysRemaining)} days ago`
  }

  return (
    <div
      className="surface"
      style={{
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        borderLeft: '3px solid var(--accent-blue)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '1.1rem' }}>📅</span>
        <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {message}
        </span>
      </div>
      <span className="label" style={{ color: 'var(--text-muted)' }}>EXAM COUNTDOWN</span>
    </div>
  )
}
