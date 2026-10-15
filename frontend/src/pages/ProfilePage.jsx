/**
 * ProfilePage — Student settings, college & branch preferences, and exam countdown date.
 * Redesigned with Blossom & Midnight design system.
 */
import { useEffect, useState } from 'react'
import {
  Calendar,
  Flag,
  Save,
  School,
  User,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import { useAuth } from '../hooks/useAuth'
import authService from '../services/authService'
import collegeService from '../services/collegeService'
import { safeArray } from '../utils/guards'
import '../styles/globals.css'

const BRANCHES = [
  'Computer Engineering',
  'Information Technology',
  'Electronics and Telecommunication Engineering (E&TC)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Artificial Intelligence and Data Science (AI&DS)',
  'Automation and Robotics',
  'Chemical Engineering',
  'Instrumentation and Control Engineering',
  'Biotechnology',
  'Production Engineering',
  'Metallurgy and Material Science',
  'Printing and Packaging Technology',
  'Aerospace Engineering',
  'Agricultural Engineering',
  'Automobile Engineering',
  'Biomedical Engineering',
  'Environmental Engineering',
  'Industrial Engineering',
  'Mining Engineering',
  'Petroleum Engineering',
  'Polymer Engineering',
  'Textile Engineering',
  'Other',
]

const YEARS = [
  { value: 'FE', label: 'FE — First Year' },
  { value: 'SE', label: 'SE — Second Year' },
  { value: 'TE', label: 'TE — Third Year' },
  { value: 'BE', label: 'BE — Final Year' },
]

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()

  // Form states
  const [collegeQuery, setCollegeQuery] = useState('')
  const [collegeResults, setCollegeResults] = useState([])
  const [selectedCollege, setSelectedCollege] = useState(null)
  const [branch, setBranch] = useState(() => user?.branch || '')
  const [branchOther, setBranchOther] = useState(() => user?.branch_other || '')
  const [academicYear, setAcademicYear] = useState(() => user?.academic_year || '')
  const [syllabusMode, setSyllabusMode] = useState(() => user?.syllabus_mode || 'sppu')
  const [examDate, setExamDate] = useState(() => user?.exam_date || '')

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Autonomy correction modal
  const [showAutonomyModal, setShowAutonomyModal] = useState(false)
  const [suggestedAutonomy, setSuggestedAutonomy] = useState(true)
  const [correctionReason, setCorrectionReason] = useState('')
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false)
  const [correctionSuccess, setCorrectionSuccess] = useState(false)
  const [correctionError, setCorrectionError] = useState(null)

  useEffect(() => {
    if (!collegeQuery || collegeQuery.trim().length < 2) return
    const timer = setTimeout(async () => {
      try {
        const results = await collegeService.searchColleges(collegeQuery.trim())
        setCollegeResults(safeArray(results))
      } catch {
        setCollegeResults([])
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [collegeQuery])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const payload = {
        branch: branch || null,
        branch_other: branch === 'Other' ? branchOther.trim() : null,
        academic_year: academicYear || null,
        syllabus_mode: syllabusMode || null,
        exam_date: examDate || null,
      }
      if (selectedCollege) {
        payload.college_id = selectedCollege.id
      }
      await authService.updateProfile(payload)
      await refreshUser()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitCorrection = async (e) => {
    e.preventDefault()
    const collegeId = selectedCollege?.id || user?.college_id
    if (!collegeId || !correctionReason.trim() || isSubmittingCorrection) return

    setIsSubmittingCorrection(true)
    setCorrectionError(null)
    setCorrectionSuccess(false)

    try {
      await collegeService.reportAutonomy(collegeId, suggestedAutonomy, correctionReason.trim())
      setCorrectionSuccess(true)
      setCorrectionReason('')
      setTimeout(() => {
        setShowAutonomyModal(false)
        setCorrectionSuccess(false)
      }, 2000)
    } catch (err) {
      setCorrectionError(err.response?.data?.detail || 'Failed to submit correction.')
    } finally {
      setIsSubmittingCorrection(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <TopBar />
        <main className="content-container" style={{ maxWidth: '920px' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Profile &amp; Exam Settings
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Manage your college, discipline, and target examination schedule
            </p>
          </div>

          {saveSuccess && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid var(--color-strong)',
                color: 'var(--color-strong)',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              ✓ Profile settings updated successfully!
            </div>
          )}

          {saveError && <p className="error-text" style={{ marginBottom: '1.5rem' }}>{saveError}</p>}

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Account Overview Card */}
            <div className="surface" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <User size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Account Credentials</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    FULL NAME
                  </label>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                    {user?.full_name || 'Engineering Student'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    EMAIL ADDRESS
                  </label>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Settings Card */}
            <div className="surface" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <School size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>College &amp; Branch</h3>
              </div>

              {/* College */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label>College of Engineering</label>
                  <button
                    type="button"
                    onClick={() => setShowAutonomyModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Flag size={12} /> Report Autonomy Status
                  </button>
                </div>

                {selectedCollege ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700 }}>{selectedCollege.name}</span>
                      <span className="badge badge-verified" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                        {selectedCollege.is_autonomous ? 'Autonomous' : 'SPPU Affiliated'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedCollege(null)}
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search to update college..."
                      value={collegeQuery}
                      onChange={(e) => setCollegeQuery(e.target.value)}
                    />
                    {collegeResults.length > 0 && (
                      <div
                        style={{
                          maxHeight: '150px',
                          overflowY: 'auto',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-card)',
                          marginTop: '0.35rem',
                        }}
                      >
                        {collegeResults.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCollege(c)
                              setCollegeQuery('')
                              setCollegeResults([])
                            }}
                            style={{
                              padding: '0.6rem 0.9rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-subtle)',
                              fontSize: '0.85rem',
                            }}
                          >
                            {c.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Branch */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Branch {academicYear === 'FE' && <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 500 }}>(Optional for First Year — common curriculum)</span>}</label>
                <select
                  className="form-input"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                >
                  <option value="">{academicYear === 'FE' ? 'Common First Year (Branch not required)' : 'Select Branch'}</option>
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {branch === 'Other' && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Specify Other Branch</label>
                  <input
                    type="text"
                    className="form-input"
                    value={branchOther}
                    onChange={(e) => setBranchOther(e.target.value)}
                  />
                </div>
              )}

              {/* Academic Year */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Academic Year</label>
                <select
                  className="form-input"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  <option value="">Select Year</option>
                  {YEARS.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Syllabus Mode */}
              <div className="form-group">
                <label>Syllabus Mode</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="radio"
                      name="syllabusMode"
                      value="sppu"
                      checked={syllabusMode === 'sppu'}
                      onChange={() => setSyllabusMode('sppu')}
                    />
                    SPPU Standard Curriculum
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="radio"
                      name="syllabusMode"
                      value="college_own"
                      checked={syllabusMode === 'college_own'}
                      onChange={() => setSyllabusMode('college_own')}
                    />
                    Autonomous College Notes
                  </label>
                </div>
              </div>
            </div>

            {/* Target Exam Date Card */}
            <div className="surface" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Target Examination Date</h3>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Powers the Days-to-Exam countdown widget on your dashboard to keep you on schedule.
              </p>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', maxWidth: '380px' }}>
                <input
                  type="date"
                  className="form-input"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
                {examDate && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setExamDate('')}
                    style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
                style={{ padding: '0.7rem 2rem' }}
              >
                <Save size={16} />
                {isSaving ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>
          </form>

          {/* Autonomy Report Modal */}
          {showAutonomyModal && (
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
                  maxWidth: '500px',
                  width: '100%',
                  padding: '2rem',
                  borderRadius: 'var(--radius-xl)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Report College Autonomy Status</h3>
                  <button
                    onClick={() => setShowAutonomyModal(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Autonomy status can change over time. Help keep our records accurate by reporting updates.
                </p>

                {correctionSuccess && (
                  <p style={{ color: 'var(--color-strong)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>
                    ✓ Report submitted for admin review!
                  </p>
                )}
                {correctionError && <p className="error-text" style={{ marginBottom: '1rem' }}>{correctionError}</p>}

                <form onSubmit={handleSubmitCorrection}>
                  <div className="form-group">
                    <label>Suggested Status</label>
                    <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.35rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="radio"
                          name="suggestedAutonomy"
                          checked={suggestedAutonomy === true}
                          onChange={() => setSuggestedAutonomy(true)}
                        />
                        Autonomous
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="radio"
                          name="suggestedAutonomy"
                          checked={suggestedAutonomy === false}
                          onChange={() => setSuggestedAutonomy(false)}
                        />
                        SPPU Affiliated
                      </label>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label>Reason / Source</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="e.g. Official circular on university website, autonomous status granted from 2024 batch..."
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowAutonomyModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmittingCorrection || !correctionReason.trim()}
                    >
                      {isSubmittingCorrection ? 'Submitting...' : 'Submit Report'}
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
