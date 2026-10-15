/**
 * TopicMasteryCard component.
 * Displays topic name, score bar (color coded by band), and next review date.
 */
import { useNavigate } from 'react-router-dom'

export default function TopicMasteryCard({ topic }) {
  const navigate = useNavigate()

  const score = Math.round(topic.mastery_score)
  let barColor = 'var(--accent-ok)'
  if (score < 40) {
    barColor = 'var(--accent-error)'
  } else if (score <= 70) {
    barColor = 'var(--accent-warn)'
  }

  const handlePractice = () => {
    navigate(`/session/new?topic=${encodeURIComponent(topic.topic_name)}&subject_id=${encodeURIComponent(topic.subject_id)}`)
  }

  return (
    <div
      className="surface"
      style={{
        padding: '1rem',
        marginBottom: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {topic.topic_name}
          </div>
          <div className="label" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
            REVIEW DUE: {topic.next_review_due} · SESSIONS: {topic.session_count}
          </div>
        </div>
        <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: barColor }}>
          {score}%
        </div>
      </div>

      {/* Score bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, score))}%`,
            height: '100%',
            background: barColor,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
        <button
          onClick={handlePractice}
          className="button"
          style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.75rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          PRACTICE THIS TOPIC →
        </button>
      </div>
    </div>
  )
}
