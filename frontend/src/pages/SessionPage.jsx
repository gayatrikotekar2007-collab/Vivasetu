/**
 * SessionPage — Live Viva Exam Simulation Screen.
 * Minimal chrome, calm and focused interface.
 * - Top row: Subject + Topic + Difficulty on left ("Data Structures · Strict"),
 *            Question progress on right ("Question 3 of 8"),
 *            "Demo mode" transparency badge in theme's accent color near top.
 * - Main question card: Uppercase label "EXAMINER ASKS", readable question typography.
 * - Slim progress bar in accent color.
 * - Primary interaction centered at bottom:
 *     - Voice mode: Large circular mic button in accent color with scale ring animation, countdown readout ("Hold to answer · MM:SS left"), switch to text link.
 *     - Text mode: Textarea + Send button, switch to voice link.
 */
import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Edit2,
  Mic,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
} from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import useCountdown from '../hooks/useCountdown'
import useVoiceRecorder from '../hooks/useVoiceRecorder'
import { useAuth } from '../hooks/useAuth'
import sessionService from '../services/sessionService'
import subjectService from '../services/subjectService'
import '../styles/globals.css'

const DIFFICULTIES = ['Friendly', 'Strict', 'Brutal']

export default function SessionPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const paramSubjectId = searchParams.get('subject_id') || ''
  const paramNotesId = searchParams.get('notes_document_id') || ''

  // Session phases: 'setup' | 'active' | 'ending'
  const [phase, setPhase] = useState('setup')
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(paramSubjectId)
  const [difficulty, setDifficulty] = useState('Strict')
  const [_loadingSubjects, setLoadingSubjects] = useState(false)

  // Active session state
  const [sessionId, setSessionId] = useState(id || null)
  const [question, setQuestion] = useState('')
  const [turnIndex, setTurnIndex] = useState(0)
  const [mockMode, setMockMode] = useState(false)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Interaction mode: 'voice' | 'text'
  const [mode, setMode] = useState('voice')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [editedTranscript, setEditedTranscript] = useState('')
  const [isEditingTranscript, setIsEditingTranscript] = useState(false)

  // Real voice recorder hook
  const {
    isSupported: isMicSupported,
    isRecording,
    audioBlob,
    error: micError,
    startRecording,
    stopRecording,
    reset: resetRecorder,
  } = useVoiceRecorder()

  const handledBlobRef = useRef(null)

  // Fallback to text if mic permission denied or unsupported, or handle short tap
  useEffect(() => {
    if (micError === 'permission_denied') {
      setError('Microphone access denied — switched to typed text mode.')
      setMode('text')
    } else if (micError === 'unavailable') {
      setError('Microphone is unavailable — switched to typed text mode.')
      setMode('text')
    } else if (micError === 'too_short') {
      setError('Recording was too short. Press and hold the mic while speaking, then release.')
    }
  }, [micError])

  // When audio blob is recorded, send to backend for transcription
  useEffect(() => {
    if (!audioBlob || !sessionId) return
    if (handledBlobRef.current === audioBlob) return
    handledBlobRef.current = audioBlob

    // Reset recorder immediately so audioBlob does not persist in hook state
    resetRecorder()

    let active = true
    setIsTranscribing(true)
    setError('')

    sessionService
      .transcribeAudio(sessionId, audioBlob)
      .then((data) => {
        if (active) {
          const text = data?.transcript?.trim()
          if (text) {
            setTranscript(text)
            setEditedTranscript(text)
          } else {
            setError('Could not detect clear speech. Please hold the mic while speaking or type your answer.')
          }
        }
      })
      .catch((err) => {
        if (active) {
          const status = err.response?.status
          const errorType = err.response?.data?.error
          const msg = err.response?.data?.message || err.response?.data?.detail
          if (
            status === 503 &&
            (errorType === 'transcription_unavailable' && msg?.includes('not configured'))
          ) {
            setError(
              'AI provider in demo/mock mode: Audio transcription is unavailable. Switched to typed text mode.'
            )
            setMode('text')
          } else {
            setError(msg || 'Transcription failed. Please try again or type your answer.')
          }
        }
      })
      .finally(() => {
        if (active) {
          setIsTranscribing(false)
        }
      })

    return () => {
      active = false
    }
  }, [audioBlob, sessionId, resetRecorder])

  // Countdown timer: 90 seconds per question
  const { secondsLeft, reset: resetCountdown } = useCountdown(90, handleCountdownExpire, phase === 'active')

  // Load user subjects (FE is branch-independent; SE+ requires branch)
  useEffect(() => {
    if (!user?.academic_year) return
    let cancelled = false
    setLoadingSubjects(true)
    const branchParam = user.academic_year === 'FE' ? undefined : user.branch
    subjectService
      .listSubjects(branchParam, user.academic_year)
      .then((data) => {
        if (!cancelled) {
          setSubjects(data)
          if (paramSubjectId) {
            setSelectedSubject(paramSubjectId)
          } else if (data.length > 0) {
            setSelectedSubject((prev) => prev || data[0].id)
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || 'Failed to load subjects.')
      })
      .finally(() => {
        if (!cancelled) setLoadingSubjects(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.branch, user?.academic_year, paramSubjectId])

  // Load existing session if id in URL
  useEffect(() => {
    if (!id) return
    let cancelled = false
    sessionService
      .getSession(id)
      .then((s) => {
        if (!cancelled) {
          setSessionId(s.id)
          setMockMode(s.mock_mode)
          setPhase('active')
          setSelectedSubject(s.subject_id)
          if (s.turns && s.turns.length > 0) {
            const lastTurn = s.turns[s.turns.length - 1]
            setQuestion(lastTurn.question)
            setTurnIndex(lastTurn.turn_index)
          }
        }
      })
      .catch(() => {
        if (!cancelled) navigate('/')
      })

    return () => {
      cancelled = true
    }
  }, [id, navigate])

  // Speech synthesis for examiner questions
  useEffect(() => {
    if (phase !== 'active' || !question || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(question)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [question, phase])

  // Start viva session
  async function handleStart() {
    if (!selectedSubject) {
      setError('Please select a subject to simulate.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        subject_id: selectedSubject,
        difficulty,
      }
      if (paramNotesId) {
        payload.notes_document_id = paramNotesId
      }
      const data = await sessionService.startSession(payload)
      setSessionId(data.session_id)
      setQuestion(data.question)
      setTurnIndex(data.turn_index)
      setMockMode(data.mock_mode)
      setPhase('active')
      resetCountdown(90)
      window.history.replaceState(null, '', `/session/${data.session_id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start session.')
    } finally {
      setSubmitting(false)
    }
  }

  // Submit answer
  async function handleSubmitAnswerWithText(answerText) {
    if (submitting) return
    if (!answerText || !answerText.trim()) {
      setError('Please provide an answer.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const data = await sessionService.submitAnswer(sessionId, answerText.trim())
      setQuestion(data.question)
      setTurnIndex(data.turn_index)
      setAnswer('')
      setTranscript('')
      setEditedTranscript('')
      setIsEditingTranscript(false)
      resetCountdown(90)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit answer.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCountdownExpire() {
    const finalAnswer =
      (editedTranscript && editedTranscript.trim()) ||
      (transcript && transcript.trim()) ||
      (answer && answer.trim()) ||
      'No answer provided before time expired.'
    handleSubmitAnswerWithText(finalAnswer)
  }

  // End viva session and view results
  async function handleEndSession() {
    setPhase('ending')
    setError('')
    try {
      const result = await sessionService.endSession(sessionId)
      navigate(`/session/${sessionId}/results`, { state: { result, subjectId: selectedSubject } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to end session.')
      setPhase('active')
    }
  }

  const currentSubjectObj = subjects.find((s) => s.id === selectedSubject)
  const subjectName = currentSubjectObj ? currentSubjectObj.name : 'Viva Examination'

  // Format countdown readout MM:SS
  const minutes = Math.floor(secondsLeft / 60)
  const remainingSecs = secondsLeft % 60
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`

  // Estimated total questions (default 8)
  const totalQuestions = 8
  const currentQuestionNum = turnIndex + 1
  const progressPercent = Math.min(100, Math.round((currentQuestionNum / totalQuestions) * 100))

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--text-primary)',
        transition: 'background-color 0.25s ease',
      }}
    >
      {/* ── TOP NAV HEADER (Minimal Chrome) ───────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.9rem 2.5rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          Exit to Dashboard
        </Link>

        {/* Demo Mode transparency badge - Must never be omittable per spec */}
        {mockMode && (
          <div
            style={{
              background: 'var(--accent-primary-subtle)',
              border: '1px solid var(--accent-primary-border)',
              color: 'var(--accent-primary)',
              padding: '0.25rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={13} />
            Demo mode active
          </div>
        )}

        {/* Theme switcher pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          {phase === 'active' && (
            <button
              onClick={handleEndSession}
              disabled={submitting}
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.75rem',
                color: 'var(--color-weak)',
                borderColor: 'var(--border-color)',
              }}
            >
              End Exam
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ───────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: phase === 'setup' ? 'center' : 'flex-start',
          padding: '2.5rem 1.5rem',
          maxWidth: '820px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* ── SETUP PHASE ────────────────────────────────────────── */}
        {phase === 'setup' && (
          <div
            className="surface-elevated"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '2.25rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'var(--accent-primary-subtle)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem auto',
                }}
              >
                <Play size={22} fill="currentColor" />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Start Viva Simulation
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Adaptive AI examiner evaluating conceptual depth and communication
              </p>
            </div>

            {error && <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>}

            {/* Subject Selector */}
            <div className="form-group">
              <label>Select Subject</label>
              <select
                className="form-input"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {subjects.length > 0 ? (
                  subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No subjects found — configure your branch in Profile
                  </option>
                )}
              </select>
            </div>

            {/* Difficulty Selector */}
            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label>Examiner Temperament</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: difficulty === d ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: difficulty === d ? 'var(--accent-primary-subtle)' : 'var(--bg-input)',
                      color: difficulty === d ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={submitting}
              className="btn btn-primary btn-full"
              style={{ marginTop: '1.75rem', padding: '0.75rem', fontSize: '0.92rem' }}
            >
              {submitting ? 'Preparing examiner...' : 'Begin Session'}
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── ACTIVE EXAM PHASE ──────────────────────────────────── */}
        {phase === 'active' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Row Spec: Subject · Difficulty on left, Question progress on right */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {subjectName}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    background: 'var(--accent-primary-subtle)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {difficulty}
                </span>
              </div>

              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Question {currentQuestionNum} of {totalQuestions}
              </div>
            </div>

            {/* Main Question Card — The visual focal point */}
            <div
              className="surface"
              style={{
                padding: '2.5rem 2.25rem',
                borderRadius: 'var(--radius-xl)',
                position: 'relative',
                boxShadow: 'var(--card-shadow-hover)',
              }}
            >
              {/* Uppercase muted label */}
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Volume2 size={14} style={{ color: 'var(--accent-primary)' }} />
                Examiner asks
              </div>

              {/* Question text with generous line-height */}
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {question || 'Preparing examination question...'}
              </div>
            </div>

            {/* Slim Progress Bar beneath question card in theme's accent color */}
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
                  width: `${progressPercent}%`,
                  background: 'var(--accent-primary)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            {error && (
              <div
                className="surface"
                style={{
                  padding: '0.75rem 1rem',
                  borderLeft: '3px solid var(--color-weak)',
                  color: 'var(--color-weak)',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            {/* ── Transcript Confirmation / Review Card (if recorded) ── */}
            {transcript && !isEditingTranscript && (
              <div
                className="surface"
                style={{
                  padding: '1.25rem 1.5rem',
                  border: '1px solid var(--accent-primary-border)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    TRANSCRIPTION READY FOR REVIEW
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingTranscript(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      color: 'var(--accent-primary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </div>

                <p style={{ fontSize: '0.92rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  “{editedTranscript}”
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('')
                      setEditedTranscript('')
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                  >
                    <RotateCcw size={14} /> Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmitAnswerWithText(editedTranscript)}
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1.25rem', fontSize: '0.8rem' }}
                  >
                    <Check size={14} /> Send Answer
                  </button>
                </div>
              </div>
            )}

            {/* Editable Transcript Area */}
            {transcript && isEditingTranscript && (
              <div
                className="surface"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  EDIT YOUR ANSWER:
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditingTranscript(false)}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmitAnswerWithText(editedTranscript)}
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1.25rem', fontSize: '0.8rem' }}
                  >
                    <Send size={14} /> Submit
                  </button>
                </div>
              </div>
            )}

            {/* ── Primary Interaction Element: Centered Bottom ─────── */}
            {!transcript && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginTop: '1.5rem',
                  gap: '1rem',
                }}
              >
                {mode === 'voice' ? (
                  /* Voice Mode: Large circular mic button in accent color with scale ring animation */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                      {/* Scaling ring pulse animation while listening */}
                      {isRecording && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: '-12px',
                            borderRadius: '50%',
                            border: '2px solid var(--accent-primary)',
                            animation: 'ringPulse 1.4s cubic-bezier(0, 0.2, 0.8, 1) infinite',
                          }}
                        />
                      )}

                      <button
                        type="button"
                        onPointerDown={startRecording}
                        onPointerUp={stopRecording}
                        onPointerCancel={stopRecording}
                        disabled={submitting || isTranscribing || !isMicSupported}
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '50%',
                          background: isRecording ? 'var(--color-weak)' : 'var(--accent-primary)',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: isTranscribing || !isMicSupported ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                          transform: isRecording ? 'scale(1.06)' : 'scale(1)',
                          transition: 'transform 0.15s ease, background-color 0.2s ease',
                          userSelect: 'none',
                          touchAction: 'none',
                        }}
                        title="Hold to speak"
                      >
                        <Mic size={36} />
                      </button>
                    </div>

                    {/* Countdown readout beneath button */}
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {isTranscribing
                          ? 'Transcribing audio...'
                          : isRecording
                          ? 'Listening... Release when done'
                          : `Hold to answer · ${formattedCountdown} left`}
                      </div>
                      <button
                        type="button"
                        onClick={() => setMode('text')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '0.78rem',
                          marginTop: '0.35rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Switch to typed input instead
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Text Mode: Text input and Send button */
                  <div style={{ width: '100%', maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Type your viva answer here in full sentences..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        style={{ resize: 'vertical' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitAnswerWithText(answer)}
                        disabled={submitting || !answer.trim()}
                        className="btn btn-primary"
                        style={{ height: '48px', padding: '0 1.25rem', flexShrink: 0 }}
                      >
                        <Send size={16} />
                        Send
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Time remaining: {formattedCountdown}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMode('voice')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-primary)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Mic size={13} /> Switch to voice mode
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global CSS animation for microphone ring pulse */}
      <style>{`
        @keyframes ringPulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
