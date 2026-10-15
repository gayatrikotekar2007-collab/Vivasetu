/**
 * RegisterPage — Split-panel card design matching Blossom & Midnight specification.
 * Identical structure to LoginPage with full_name input and login link.
 */
import { useState } from 'react'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import '../styles/globals.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'midnight'

  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
    setServerError('')
  }

  function validate() {
    const errs = {}
    if (!form.full_name.trim()) errs.full_name = 'Full name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    if (!form.password) errs.password = 'Password is required.'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    setServerError('')
    try {
      await register(form)
      navigate('/onboarding')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setServerError(detail)
      } else if (Array.isArray(detail)) {
        setServerError(detail.map((d) => d.msg).join(' '))
      } else {
        setServerError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      {/* Top Bar Floating Theme Toggle */}
      <div
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '2rem',
          zIndex: 10,
        }}
      >
        <ThemeToggle />
      </div>

      {/* Split-panel card */}
      <div
        className="surface-elevated"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 42%) minmax(260px, 58%)',
          width: '100%',
          maxWidth: '580px',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--card-shadow-hover)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* ── LEFT PANEL (~40%) ──────────────────────────────────── */}
        <div
          style={{
            background: isDark
              ? 'linear-gradient(145deg, #181530 0%, #12172C 100%)'
              : 'linear-gradient(145deg, #FFEBF0 0%, #FFF2F6 100%)',
            borderRight: '1px solid var(--border-subtle)',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                }}
              >
                <GraduationCap size={18} />
              </div>
              <span
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}
              >
                VivaSetu
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
              Practice Today. Perform Tomorrow.
            </p>
          </div>

          {/* Abstract flat decorative graphic */}
          <div
            style={{
              margin: '2rem 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
              <div
                style={{
                  width: '12px',
                  height: '38px',
                  borderRadius: '6px',
                  background: 'var(--accent-primary)',
                  opacity: 0.85,
                }}
              />
              <div
                style={{
                  width: '12px',
                  height: '54px',
                  borderRadius: '6px',
                  background: isDark ? '#38BDF8' : '#F472B6',
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  width: '12px',
                  height: '24px',
                  borderRadius: '6px',
                  background: isDark ? '#A855F7' : '#FBBF24',
                  opacity: 0.8,
                }}
              />
              <div
                style={{
                  width: '12px',
                  height: '46px',
                  borderRadius: '6px',
                  background: '#10B981',
                  opacity: 0.85,
                }}
              />
            </div>
            <div
              style={{
                width: '70px',
                height: '4px',
                borderRadius: '2px',
                background: 'var(--border-color)',
              }}
            />
          </div>

          {/* Encouraging italicized quote */}
          <div
            style={{
              fontSize: '0.78rem',
              fontStyle: 'italic',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
            }}
          >
            “Discipline today, dreams tomorrow.”
          </div>
        </div>

        {/* ── RIGHT PANEL (~60%) ─────────────────────────────────── */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '2.25rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ marginBottom: '1.25rem' }}>
            <h2
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                marginBottom: '0.25rem',
              }}
            >
              Create an account
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Join engineers practicing viva simulation
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                className="form-input"
                placeholder="Priya Sharma"
                value={form.full_name}
                onChange={handleChange}
                autoFocus
              />
              {errors.full_name && <p className="error-text">{errors.full_name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="email">College / Personal Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@college.edu"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            {serverError && <p className="error-text" style={{ marginBottom: '0.75rem' }}>{serverError}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.7rem' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: 'var(--accent-primary)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
