/**
 * ThemeContext — Manages Blossom (light) and Midnight (dark) themes.
 * Sets data-theme="blossom" | "midnight" on document.documentElement.
 * Persists choice in localStorage ('vivasetu-theme').
 */
import { createContext, useEffect, useState } from 'react'

const THEME_KEY = 'vivasetu-theme'

const ThemeContext = createContext({
  theme: 'blossom',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'midnight' || saved === 'blossom') return saved
    } catch {
      // fallback
    }
    return 'blossom'
  })

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // ignore
    }
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = (newTheme) => {
    if (newTheme === 'midnight' || newTheme === 'blossom') {
      setThemeState(newTheme)
    }
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'blossom' ? 'midnight' : 'blossom'))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
export default ThemeContext
