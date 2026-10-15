/**
 * Sidebar Component — Persistent left navigation.
 * Logo, tagline, active item highlights (Blossom coral/pink pill, Midnight violet pill),
 * and motivational stacked books doodle at bottom.
 */
import { useState } from 'react'
import {
  BarChart2,
  BookOpen,
  Calendar,
  ChevronsRight,
  FileText,
  GraduationCap,
  Home,
  Play,
  Settings,
  Users,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import SidebarDoodle from '../illustrations/SidebarDoodle'

export default function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Start Practice', path: '/session/new', icon: Play },
    { label: 'My Progress', path: '/drill', icon: BarChart2 },
    { label: 'Question Bank', path: '/questions', icon: FileText },
    { label: 'Study Material', path: '/notes', icon: BookOpen },
    { label: 'Community', path: '/questions?tab=community', icon: Users },
    { label: 'Exam Countdown', path: '/profile', icon: Calendar },
    { label: 'Settings', path: '/profile', icon: Settings },
  ]

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '230px',
        minWidth: collapsed ? '72px' : '230px',
        minHeight: '100vh',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 0.75rem 1rem 0.75rem',
        transition: 'width 0.25s ease, background-color 0.25s ease, border-color 0.25s ease',
        userSelect: 'none',
      }}
    >
      {/* Top Header & Navigation */}
      <div>
        {/* Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.25rem 0.5rem 1.25rem 0.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              color: 'inherit',
              overflow: 'hidden',
            }}
          >
            {/* Logo Icon */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 3px 10px rgba(79, 70, 229, 0.3)',
                flexShrink: 0,
              }}
            >
              <GraduationCap size={20} />
            </div>

            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    color: 'var(--text-primary)',
                  }}
                >
                  VivaSetu
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Practice Today. Perform Tomorrow.
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronsRight size={16} />
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)

            return (
              <Link
                key={item.label}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: collapsed ? '0.65rem 0' : '0.65rem 0.85rem',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-full)',
                  textDecoration: 'none',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: isActive ? 'var(--accent-primary-subtle)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
                }}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Doodle & Stacked Books */}
      {!collapsed && <SidebarDoodle />}
    </aside>
  )
}
