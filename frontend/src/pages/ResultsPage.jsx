/**
 * ResultsPage — Displays viva session score and topic-by-topic gap analysis.
 * Redesigned with Blossom & Midnight design tokens:
 *   - Overall score gauge card with performance feedback
 *   - Topic breakdown cards with model answers and gap analysis
 *   - Non-blocking community question contribution prompt
 */
import { useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  MessageSquare,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import { useAuth } from '../hooks/useAuth'
import questionsService from '../services/questionsService'
import { isInsufficientData, isScoringFailed, isValidScore, safeArray } from '../utils/guards'
import '../styles/globals.css'

export default function ResultsPage() {
  const location = useLocation()

  // Initialize state directly from location state to avoid redundant cascading render
  const [result] = useState(() => location.state?.result || null)
  const [mockMode] = useState(() => location.state?.result?.mock_mode ?? false)

  if (!result) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '2rem' }}>
        <TopBar />
        <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
          <div className="surface" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Result Found</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Please complete a viva simulation session to view detailed evaluation.
            </p>
            <Link to="/session/new" className="btn btn-primary">
              Start a Session
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Guard: insufficient data ───────────────────────────────────────────────
  if (isInsufficientData(result)) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <TopBar />
        <div style={{ maxWidth: '640px', margin: '3rem auto', padding: '0 1rem' }}>
          <div className="surface" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.12)',
                color: 'var(--color-warn)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <RotateCcw size={22} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Session Ended Early
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              {result.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link to="/session/new" className="btn btn-primary">
                Practice Again
              </Link>
              <Link to="/" className="btn btn-secondary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Guard: scoring failed ──────────────────────────────────────────────────
  if (isScoringFailed(result)) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <TopBar />
        <div style={{ maxWidth: '640px', margin: '3rem auto', padding: '0 1rem' }}>
          <div className="surface" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-weak)' }}>
              Scoring Unavailable
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{result.message}</p>
            {result.turns_saved && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Your responses have been saved to your practice history.
              </p>
            )}
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Valid score ────────────────────────────────────────────────────────────
  if (!isValidScore(result)) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <TopBar />
        <div style={{ maxWidth: '640px', margin: '3rem auto', padding: '0 1rem' }}>
          <div className="surface" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              An unexpected response was received. Please try again.
            </p>
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const topics = safeArray(result.topics)
  const avgScore =
    topics.length > 0
      ? Math.round(topics.reduce((sum, t) => sum + (t.score ?? 0), 0) / topics.length)
      : 0

  const scoreTier =
    avgScore >= 75
      ? { color: 'var(--color-strong)', label: 'Strong Performance! 🚀' }
      : avgScore >= 60
      ? { color: 'var(--color-warn)', label: 'Good Effort — Focus on Gaps ⚡' }
      : { color: 'var(--color-weak)', label: 'Needs Revision 💡' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '4rem' }}>
      <TopBar />

      <main style={{ maxWidth: '960px', margin: '2rem auto 0 auto', padding: '0 1.5rem' }}>
        {/* Navigation Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'flex',
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

          {mockMode && (
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                background: 'var(--accent-primary-subtle)',
                border: '1px solid var(--accent-primary-border)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={12} />
              Demo mode evaluation
            </div>
          )}
        </div>

        {/* Overall Score Banner Card */}
        <div
          className="surface-elevated"
          style={{
            padding: '2.5rem 2.25rem',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: 'minmax(140px, 200px) 1fr',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          {/* Big Circular Score Badge */}
          <div
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: `6px solid ${scoreTier.color}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              background: 'var(--bg-card-subtle)',
            }}
          >
            <span style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>
              {avgScore}
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              out of 100
            </span>
          </div>

          {/* Evaluation Summary */}
          <div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: scoreTier.color,
                marginBottom: '0.35rem',
              }}
            >
              {scoreTier.label}
            </div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '0.65rem',
              }}
            >
              Viva Assessment Complete
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Reviewed {topics.length} conceptual topic{topics.length !== 1 ? 's' : ''}. Check the detailed feedback below to reinforce your answers before your university examination.
            </p>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <Link to="/session/new" className="btn btn-primary">
                <Play size={15} fill="currentColor" /> Practice Again
              </Link>
              <Link to="/" className="btn btn-secondary">
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Topic Breakdown Header */}
        <h2
          style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}
        >
          Topic Evaluation &amp; Gap Analysis
        </h2>

        {/* Topics List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {topics.map((t, idx) => {
            const score = Math.round(t.score ?? 0)
            const scoreColor =
              score >= 75
                ? 'var(--color-strong)'
                : score >= 60
                ? 'var(--color-warn)'
                : 'var(--color-weak)'

            return (
              <div
                key={t.topic_name || idx}
                className="surface"
                style={{ padding: '1.75rem 2rem', borderRadius: 'var(--radius-lg)' }}
              >
                {/* Topic Title & Score */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--accent-primary-subtle)',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BookOpen size={16} />
                    </div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {t.topic_name || 'Core Fundamentals'}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: scoreColor,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-input)',
                    }}
                  >
                    {score}%
                  </span>
                </div>

                {/* Question Feedback Blocks */}
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Student Answer */}
                  <div
                    style={{
                      background: 'var(--bg-input)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Your Response Summary
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {t.student_answer_summary || '—'}
                    </p>
                  </div>

                  {/* Model Answer */}
                  <div
                    style={{
                      background: 'var(--bg-input)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: '3px solid var(--color-strong)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--color-strong)',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Model Answer
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {t.model_answer || '—'}
                    </p>
                  </div>

                  {/* Knowledge Gap */}
                  {t.gap_description && (
                    <div
                      style={{
                        background: 'var(--bg-input)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '3px solid var(--color-warn)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--color-warn)',
                          textTransform: 'uppercase',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Gap Analysis &amp; Suggestions
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {t.gap_description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Community Question Contribution Callout */}
        <ReportPrompt
          subjectId={location.state?.subjectId}
          defaultTopic={topics[0]?.topic_name || ''}
        />
      </main>
    </div>
  )
}

function ReportPrompt({ subjectId, defaultTopic }) {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [topic, setTopic] = useState(defaultTopic || '')
  const [questionText, setQuestionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  if (dismissed) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!questionText.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    try {
      await questionsService.reportQuestion({
        subject_id: subjectId || 'general',
        topic: topic.trim() || defaultTopic || 'General Viva',
        branch: user?.branch || 'Computer Engineering',
        college_id: user?.college_id,
        question_text: questionText.trim(),
      })
      setSuccess(true)
      setTimeout(() => {
        setShowModal(false)
        setDismissed(true)
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit reported question.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        className="surface"
        style={{
          padding: '1.25rem 1.75rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px dashed var(--border-color)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            Did any question resemble what your examiner asked?
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Contribute questions to help your batchmates prepare for their viva.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowModal(true)}
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
          >
            <MessageSquare size={14} /> Report Question
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setDismissed(true)}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}
          >
            Dismiss
          </button>
        </div>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="surface-elevated"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Report Real Viva Question</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {error && <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>}

            {success ? (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--color-strong)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                ✓ Question submitted successfully! Thank you for contributing.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Topic Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Normalization, B-Trees"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Question Asked by Examiner</label>
                  <textarea
                    className="form-input"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="What did your examiner ask?"
                    rows={4}
                    required
                    minLength={5}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || !questionText.trim()}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit to Question Bank'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
