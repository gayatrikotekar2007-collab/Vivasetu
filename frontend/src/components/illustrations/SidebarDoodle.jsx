/**
 * SidebarDoodle — Decorative hand-drawn caption & stacked books at sidebar bottom.
 * "Same Students Stronger Engineers :)" + Stacked aesthetic books (DISCIPLINE, CONSISTENCY, BETTER YOU).
 */
import { useTheme } from '../../hooks/useTheme'

export default function SidebarDoodle({ className = '' }) {
  const { theme } = useTheme()
  const isDark = theme === 'midnight'

  return (
    <div className={`sidebar-doodle-container ${className}`} style={{ padding: '1rem 0.5rem 0.5rem 0.5rem' }}>
      {/* Hand-drawn caption */}
      <div
        className="font-handwriting"
        style={{
          fontSize: '1.15rem',
          lineHeight: '1.25',
          color: 'var(--handwriting-color)',
          marginBottom: '0.85rem',
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        Same Students
        <br />
        Stronger Engineers
        <span style={{ display: 'inline-block', marginLeft: '4px', transform: 'rotate(15deg)' }}>☺</span>
      </div>

      {/* Decorative Stacked Books + Plant SVG */}
      <svg
        viewBox="0 0 160 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', maxHeight: '100px' }}
      >
        {/* Plant on top/left */}
        <ellipse cx="40" cy="42" rx="10" ry="4" fill={isDark ? '#1F293D' : '#D5C4B4'} />
        <path d="M32 42 L34 56 L46 56 L48 42 Z" fill={isDark ? '#2B3752' : '#E8DDD2'} />
        <path d="M40 42 Q30 25 35 15 Q43 28 40 42" fill={isDark ? '#10B981' : '#22C55E'} />
        <path d="M40 42 Q48 24 45 14 Q38 27 40 42" fill={isDark ? '#059669' : '#16A34A'} />

        {/* Book 1 (Top): DISCIPLINE */}
        <g transform="translate(15, 54)">
          <rect x="0" y="0" width="125" height="15" rx="3" fill={isDark ? '#2D1B28' : '#FFE4EC'} stroke={isDark ? '#4D2B44' : '#FFCCD8'} />
          <text x="62" y="11" textAnchor="middle" fill={isDark ? '#F472B6' : '#BE185D'} fontSize="7" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.08em">
            DISCIPLINE 📌
          </text>
        </g>

        {/* Book 2 (Middle): CONSISTENCY */}
        <g transform="translate(12, 70)">
          <rect x="0" y="0" width="132" height="15" rx="3" fill={isDark ? '#1C243D' : '#FFEBE4'} stroke={isDark ? '#2C3A63' : '#FFD9CE'} />
          <text x="66" y="11" textAnchor="middle" fill={isDark ? '#60A5FA' : '#C2410C'} fontSize="7" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.08em">
            CONSISTENCY ✨
          </text>
        </g>

        {/* Book 3 (Bottom): BETTER YOU */}
        <g transform="translate(8, 86)">
          <rect x="0" y="0" width="140" height="16" rx="3" fill={isDark ? '#221C38' : '#EDE9FE'} stroke={isDark ? '#3D3166' : '#DDD6FE'} />
          <text x="70" y="12" textAnchor="middle" fill={isDark ? '#C084FC' : '#6D28D9'} fontSize="7.5" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.08em">
            BETTER YOU ♡
          </text>
        </g>
      </svg>
    </div>
  )
}
