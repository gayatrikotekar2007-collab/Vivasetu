/**
 * useTheme hook — Access current theme ('blossom' | 'midnight') and setters.
 */
import { useContext } from 'react'
import ThemeContext from '../context/ThemeContext'

export function useTheme() {
  return useContext(ThemeContext)
}

export default useTheme
