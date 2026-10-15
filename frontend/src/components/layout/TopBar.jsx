/**
 * TopBar Component — Header with search bar, theme switcher pill, notifications, and user avatar.
 * Supports Ctrl+K keyboard shortcut to focus the search bar.
 */
import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, LogOut, Search, User as UserIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import ThemeToggle from '../ThemeToggle'

export default function TopBar({ onSearch }) {
  const { user, logout } = useAuth()
  const searchInputRef = useRef(null)
  const [searchValue, setSearchValue] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [hasNotifications] = useState(true)

  // Global Ctrl+K / Cmd+K listener to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearch) onSearch(searchValue)
  }

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Engineer'
  const firstInitial = firstName.charAt(0).toUpperCase()

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 2rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        gap: '1rem',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          flex: '1',
          maxWidth: '520px',
        }}
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '14px',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for topics, questions, or notes..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{
            width: '100%',
            padding: '0.55rem 4rem 0.55rem 2.4rem',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--border-focus)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-color)'
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: '10px',
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '2px 7px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-muted)',
            userSelect: 'none',
          }}
        >
          Ctrl K
        </span>
      </form>

      {/* Right side actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Blossom / Midnight Theme Switcher Pill */}
        <ThemeToggle />

        {/* Notification Bell */}
        <div
          style={{
            position: 'relative',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}
          title="Notifications"
        >
          <Bell size={20} />
          {hasNotifications && (
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#FF3366',
                border: '2px solid var(--bg-card)',
              }}
            />
          )}
        </div>

        {/* User profile dropdown trigger */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowUserMenu((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-primary)',
            }}
          >
            {/* Avatar Circle */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #A855F7, #6366F1)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(168, 85, 247, 0.35)',
              }}
            >
              {firstInitial}
            </div>

            {/* Name + subtext */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.2 }}>
                Hey, {firstName}!
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                Keep going ✨
              </span>
            </div>

            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--card-shadow-hover)',
                minWidth: '180px',
                padding: '0.4rem',
                zIndex: 100,
              }}
            >
              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <UserIcon size={14} />
                Profile &amp; Settings
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false)
                  logout()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-weak)',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
