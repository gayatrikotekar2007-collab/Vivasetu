/**
 * DrillPage — Daily 5-question quick retention drill.
 * Redesigned with Blossom & Midnight design tokens:
 *   - Clean progress bar & indicator pills
 *   - Topic pill badge
 *   - Smooth completion celebration with streak count
 */
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import drillService from '../services/drillService'
import { safeArray } from '../utils/guards'
import '../styles/globals.css'

export default function DrillPage() {
  const [drill, setDrill] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completionResult, setCompletionResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    const initDrill = async () => {
      try {
        const data = await drillService.startDrill()
        if (!isMounted) return
        setDrill(data)
        if (data.completed) {
          setIsCompleted(true)
        } else {
          const turns = safeArray(data.turns)
          const firstUnanswered = turns.findIndex((t) => !t.answer)
          setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0)
        }
      } catch (err) {
        if (!isMounted) return
        setError(err.response?.data?.detail || 'Failed to initialize daily drill.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    initDrill()
    return () => {
      isMounted = false
    }
  }, [])

  const turns = safeArray(drill?.turns)
  const currentTurn = turns[currentIndex]

  const handleSubmitTurn = async (e) => {
    e.preventDefault()
    if (!currentAnswer.trim() || !drill || isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    try {
      await drillService.answerTurn(drill.id, currentIndex, currentAnswer.trim())
      setCurrentAnswer('')

      if (currentIndex >= 4) {
        const comp = await drillService.completeDrill(drill.id)
        setCompletionResult(comp)
        setIsCompleted(true)
      } else {
        setCurrentIndex((prev) => prev + 1)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record answer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '4rem' }}>
      <TopBar />

      <main style={{ maxWidth: '780px', margin: '2rem auto 0 auto', padding: '0 1.5rem' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="surface" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Preparing your 5 daily questions...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !drill && (
          <div className="surface" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--color-weak)', marginBottom: '1rem' }}>{error}</div>
            <Link to="/" className="btn btn-primary">
              Return Home
            </Link>
          </div>
        )}

        {/* Completion Celebration State */}
        {isCompleted && (
          <div
            className="surface-elevated"
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--stat-streak-bg)',
                border: '1px solid var(--stat-streak-border)',
                color: 'var(--stat-streak-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                boxShadow: '0 4px 16px rgba(255, 102, 68, 0.2)',
              }}
            >
              <Flame size={32} />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Daily Drill Complete!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', maxWidth: '440px', margin: '0 auto 1.75rem auto' }}>
              You answered all 5 target questions for today and reinforced your revision loop.
            </p>

            {completionResult && (
              <div
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1.25rem 2.5rem',
                  background: 'var(--stat-streak-bg)',
                  border: '1px solid var(--stat-streak-border)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '2rem',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--stat-streak-text)', textTransform: 'uppercase' }}>
                  Current Streak
                </span>
                <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {completionResult.streak_count} {completionResult.streak_count === 1 ? 'Day' : 'Days'} 🔥
                </span>
              </div>
            )}

            <div>
              <Link to="/" className="btn btn-primary" style={{ padding: '0.7rem 1.75rem' }}>
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Active Drill Form */}
        {!isLoading && !isCompleted && currentTurn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header with question fraction and badge */}
            <div
              className="surface"
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.14)',
                    color: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Daily Viva Drill
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Rapid retention · Streak builder
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                Question {currentIndex + 1} of 5
              </div>
            </div>

            {/* Slim progress bar */}
            <div
              style={{
                height: '5px',
                width: '100%',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${((currentIndex + 1) / 5) * 100}%`,
                  background: 'var(--accent-primary)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Main Question Card */}
            <div
              className="surface-elevated"
              style={{
                padding: '2.25rem 2rem',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-primary-subtle)',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary-border)',
                  }}
                >
                  Topic: {currentTurn.topic}
                </span>
              </div>

              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  lineHeight: 1.55,
                  color: 'var(--text-primary)',
                  marginBottom: '1.75rem',
                }}
              >
                {currentTurn.question}
              </div>

              <form onSubmit={handleSubmitTurn}>
                <div className="form-group">
                  <label htmlFor="drill-answer">Your Answer</label>
                  <textarea
                    id="drill-answer"
                    className="form-input"
                    rows={4}
                    placeholder="Provide a concise, conceptual explanation..."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || !currentAnswer.trim()}
                    style={{ padding: '0.65rem 1.5rem' }}
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : currentIndex >= 4
                      ? 'Finish Daily Drill'
                      : 'Next Question'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
