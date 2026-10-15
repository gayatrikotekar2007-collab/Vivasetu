/**
 * SubjectsPage — Lists academic subjects for student branch/year.
 * Supports suggesting missing subjects. Redesigned with Blossom & Midnight design system.
 */
import { useEffect, useState } from 'react'
import {
  BookOpen,
  Play,
  Plus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import { useAuth } from '../hooks/useAuth'
import subjectService from '../services/subjectService'
import '../styles/globals.css'

export default function SubjectsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Suggest subject modal state
  const [showSuggest, setShowSuggest] = useState(false)
  const [suggestName, setSuggestName] = useState('')
  const [submittingSuggest, setSubmittingSuggest] = useState(false)
  const [suggestError, setSuggestError] = useState('')

  const [selectedSemester, setSelectedSemester] = useState(null)

  useEffect(() => {
    if (!user?.academic_year) return
    if (user.academic_year !== 'FE' && !user.branch) return

    let cancelled = false
    setLoading(true)

    const branchParam = user.academic_year === 'FE' ? null : user.branch
    subjectService
      .listSubjects(branchParam, user.academic_year, selectedSemester)
      .then((data) => {
        if (!cancelled) setSubjects(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || 'Failed to load subjects.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user?.branch, user?.academic_year, selectedSemester])

  async function handleSuggest(e) {
    e.preventDefault()
    if (!suggestName.trim()) return

    setSuggestError('')
    setSubmittingSuggest(true)

    try {
      const newSubject = await subjectService.suggestSubject({
        name: suggestName.trim(),
        branch: user.branch,
        academic_year: user.academic_year,
      })
      setSubjects((prev) => [...prev, newSubject])
      setSuggestName('')
      setShowSuggest(false)
    } catch (err) {
      setSuggestError(err.response?.data?.detail || 'Failed to suggest subject.')
    } finally {
      setSubmittingSuggest(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <TopBar />
        <main className="content-container" style={{ maxWidth: '1000px' }}>
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
                Your Academic Subjects
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {user?.academic_year === 'FE'
                  ? 'First Year Common Curriculum'
                  : (user?.branch || 'Engineering')} · {user?.academic_year || 'FE/SE/TE/BE'}
              </p>
            </div>

            <button
              onClick={() => setShowSuggest(true)}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.25rem' }}
            >
              <Plus size={16} /> Suggest Missing Subject
            </button>
          </div>

          {/* Semester Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={selectedSemester === null ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
              onClick={() => setSelectedSemester(null)}
            >
              All Semesters
            </button>
            {user?.academic_year === 'FE' ? (
              <>
                <button
                  type="button"
                  className={selectedSemester === 1 ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                  onClick={() => setSelectedSemester(1)}
                >
                  Semester 1
                </button>
                <button
                  type="button"
                  className={selectedSemester === 2 ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                  onClick={() => setSelectedSemester(2)}
                >
                  Semester 2
                </button>
              </>
            ) : user?.academic_year === 'SE' ? (
              <>
                <button
                  type="button"
                  className={selectedSemester === 3 ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                  onClick={() => setSelectedSemester(3)}
                >
                  Semester 3
                </button>
                <button
                  type="button"
                  className={selectedSemester === 4 ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                  onClick={() => setSelectedSemester(4)}
                >
                  Semester 4
                </button>
              </>
            ) : null}
          </div>

          {error && <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>}

          {/* Suggest Modal */}
          {showSuggest && (
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
                  maxWidth: '480px',
                  width: '100%',
                  padding: '2rem',
                  borderRadius: 'var(--radius-xl)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Suggest Missing Subject</h3>
                  <button
                    onClick={() => setShowSuggest(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Missing a subject from your syllabus? Add it below — it will be available immediately for viva simulations.
                </p>

                {suggestError && <p className="error-text" style={{ marginBottom: '1rem' }}>{suggestError}</p>}

                <form onSubmit={handleSuggest}>
                  <div className="form-group">
                    <label>Subject Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Distributed Systems & Cloud"
                      value={suggestName}
                      onChange={(e) => setSuggestName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowSuggest(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submittingSuggest || !suggestName.trim()}
                    >
                      {submittingSuggest ? 'Adding...' : 'Add Subject'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Subjects Cards Grid */}
          {loading ? (
            <div className="surface" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading subjects...
            </div>
          ) : (subjects ?? []).length === 0 ? (
            <div className="surface" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                No subjects registered for your branch and academic year yet.
              </p>
              <button className="btn btn-primary" onClick={() => setShowSuggest(true)}>
                Suggest First Subject
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {(subjects ?? []).map((s) => (
                <div
                  key={s.id}
                  className="surface"
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '160px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'var(--accent-primary-subtle)',
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <BookOpen size={18} />
                      </div>

                      {s.is_verified ? (
                        <span className="badge badge-verified">Verified</span>
                      ) : (
                        <span className="badge badge-unverified">Unverified</span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      {s.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {s.semester ? `Sem ${s.semester} · ` : ''}{s.branch || 'Common Curriculum'} · {s.academic_year}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem' }}>
                    <button
                      onClick={() => navigate(`/session/new?subject_id=${s.id}`)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                    >
                      <Play size={14} fill="currentColor" /> Practice
                    </button>
                    <button
                      onClick={() => navigate(`/notes?subject_id=${s.id}`)}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      Notes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
