/**
 * LoginPage — Split-panel card design matching Blossom & Midnight specification.
 * - Left panel (40%): Theme tinted, VivaSetu wordmark + tagline, abstract geometric composition, italicized quote.
 * - Right panel (60%): "Welcome back" heading, email/password inputs, full-width accent button, register link.
 * - Unobtrusive Blossom/Midnight toggle in top corner.
 */
import { useState } from 'react'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import '../styles/globals.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'midnight'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Email and password are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login({ email: form.email, password: form.password })
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password.'
      setError(msg)
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
          maxWidth: '560px',
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
            “Small practice today, big confidence tomorrow.”
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
          <div style={{ marginBottom: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                marginBottom: '0.25rem',
              }}
            >
              Welcome back
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Sign in to resume your viva preparations
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@college.edu"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            {error && <p className="error-text" style={{ marginBottom: '0.75rem' }}>{error}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.7rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
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
            New here?{' '}
            <Link
              to="/register"
              style={{
                color: 'var(--accent-primary)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* About VivaSetu Note */}
      <div
        style={{
          maxWidth: '560px',
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>VivaSetu</strong> is an AI-powered oral examination simulator tailored for Pune engineering students under Savitribai Phule Pune University (SPPU) and autonomous institutes. Practice conversational vivas, track spaced repetition mastery, and prepare with syllabus-aligned question banks.
        </p>
      </div>
    </div>
  )
}
