/**
 * ReportedQuestionsPage — Question Bank repository.
 * Crowdsourced viva questions with upvotes and topic filters.
 * Redesigned with Blossom & Midnight design system.
 */
import { useEffect, useState } from 'react'
import {
  ArrowUp,
  Filter,
  Plus,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import { useAuth } from '../hooks/useAuth'
import questionsService from '../services/questionsService'
import subjectService from '../services/subjectService'
import { safeArray } from '../utils/guards'
import '../styles/globals.css'

export default function ReportedQuestionsPage() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Report modal / form state
  const [showModal, setShowModal] = useState(false)
  const [formSubjectId, setFormSubjectId] = useState('')
  const [formTopic, setFormTopic] = useState('')
  const [formText, setFormText] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportSuccessMessage, setReportSuccessMessage] = useState(null)
  const [reportError, setReportError] = useState(null)

  useEffect(() => {
    let isMounted = true
    const fetchSubjects = async () => {
      try {
        const data = await subjectService.getSubjects({
          branch: user?.branch,
          academic_year: user?.academic_year,
        })
        if (isMounted) setSubjects(safeArray(data))
      } catch {
        if (isMounted) setSubjects([])
      }
    }
    fetchSubjects()
    return () => {
      isMounted = false
    }
  }, [user?.branch, user?.academic_year])

  useEffect(() => {
    let isMounted = true
    const loadQuestions = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await questionsService.getQuestions({
          branch: user?.branch,
          subject_id: selectedSubjectId || undefined,
        })
        if (isMounted) setQuestions(safeArray(data))
      } catch (err) {
        if (isMounted) setError(err.response?.data?.detail || 'Failed to load questions.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadQuestions()
    return () => {
      isMounted = false
    }
  }, [selectedSubjectId, user?.branch])

  const handleUpvote = async (questionId) => {
    try {
      const res = await questionsService.upvoteQuestion(questionId)
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, upvotes: res.upvotes, has_upvoted: true } : q
        )
      )
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upvote.')
    }
  }

  const handleSubmitReport = async (e) => {
    e.preventDefault()
    if (!formSubjectId || !formTopic.trim() || !formText.trim() || isSubmittingReport) return

    setIsSubmittingReport(true)
    setReportError(null)
    setReportSuccessMessage(null)

    try {
      await questionsService.reportQuestion({
        subject_id: formSubjectId,
        topic: formTopic.trim(),
        branch: user?.branch || 'Computer Engineering',
        college_id: user?.college_id,
        question_text: formText.trim(),
      })
      setReportSuccessMessage('Question submitted! It will appear after quick approval.')
      setFormTopic('')
      setFormText('')
      setFormSubjectId('')
      setTimeout(() => {
        setShowModal(false)
        setReportSuccessMessage(null)
      }, 2000)
    } catch (err) {
      setReportError(err.response?.data?.detail || 'Failed to submit question.')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      q.question_text?.toLowerCase().includes(query) ||
      q.topic?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <TopBar onSearch={(q) => setSearchQuery(q)} />
        <main className="content-container" style={{ maxWidth: '1080px' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.75rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Question Bank
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Real viva questions reported by SPPU &amp; autonomous engineering students
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.25rem' }}
            >
              <Plus size={16} /> Report a Question
            </button>
          </div>

          {/* Filters Bar */}
          <div
            className="surface"
            style={{
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Filter size={16} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Filter by Subject:</span>
            </div>

            <select
              className="form-input"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              style={{ maxWidth: '280px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="">All Subjects</option>
              {(subjects ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search topics or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              />
            </div>

            {selectedSubjectId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedSubjectId('')}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
              >
                Reset Filter
              </button>
            )}
          </div>

          {error && <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>}

          {/* Questions Feed */}
          {isLoading ? (
            <div className="surface" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading question bank...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="surface" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                No questions found matching your filter.
              </p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                Contribute the First Question
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className="surface"
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    gap: '1.25rem',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Upvote counter button */}
                  <button
                    onClick={() => handleUpvote(q.id)}
                    disabled={q.has_upvoted}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.5rem 0.65rem',
                      borderRadius: 'var(--radius-md)',
                      background: q.has_upvoted ? 'var(--accent-primary-subtle)' : 'var(--bg-input)',
                      border: q.has_upvoted ? '1px solid var(--accent-primary-border)' : '1px solid var(--border-color)',
                      color: q.has_upvoted ? 'var(--accent-primary)' : 'var(--text-primary)',
                      cursor: q.has_upvoted ? 'default' : 'pointer',
                      minWidth: '54px',
                      transition: 'all 0.2s ease',
                    }}
                    title={q.has_upvoted ? 'Upvoted' : 'Upvote question'}
                  >
                    <ArrowUp size={16} strokeWidth={q.has_upvoted ? 3 : 2} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: '2px' }}>
                      {q.upvotes ?? 0}
                    </span>
                  </button>

                  {/* Question details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--accent-primary)',
                          background: 'var(--accent-primary-subtle)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        {q.topic}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        · {q.branch}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.98rem',
                        fontWeight: 600,
                        lineHeight: 1.5,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {q.question_text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Report Question Modal */}
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
                  maxWidth: '540px',
                  width: '100%',
                  padding: '2rem',
                  borderRadius: 'var(--radius-xl)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Report a Real Viva Question</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                {reportError && <p className="error-text" style={{ marginBottom: '1rem' }}>{reportError}</p>}
                {reportSuccessMessage && (
                  <p style={{ color: 'var(--color-strong)', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    {reportSuccessMessage}
                  </p>
                )}

                <form onSubmit={handleSubmitReport}>
                  <div className="form-group">
                    <label>Subject</label>
                    <select
                      className="form-input"
                      value={formSubjectId}
                      onChange={(e) => setFormSubjectId(e.target.value)}
                      required
                    >
                      <option value="">Select subject</option>
                      {(subjects ?? []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Topic Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CPU Scheduling, Paging"
                      value={formTopic}
                      onChange={(e) => setFormTopic(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Question Asked by Examiner</label>
                    <textarea
                      className="form-input"
                      rows={4}
                      placeholder="Type the exact question you were asked..."
                      value={formText}
                      onChange={(e) => setFormText(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmittingReport || !formText.trim()}
                    >
                      {isSubmittingReport ? 'Submitting...' : 'Submit Question'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
