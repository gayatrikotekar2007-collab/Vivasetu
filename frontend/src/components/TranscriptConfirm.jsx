/**
 * TranscriptConfirm component.
 * Allows student to review, edit, and confirm audio transcription before submission.
 * Strictly guarantees no auto-submission on mount.
 */
import { useEffect, useState } from 'react'

export default function TranscriptConfirm({
  transcript = '',
  onSubmit,
  onReRecord,
  isSubmitting = false,
}) {
  const [editedText, setEditedText] = useState(transcript)

  useEffect(() => {
    setEditedText(transcript)
  }, [transcript])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!editedText.trim() || isSubmitting) return
    onSubmit(editedText.trim())
  }

  return (
    <div
      className="surface"
      style={{
        padding: '1.25rem',
        border: '1px solid var(--accent-blue)',
        borderRadius: 'var(--radius)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.6rem',
        }}
      >
        <span className="label" style={{ color: 'var(--accent-blue)' }}>
          VOICE TRANSCRIPT REVIEW
        </span>
        <span className="label" style={{ color: 'var(--text-muted)' }}>
          EDIT BEFORE SUBMITTING
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          placeholder="Your transcribed answer will appear here..."
          rows={4}
          disabled={isSubmitting}
          style={{
            width: '100%',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            marginBottom: '1rem',
            resize: 'vertical',
          }}
          required
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="button"
            onClick={onReRecord}
            disabled={isSubmitting}
            style={{ fontSize: '0.8rem' }}
          >
            ↺ Re-record Audio
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitting || !editedText.trim()}
            style={{ padding: '0.6rem 1.5rem', fontWeight: 600 }}
          >
            {isSubmitting ? 'Submitting Answer...' : 'Submit Answer →'}
          </button>
        </div>
      </form>
    </div>
  )
}
