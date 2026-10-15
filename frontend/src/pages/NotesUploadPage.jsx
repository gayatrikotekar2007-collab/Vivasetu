/**
 * NotesUploadPage — Study Material & Shared Lecture Notes.
 * Allows uploading notes or using peer-shared notes for autonomous syllabus viva simulations.
 * Redesigned with Blossom & Midnight design system.
 */
import { useEffect, useState } from 'react'
import {
  CheckCircle,
  FileText,
  Play,
  UploadCloud,
  Users,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import { useAuth } from '../hooks/useAuth'
import notesService from '../services/notesService'
import subjectService from '../services/subjectService'
import '../styles/globals.css'

export default function NotesUploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const querySubjectId = searchParams.get('subject_id') || ''

  const [subjects, setSubjects] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState(querySubjectId)
  const [existingNotes, setExistingNotes] = useState(null)
  const [uploadedDateStr, setUploadedDateStr] = useState('')
  const [loadingCheck, setLoadingCheck] = useState(false)

  // Upload form state
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)

  // Load user's subjects
  useEffect(() => {
    if (!user?.branch || !user?.academic_year) return
    subjectService
      .listSubjects(user.branch, user.academic_year)
      .then((data) => {
        setSubjects(data)
        if (!selectedSubjectId && data.length > 0) {
          setSelectedSubjectId(data[0].id)
        }
      })
      .catch(() => setSubjects([]))
  }, [user?.branch, user?.academic_year, selectedSubjectId])

  // Check existing notes
  useEffect(() => {
    if (!user?.college_id || !user?.branch || !selectedSubjectId) return

    let cancelled = false
    setLoadingCheck(true)
    setError('')

    notesService
      .checkNotes({
        college_id: user.college_id,
        branch: user.branch,
        subject_id: selectedSubjectId,
      })
      .then((res) => {
        if (cancelled) return
        if (res.exists && res.document) {
          setExistingNotes(res.document)
          setUploadedDateStr(res.document.uploaded_at ? new Date(res.document.uploaded_at).toLocaleDateString() : '')
          setShowUploadForm(false)
        } else {
          setExistingNotes(null)
          setUploadedDateStr('')
          setShowUploadForm(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExistingNotes(null)
          setShowUploadForm(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCheck(false)
      })

    return () => {
      cancelled = true
    }
  }, [user?.college_id, user?.branch, selectedSubjectId])

  async function handleUpload(e) {
    e.preventDefault()
    if (!file || !selectedSubjectId) return

    setError('')
    setUploading(true)

    try {
      const res = await notesService.uploadNotes({
        file,
        college_id: user.college_id,
        branch: user.branch,
        subject_id: selectedSubjectId,
      })
      setExistingNotes(res.document)
      setUploadedDateStr(new Date().toLocaleDateString())
      setShowUploadForm(false)
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload study notes.')
    } finally {
      setUploading(false)
    }
  }

  function handleUseExisting() {
    if (!existingNotes) return
    navigate(`/session/new?subject_id=${selectedSubjectId}&notes_document_id=${existingNotes.id}`)
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <TopBar />
        <main className="content-container" style={{ maxWidth: '900px' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Study Material &amp; Notes
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Upload professor slides or lecture notes so the AI examiner asks questions tailored to your college syllabus
            </p>
          </div>

          {/* Subject Picker Card */}
          <div
            className="surface"
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Select Subject:
            </label>
            <select
              className="form-input"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              style={{ flex: 1, maxWidth: '350px' }}
            >
              {(subjects ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>}

          {/* Loading status */}
          {loadingCheck ? (
            <div className="surface" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Checking for existing college notes...
            </div>
          ) : (
            <>
              {/* Existing Notes Available */}
              {existingNotes && (
                <div
                  className="surface-elevated"
                  style={{
                    padding: '2rem',
                    borderRadius: 'var(--radius-xl)',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--accent-primary-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: 'var(--color-strong)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                        Class Notes Already Available!
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Uploaded by a peer from your college ({uploadedDateStr || 'Recently'})
                      </p>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '1rem 0 1.5rem 0', lineHeight: 1.5 }}>
                    Your college batchmates have already contributed lecture material for this subject. You can start a targeted viva simulation immediately.
                  </p>

                  <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <button onClick={handleUseExisting} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                      <Play size={16} fill="currentColor" /> Practice Using These Notes
                    </button>
                    <button
                      onClick={() => setShowUploadForm(!showUploadForm)}
                      className="btn btn-secondary"
                    >
                      {showUploadForm ? 'Cancel Upload' : 'Upload Newer Version'}
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Form */}
              {showUploadForm && (
                <div
                  className="surface"
                  style={{
                    padding: '2rem',
                    borderRadius: 'var(--radius-xl)',
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'var(--accent-primary-subtle)',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem auto',
                      }}
                    >
                      <UploadCloud size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Upload Lecture Notes / PDF</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Supported formats: PDF, DOCX, TXT (Max 25MB)
                    </p>
                  </div>

                  <form onSubmit={handleUpload}>
                    <div
                      style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2.5rem 1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--bg-input)',
                        marginBottom: '1.5rem',
                        transition: 'border-color 0.2s ease',
                      }}
                      onClick={() => document.getElementById('notes-file-input')?.click()}
                    >
                      <FileText size={32} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {file ? file.name : 'Click to select or drop files here'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Upload slides, handouts, or handwritten notes'}
                      </div>
                      <input
                        id="notes-file-input"
                        type="file"
                        accept=".pdf,.docx,.txt"
                        style={{ display: 'none' }}
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    {/* Shared Community Disclosure Banner */}
                    <div
                      style={{
                        background: 'var(--accent-primary-subtle)',
                        border: '1px solid var(--accent-primary-border)',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        fontSize: '0.8rem',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      <Users size={16} flexShrink={0} />
                      <span>
                        <strong>Shared Campus Resource:</strong> Uploaded materials are indexed so your college peers can also practice with these notes.
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={uploading || !file}
                        style={{ padding: '0.65rem 1.5rem' }}
                      >
                        {uploading ? 'Processing & Indexing...' : 'Upload Notes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
