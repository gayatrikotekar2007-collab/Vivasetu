/**
 * ThemeToggle — Pill-style switcher for Blossom and Midnight themes.
 * Usable in TopBar, Login/Register cards, and throughout the app.
 */
import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle({ className = '', style = {} }) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className={`theme-toggle-pill ${className}`}
      style={style}
      role="radiogroup"
      aria-label="Theme selector"
    >
      <button
        type="button"
        role="radio"
        aria-checked={theme === 'blossom'}
        className={`theme-toggle-option ${theme === 'blossom' ? 'active' : ''}`}
        onClick={() => setTheme('blossom')}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
      >
        <span style={{ fontSize: '0.85rem' }}>🌸</span>
        <span>Blossom</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === 'midnight'}
        className={`theme-toggle-option ${theme === 'midnight' ? 'active' : ''}`}
        onClick={() => setTheme('midnight')}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
      >
        <span style={{ fontSize: '0.85rem' }}>🌙</span>
        <span>Midnight</span>
      </button>
    </div>
  )
}
