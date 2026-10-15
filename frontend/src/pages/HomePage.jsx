/**
 * HomePage — Complete redesign matching Blossom (light) and Midnight (dark) reference mockups.
 * Includes:
 *   - Sidebar + TopBar layout
 *   - Greeting with handwritten cursive quote
 *   - 4 pastel/dark tinted stat cards (Streak, Accuracy, Practiced, Exam Countdown)
 *   - Hero banner card with Start Practice CTA and custom SVG vector illustration
 *   - "Your Subjects" with mastery progress and weak/strong badges
 *   - "Recent Practice Sessions" table with score badges and View Report links
 *   - Right column: College & Branch card, Today's Goal interactive checklist + sticky note, bottom motivational paper note
 */
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Flame,
  Globe,
  GraduationCap,
  Lightbulb,
  Play,
  School,
  Target,
  Wifi,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import HeroIllustration from '../components/illustrations/HeroIllustration'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import sessionService from '../services/sessionService'

export default function HomePage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'midnight'

  // Dashboard dynamic stats state
  const [stats, setStats] = useState(null)
  const [_loading, setLoading] = useState(true)

  // Today's Goal daily checklist (persisted in localStorage per day)
  const todayKey = `vivasetu_goals_${user?.id || 'guest'}_${new Date().toISOString().slice(0, 10)}`
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem(todayKey)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return [
      { id: 'g1', text: 'Practice 1 simulated viva session', completed: false },
      { id: 'g2', text: 'Take a 5-question Daily Drill', completed: false },
      { id: 'g3', text: 'Set your university exam date in Profile', completed: false },
      { id: 'g4', text: 'Explore crowdsourced question bank', completed: false },
      { id: 'g5', text: 'Maintain consecutive study streak', completed: false },
    ]
  })

  // Fetch real aggregated data from backend
  useEffect(() => {
    let active = true
    async function loadStats() {
      try {
        const data = await sessionService.getDashboardStats()
        if (active && data) {
          setStats(data)
        }
      } catch {
        // Honest empty state when backend error or offline
        if (active) {
          setStats({
            streak_count: user?.streak_count || 0,
            overall_accuracy: null,
            questions_practiced: 0,
            days_to_exam: null,
            college: {
              name: null,
              is_autonomous: null,
              branch: user?.branch || null,
              syllabus_source: user?.syllabus_mode === 'college_own' ? 'Autonomous Syllabus' : 'SPPU Syllabus',
            },
            subjects: [],
            recent_sessions: [],
          })
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadStats()
    return () => {
      active = false
    }
  }, [user])

  // Persist goals on change
  const toggleGoal = (id) => {
    setGoals((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
      try {
        localStorage.setItem(todayKey, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }

  const completedGoalsCount = goals.filter((g) => g.completed).length
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Gayatri'

  // Rotating quotes (placeholder pool easy to expand)
  const greetingQuote = isDark
    ? '“Discipline today Dreams tomorrow” ~'
    : '“You can and you will.” ♡'

  const stickyNoteQuote = isDark
    ? '“A little progress each day adds up to big results.” :) ⚡'
    : '“A little progress each day adds up to big results.” :) ♡'

  // Subject icon helper
  const renderSubjectIcon = (iconType, index) => {
    const colors = [
      { bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6' },
      { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
      { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
      { bg: 'rgba(6, 182, 212, 0.15)', text: '#06B6D4' },
    ]
    const color = colors[index % colors.length]

    let Icon = Database
    if (iconType === 'code' || index === 0) Icon = GraduationCap
    else if (iconType === 'database' || index === 1) Icon = Database
    else if (iconType === 'cpu' || index === 2) Icon = Cpu
    else if (iconType === 'wifi' || index === 3) Icon = Wifi

    return (
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          background: color.bg,
          color: color.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>
    )
  }

  return (
    <div className="app-layout">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <TopBar />

        <main className="content-container">
          {/* Main 2-Column Grid Layout: Content (left ~72%) + Info (right ~28%) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 340px',
              gap: '1.75rem',
              alignItems: 'start',
            }}
          >
            {/* ── LEFT / MAIN CONTENT FLOW ────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
              {/* 1. Large Greeting Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.15,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    Hey {firstName}!{' '}
                    <span style={{ color: '#F59E0B', display: 'inline-block' }}>⚡</span>
                  </h1>
                  <p
                    style={{
                      fontSize: isDark ? '0.78rem' : '0.95rem',
                      fontWeight: isDark ? 700 : 500,
                      letterSpacing: isDark ? '0.12em' : 'normal',
                      textTransform: isDark ? 'uppercase' : 'none',
                      color: isDark ? 'var(--text-muted)' : 'var(--text-secondary)',
                      marginTop: '0.35rem',
                    }}
                  >
                    {isDark
                      ? 'PRACTICE TODAY. PERFORM TOMORROW.'
                      : 'Small practice today, big confidence tomorrow. 💜'}
                  </p>
                </div>

                {/* Hand-drawn cursive quote in top right */}
                <div
                  className="font-handwriting"
                  style={{
                    fontSize: '1.35rem',
                    color: 'var(--handwriting-color)',
                    transform: 'rotate(-2deg)',
                    lineHeight: 1.2,
                    textAlign: 'right',
                    userSelect: 'none',
                  }}
                >
                  {greetingQuote}
                </div>
              </div>

              {/* 2. Row of 4 Stat Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Stat 1: Day Streak */}
                <div
                  style={{
                    background: 'var(--stat-streak-bg)',
                    border: '1px solid var(--stat-streak-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--stat-streak-icon-bg)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(255, 102, 68, 0.3)',
                    }}
                  >
                    <Flame size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {stats?.streak_count ?? 0}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Day Streak
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--stat-streak-text)',
                        marginTop: '0.2rem',
                      }}
                    >
                      {(stats?.streak_count || 0) > 0
                        ? (isDark ? 'Consistency hits different! →' : "You're on fire! 🔥")
                        : 'Practice today to start!'}
                    </div>
                  </div>
                </div>

                {/* Stat 2: Overall Accuracy */}
                <div
                  style={{
                    background: 'var(--stat-accuracy-bg)',
                    border: '1px solid var(--stat-accuracy-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--stat-accuracy-icon-bg)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <Target size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {stats?.overall_accuracy !== null && stats?.overall_accuracy !== undefined
                        ? `${stats.overall_accuracy}%`
                        : '—'}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Overall Accuracy
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--stat-accuracy-text)',
                        marginTop: '0.2rem',
                      }}
                    >
                      {stats?.overall_accuracy !== null && stats?.overall_accuracy !== undefined
                        ? 'Across evaluated topics'
                        : 'No sessions yet'}
                    </div>
                  </div>
                </div>

                {/* Stat 3: Questions Practiced */}
                <div
                  style={{
                    background: 'var(--stat-questions-bg)',
                    border: '1px solid var(--stat-questions-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--stat-questions-icon-bg)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {stats?.questions_practiced ?? 0}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Questions Practiced
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--stat-questions-text)',
                        marginTop: '0.2rem',
                      }}
                    >
                      {(stats?.questions_practiced || 0) > 0 ? 'Great effort!' : 'Start your first viva!'}
                    </div>
                  </div>
                </div>

                {/* Stat 4: Days to Exam */}
                <div
                  style={{
                    background: 'var(--stat-exam-bg)',
                    border: '1px solid var(--stat-exam-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--stat-exam-icon-bg)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {stats?.days_to_exam !== null && stats?.days_to_exam !== undefined
                        ? stats.days_to_exam
                        : '—'}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Days to Exam
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--stat-exam-text)',
                        marginTop: '0.2rem',
                      }}
                    >
                      {stats?.days_to_exam !== null && stats?.days_to_exam !== undefined
                        ? (isDark ? "You've got this!" : 'Stay consistent!')
                        : 'Set in profile'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Hero Banner Card */}
              <div
                style={{
                  background: 'var(--hero-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '2rem 2.25rem',
                  display: 'grid',
                  gridTemplateColumns: '1.15fr 0.85fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  boxShadow: 'var(--card-shadow)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Left Text & CTA */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: '0.65rem',
                    }}
                  >
                    {isDark
                      ? 'REAL QUESTIONS · REAL PRACTICE · REAL YOU'
                      : 'P R A C T I C E  ·  L E A R N  ·  G R O W'}
                  </div>

                  <h2
                    style={{
                      fontSize: '2.1rem',
                      fontWeight: 900,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.12,
                      color: 'var(--text-primary)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {isDark ? (
                      <>
                        PRACTICE <br />
                        <span style={{ color: 'var(--hero-headline-accent)' }}>
                          WITHOUT LIMITS.
                        </span>
                      </>
                    ) : (
                      <>
                        Viva Practice, <br />
                        <span style={{ color: 'var(--hero-headline-accent)' }}>Your Way</span>
                      </>
                    )}
                  </h2>

                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {isDark ? 'Speak · Think · Improve · Repeat' : 'Talk. Think. Improve.'}
                  </div>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '1.5rem',
                      maxWidth: '440px',
                    }}
                  >
                    {isDark
                      ? 'AI-powered viva simulation with voice interaction, personalized feedback and a community that grows with you.'
                      : 'AI-powered viva simulations with real questions, personalized feedback and a community that gets you.'}
                  </p>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <Link to="/session/new" style={{ textDecoration: 'none' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.7rem 1.4rem', fontSize: '0.88rem' }}
                      >
                        <Play size={16} fill="currentColor" />
                        Start Practice
                        <ArrowRight size={16} />
                      </button>
                    </Link>

                    <Link to="/subjects" style={{ textDecoration: 'none' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.7rem 1.25rem', fontSize: '0.88rem' }}
                      >
                        <BookOpen size={16} />
                        Choose Subjects
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Right Illustration Artwork */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <HeroIllustration />
                </div>
              </div>

              {/* 4. "Your Subjects" Section */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.85rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Your Subjects
                  </h3>
                  <Link
                    to="/subjects"
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    View All <ChevronRight size={14} />
                  </Link>
                </div>

                {/* Subject Cards Horizontal Row */}
                {(!stats?.subjects || stats.subjects.length === 0) ? (
                  <div
                    className="surface"
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <BookOpen size={24} style={{ margin: '0 auto 0.5rem auto', opacity: 0.6 }} />
                    <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No subjects enrolled yet</p>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Configure your branch and year in profile to see relevant curriculum subjects.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.85rem',
                    }}
                  >
                    {stats.subjects.map((subject, idx) => {
                      const mastery = subject.mastery
                      const hasMastery = mastery !== null && mastery !== undefined
                      // Progress bar color based on mastery tiers
                      const barColor =
                        hasMastery && mastery >= 75
                          ? 'var(--color-strong)'
                          : hasMastery && mastery >= 60
                          ? 'var(--accent-primary)'
                          : 'var(--color-warn)'

                      return (
                        <Link
                          key={subject.id || idx}
                          to={`/session/new?subject_id=${subject.id}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <div
                            className="surface"
                            style={{
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.65rem',
                              cursor: 'pointer',
                            }}
                          >
                            {/* Subject Header */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {renderSubjectIcon(subject.icon_type, idx)}
                                <span
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '120px',
                                  }}
                                >
                                  {subject.name}
                                </span>
                              </div>
                              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                            </div>

                            {/* Progress Bar & Percentage */}
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  marginBottom: '0.35rem',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                <span>{hasMastery ? `${mastery}%` : 'Not practiced yet'}</span>
                              </div>
                              <div
                                style={{
                                  height: '6px',
                                  width: '100%',
                                  background: 'var(--bg-input)',
                                  borderRadius: 'var(--radius-full)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: hasMastery ? `${mastery}%` : '0%',
                                    background: barColor,
                                    borderRadius: 'var(--radius-full)',
                                    transition: 'width 0.4s ease',
                                  }}
                                />
                              </div>
                            </div>

                            {/* Weak / Strong Callout */}
                            <div style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                              {hasMastery ? (
                                subject.is_strong ? (
                                  <span style={{ color: 'var(--color-strong)' }}>Strong! 🎉</span>
                                ) : (
                                  <span style={{ color: 'var(--color-weak)' }}>
                                    Weak: {subject.weak_topic || 'Focus needed'}
                                  </span>
                                )
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>Tap to start viva practice</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 5. "Recent Practice Sessions" Section */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} style={{ color: 'var(--text-muted)' }} />
                    <h3
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Recent Practice Sessions
                    </h3>
                  </div>
                  <Link
                    to="/drill"
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    View All <ChevronRight size={14} />
                  </Link>
                </div>

                {/* Session Table / List */}
                {(!stats?.recent_sessions || stats.recent_sessions.length === 0) ? (
                  <div
                    className="surface"
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <Clock size={24} style={{ margin: '0 auto 0.5rem auto', opacity: 0.6 }} />
                    <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No practice sessions yet</p>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: '1rem' }}>
                      Start your first simulated viva session to begin tracking your performance.
                    </p>
                    <Link to="/session/new" className="btn btn-primary" style={{ display: 'inline-flex', fontSize: '0.8rem', padding: '0.45rem 1rem' }}>
                      Start Viva Session
                    </Link>
                  </div>
                ) : (
                  <div
                    className="surface"
                    style={{
                      padding: '0.5rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {stats.recent_sessions.map((sess, i) => {
                      const score = sess.score_percent
                      const hasScore = score !== null && score !== undefined
                      const scoreColor =
                        hasScore && score >= 75
                          ? { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981' }
                          : hasScore && score >= 60
                          ? { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B' }
                          : { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444' }

                      return (
                        <div
                          key={sess.id || i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.85rem 0',
                            borderBottom:
                              i < stats.recent_sessions.length - 1
                                ? '1px solid var(--border-subtle)'
                                : 'none',
                            gap: '1rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* Subject + Topic + Date */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'var(--bg-input)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--accent-primary)',
                              }}
                            >
                              <BookOpen size={16} />
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {sess.subject} – {sess.topic}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {sess.date_formatted}
                              </div>
                            </div>
                          </div>

                          {/* Score + Duration + CTA */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            {hasScore ? (
                              <span
                                style={{
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  background: scoreColor.bg,
                                  color: scoreColor.text,
                                }}
                              >
                                {score}%
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  background: 'var(--bg-input)',
                                }}
                              >
                                Completed
                              </span>
                            )}

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.78rem',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <Clock size={13} />
                              <span>{sess.duration_min || 10} min</span>
                            </div>

                            <Link
                              to={`/session/${sess.id}/results`}
                              style={{ textDecoration: 'none' }}
                            >
                              <button
                                className="btn btn-secondary"
                                style={{
                                  padding: '0.35rem 0.85rem',
                                  fontSize: '0.75rem',
                                  borderRadius: 'var(--radius-full)',
                                }}
                              >
                                View Report
                              </button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN (College, Goal, Motivational Note) ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Card 1: Your College & Branch */}
              <div className="surface" style={{ padding: '1.25rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <School size={17} style={{ color: 'var(--accent-primary)' }} />
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Your College &amp; Branch
                    </h4>
                  </div>
                  <Link
                    to="/profile"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    Edit
                  </Link>
                </div>

                {/* College row with Autonomous badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.65rem 0',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: '#6366F1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <School size={17} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {stats?.college?.name || 'College not set yet'}
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                      {stats?.college?.is_autonomous !== null && stats?.college?.is_autonomous !== undefined ? (
                        <span className="badge badge-verified" style={{ fontSize: '0.62rem' }}>
                          {stats?.college?.is_autonomous ? 'Autonomous' : 'SPPU Affiliated'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Status unverified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Branch / Syllabus row with chevron */}
                <Link
                  to="/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0 0.25rem 0',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        color: '#3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Globe size={17} />
                    </div>
                    <div>
                      <div
                        style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}
                      >
                        {stats?.college?.branch || (user?.academic_year === 'FE' ? 'First Year (Common)' : 'Branch not selected')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ({stats?.college?.syllabus_source || 'SPPU Syllabus'})
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </Link>
              </div>

              {/* Card 2: Today's Goal with progress bar + tilted sticky note */}
              <div
                className="surface"
                style={{
                  padding: '1.25rem',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                {/* Header with fraction */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Lightbulb size={17} style={{ color: '#F59E0B' }} />
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Today's Goal
                    </h4>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {completedGoalsCount}/{goals.length} completed
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    height: '6px',
                    width: '100%',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(completedGoalsCount / goals.length) * 100}%`,
                      background: 'var(--accent-primary)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                {/* Interactive Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {goals.map((g) => (
                    <label
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: g.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: g.completed ? 'line-through' : 'none',
                        userSelect: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: g.completed
                            ? 'none'
                            : '1.5px solid var(--border-color)',
                          background: g.completed
                            ? 'var(--accent-primary)'
                            : 'var(--bg-input)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                        }}
                      >
                        {g.completed && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span>{g.text}</span>
                    </label>
                  ))}
                </div>

                {/* Decorative Tilted Sticky Note on the Right */}
                <div
                  className="font-handwriting"
                  style={{
                    position: 'absolute',
                    right: '-10px',
                    bottom: '15px',
                    background: 'var(--sticky-bg)',
                    color: 'var(--sticky-text)',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '1.05rem',
                    lineHeight: '1.2',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    transform: 'rotate(5deg)',
                    maxWidth: '110px',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  Progress
                  <br />
                  over
                  <br />
                  Perfection ♡
                </div>
              </div>

              {/* Card 3: Motivational Handwritten Paper Note */}
              <div
                style={{
                  background: 'var(--sticky-paper-bg)',
                  border: '1px solid var(--sticky-paper-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem 1.35rem',
                  boxShadow: 'var(--card-shadow)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Subtle paper line accents */}
                <div
                  className="font-handwriting"
                  style={{
                    fontSize: '1.35rem',
                    lineHeight: '1.35',
                    color: 'var(--handwriting-color)',
                    userSelect: 'none',
                  }}
                >
                  {stickyNoteQuote}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
