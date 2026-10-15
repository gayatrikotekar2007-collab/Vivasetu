/**
 * OnboardingPage — 4-Step guided profile onboarding tied to real SPPU data.
 * - Step 1: College search-as-you-type, DTE code display, autonomy status, report correction modal & add college fallback
 * - Step 2: Syllabus mode (adaptive: SPPU vs College's own with collaborative sharing disclosure)
 * - Step 3: Academic Year (FE, SE, TE, BE)
 * - Step 4: Branch of Study (FE skips branch selection with SPPU common explanation; SE/TE/BE loads 24 branches dynamically)
 */
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Flag,
  Info,
  School,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'
import authService from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import '../styles/globals.css'

const YEARS = [
  { value: 'FE', label: 'FE — First Year (Fresher)', desc: 'Common curriculum across all SPPU programs' },
  { value: 'SE', label: 'SE — Second Year', desc: 'Core branch subjects & laboratory practicals' },
  { value: 'TE', label: 'TE — Third Year', desc: 'Advanced engineering fundamentals' },
  { value: 'BE', label: 'BE — Final Year', desc: 'Specializations & capstone projects' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const [step, setStep] = useState(1)
  const [collegeQuery, setCollegeQuery] = useState('')
  const [collegeResults, setCollegeResults] = useState([])
  const [selectedCollege, setSelectedCollege] = useState(null)
  const [addingNew, setAddingNew] = useState(false)
  const [newCollegeName, setNewCollegeName] = useState('')
  const [newCollegeCity, setNewCollegeCity] = useState('Pune')
  const [syllabusMode, setSyllabusMode] = useState('sppu')

  // Academic year and branch
  const [academicYear, setAcademicYear] = useState('')
  const [branch, setBranch] = useState('')
  const [branchesList, setBranchesList] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  // Autonomy correction modal state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [correctionTarget, setCorrectionTarget] = useState(null)
  const [suggestedAutonomy, setSuggestedAutonomy] = useState(true)
  const [correctionReason, setCorrectionReason] = useState('')
  const [correctionStatus, setCorrectionStatus] = useState('')
  const [submittingCorrection, setSubmittingCorrection] = useState(false)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Debounced college search
  useEffect(() => {
    if (!collegeQuery || collegeQuery.trim().length < 2) {
      setCollegeResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/v1/colleges/search?q=${encodeURIComponent(collegeQuery.trim())}`)
        setCollegeResults(res.data || [])
      } catch {
        setCollegeResults([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [collegeQuery])

  // Load 24 branches when reaching branch step or early
  useEffect(() => {
    async function fetchBranches() {
      setLoadingBranches(true)
      try {
        const res = await api.get('/api/v1/subjects/branches')
        setBranchesList(res.data || [])
      } catch {
        // Fallback default list if API fails
        setBranchesList([])
      } finally {
        setLoadingBranches(false)
      }
    }
    fetchBranches()
  }, [])

  function handleSelectCollege(college) {
    setSelectedCollege(college)
    setCollegeQuery(college.name)
    setCollegeResults([])
    // Adaptive default for syllabus mode
    if (college.is_autonomous === true) {
      setSyllabusMode('college_own')
    } else {
      setSyllabusMode('sppu')
    }
    setStep(2)
  }

  async function handleAddCollege() {
    if (!newCollegeName.trim()) {
      setError('Please enter your college name.')
      return
    }
    setError('')
    try {
      const res = await api.post('/api/v1/colleges', {
        name: newCollegeName.trim(),
        city: newCollegeCity.trim() || 'Pune',
      })
      setSelectedCollege(res.data)
      setAddingNew(false)
      setSyllabusMode('sppu')
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not add college. Please try again.')
    }
  }

  async function handleReportCorrection(e) {
    e.preventDefault()
    if (!correctionReason.trim() || correctionReason.trim().length < 5) {
      setCorrectionStatus('Please provide a specific reason (at least 5 characters).')
      return
    }
    setSubmittingCorrection(true)
    setCorrectionStatus('')
    try {
      await api.post(`/api/v1/colleges/${correctionTarget.id}/report-autonomy`, {
        is_autonomous: suggestedAutonomy,
        reason: correctionReason.trim(),
      })
      setCorrectionStatus('Thank you! Your correction has been submitted for verification.')
      setTimeout(() => {
        setShowCorrectionModal(false)
        setCorrectionStatus('')
        setCorrectionReason('')
      }, 1800)
    } catch (err) {
      setCorrectionStatus(err.response?.data?.detail || 'Failed to submit correction.')
    } finally {
      setSubmittingCorrection(false)
    }
  }

  async function handleFinish() {
    setSaving(true)
    setError('')
    try {
      const payload = {
        college_id: selectedCollege?.id,
        syllabus_mode: syllabusMode,
        academic_year: academicYear,
        // For FE, branch remains null (common curriculum)
        branch: academicYear === 'FE' ? null : branch,
      }
      await authService.updateProfile(payload)
      await refreshUser()
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile. Please check all fields.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
      }}
    >
      {/* Top Bar Theme Toggle */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '2rem' }}>
        <ThemeToggle />
      </div>

      <div
        className="surface-elevated"
        style={{
          width: '100%',
          maxWidth: '620px',
          padding: '2.5rem 2.25rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Step Indicator Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-primary)' }}>
              Step {step} of 4
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {step === 1 && 'College'}
              {step === 2 && 'Syllabus'}
              {step === 3 && 'Academic Year'}
              {step === 4 && (academicYear === 'FE' ? 'Curriculum' : 'Branch')}
            </span>
          </div>

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
                width: `${(step / 4) * 100}%`,
                background: 'var(--accent-primary)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-danger-subtle, rgba(239, 68, 68, 0.1))',
            color: 'var(--accent-danger, #ef4444)',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: College Selection ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              Select Your College
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Search across 70+ official SPPU-affiliated and autonomous engineering institutions in Pune.
            </p>

            {!addingNew ? (
              <div>
                <div className="form-group">
                  <label>Search College Name or DTE Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. PICT, VIT, PCCOE, Sinhgad, 06271..."
                    value={collegeQuery}
                    onChange={(e) => setCollegeQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* College Search Results Dropdown */}
                {collegeResults.length > 0 && (
                  <div
                    style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)',
                      marginBottom: '1rem',
                    }}
                  >
                    {collegeResults.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: '0.85rem 1rem',
                          borderBottom: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        <div
                          style={{ cursor: 'pointer', flex: 1 }}
                          onClick={() => handleSelectCollege(c)}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {c.city} {c.sppu_college_code ? `• DTE Code: ${c.sppu_college_code}` : ''}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span
                            className={
                              c.is_autonomous === true
                                ? 'badge badge-autonomous'
                                : c.is_autonomous === false
                                ? 'badge badge-verified'
                                : 'badge badge-unverified'
                            }
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              background:
                                c.is_autonomous === true
                                  ? 'rgba(168, 85, 247, 0.15)'
                                  : c.is_autonomous === false
                                  ? 'rgba(59, 130, 246, 0.15)'
                                  : 'rgba(156, 163, 175, 0.2)',
                              color:
                                c.is_autonomous === true
                                  ? '#a855f7'
                                  : c.is_autonomous === false
                                  ? '#3b82f6'
                                  : 'var(--text-muted)',
                            }}
                          >
                            {c.is_autonomous === true
                              ? 'Autonomous'
                              : c.is_autonomous === false
                              ? 'SPPU Affiliated'
                              : 'Status Unknown'}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCorrectionTarget(c)
                              setSuggestedAutonomy(!c.is_autonomous)
                              setShowCorrectionModal(true)
                            }}
                            title="Report correction"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.68rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '0',
                            }}
                          >
                            <Flag size={10} /> Report correction
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {collegeQuery.trim().length >= 2 && collegeResults.length === 0 && (
                  <div style={{
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                  }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      No registered college found matching "{collegeQuery}".
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => {
                        setNewCollegeName(collegeQuery)
                        setAddingNew(true)
                      }}
                    >
                      + Add "{collegeQuery}"
                    </button>
                  </div>
                )}

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setAddingNew(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Can't find your college? Add a new one →
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label>College Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter full college name..."
                    value={newCollegeName}
                    onChange={(e) => setNewCollegeName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label>City / Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Pune"
                    value={newCollegeCity}
                    onChange={(e) => setNewCollegeCity(e.target.value)}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Newly added colleges start with autonomy status as 'Unknown' and will default to standard SPPU syllabus.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAddingNew(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddCollege}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Syllabus Mode Selection ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              Syllabus Curriculum
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              College: <strong>{selectedCollege?.name}</strong>{' '}
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                ({selectedCollege?.is_autonomous === true
                  ? 'Autonomous'
                  : selectedCollege?.is_autonomous === false
                  ? 'SPPU Affiliated'
                  : 'Status Unknown'})
              </span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <label
                onClick={() => setSyllabusMode('sppu')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: syllabusMode === 'sppu' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: syllabusMode === 'sppu' ? 'var(--accent-primary-subtle)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Standard SPPU Syllabus
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    Savitribai Phule Pune University official engineering curriculum and university viva pattern.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setSyllabusMode('college_own')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: syllabusMode === 'college_own' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: syllabusMode === 'college_own' ? 'var(--accent-primary-subtle)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  <School size={20} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    College's Own Syllabus
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    Custom curriculum tailored to your autonomous college, powered by peer-uploaded lecture slides and notes.
                  </div>
                </div>
              </label>
            </div>

            {syllabusMode === 'college_own' && (
              <div style={{
                marginTop: '1.25rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                display: 'flex',
                gap: '0.65rem',
                alignItems: 'flex-start',
              }}>
                <Info size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  <strong>Collaborative Learning:</strong> Lecture notes and slides uploaded for autonomous colleges will be shared with future students from your college in the same branch and subject to build a collaborative question bank.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(3)}
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Academic Year Selection ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              Academic Year
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Which year of engineering are you currently studying in?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {YEARS.map((y) => (
                <button
                  key={y.value}
                  type="button"
                  onClick={() => {
                    setAcademicYear(y.value)
                    if (y.value === 'FE') {
                      setBranch('')
                    }
                  }}
                  style={{
                    padding: '1.1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: academicYear === y.value ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: academicYear === y.value ? 'var(--accent-primary-subtle)' : 'var(--bg-card)',
                    color: academicYear === y.value ? 'var(--accent-primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.2rem' }}>{y.value}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {y.desc}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(2)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!academicYear}
                onClick={() => setStep(4)}
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Branch of Study or FE Common Curriculum Confirmation ── */}
        {step === 4 && (
          <div>
            {academicYear === 'FE' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                  <Sparkles size={22} style={{ color: 'var(--accent-primary)' }} />
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    First Year Common Curriculum
                  </h2>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  First Year (FE) engineering under SPPU is completely common across all programs. You do not need to choose a specific branch.
                </p>

                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1.5rem',
                }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    What this includes:
                  </h4>
                  <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: 1.6, margin: 0 }}>
                    <li><strong>Semester 1:</strong> All 11 foundational subjects including Engineering Mathematics I, Physics, Chemistry, Basic Electrical, Basic Electronics, and Mechanics.</li>
                    <li><strong>Semester 2:</strong> Core Semester 2 subjects plus alternating division group subjects.</li>
                    <li><strong>Zero Hassle:</strong> Full access to all FE vivas, drills, and flashcards immediately.</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(3)}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={handleFinish}
                  >
                    {saving ? 'Completing Setup...' : 'Finish Setup'}
                    <Check size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Engineering Branch
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Select your engineering branch from the 24 official SPPU programs.
                </p>

                {loadingBranches ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Loading branches...</p>
                ) : (
                  <div className="form-group">
                    <label>Discipline</label>
                    <select
                      className="form-input"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    >
                      <option value="">-- Choose your branch --</option>
                      {branchesList.map((b) => (
                        <option key={b.id || b.name} value={b.name}>
                          {b.name} {b.has_curriculum ? '' : ' (Curriculum coming soon)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {branch && branchesList.find((b) => b.name === branch)?.has_curriculum === false && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                  }}>
                    <strong>Note:</strong> Standard curriculum for <em>{branch}</em> is being digitized. You can complete onboarding now and suggest missing subjects or upload lecture notes anytime!
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(3)}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving || !branch}
                    onClick={handleFinish}
                  >
                    {saving ? 'Completing Setup...' : 'Finish Setup'}
                    <Check size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Autonomy Correction Modal */}
      {showCorrectionModal && correctionTarget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 1000,
        }}>
          <div className="surface-elevated" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '2rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Report Autonomy Correction
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Help keep SPPU college autonomy records up to date.
            </p>

            <div style={{ fontSize: '0.84rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              College: <strong>{correctionTarget.name}</strong>
            </div>

            <form onSubmit={handleReportCorrection}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Suggested Status</label>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="autonomy"
                      checked={suggestedAutonomy === true}
                      onChange={() => setSuggestedAutonomy(true)}
                    />
                    Autonomous
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="autonomy"
                      checked={suggestedAutonomy === false}
                      onChange={() => setSuggestedAutonomy(false)}
                    />
                    SPPU Affiliated
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Reason / Reference</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. UGC granted autonomous status starting academic year 2023-24."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  required
                />
              </div>

              {correctionStatus && (
                <p style={{
                  fontSize: '0.8rem',
                  color: correctionStatus.includes('Thank you') ? 'var(--accent-success, #22c55e)' : 'var(--accent-danger, #ef4444)',
                  marginTop: '0.75rem',
                }}>
                  {correctionStatus}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCorrectionModal(false)}
                  disabled={submittingCorrection}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingCorrection}
                >
                  {submittingCorrection ? 'Submitting...' : 'Submit Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
