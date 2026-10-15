/**
 * HeroIllustration — Beautiful SVG vector illustrations matching Blossom and Midnight moods.
 * - Blossom: Warm cozy desk scene with girl studying, laptop, chai mug, potted plant, cute sticky notes.
 * - Midnight: Night city glow scene with headphones, glowing laptop screen, desk lamp, neon quotes.
 */
import { useTheme } from '../../hooks/useTheme'

export default function HeroIllustration({ className = '', style = {} }) {
  const { theme } = useTheme()

  if (theme === 'midnight') {
    return (
      <svg
        viewBox="0 0 460 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ width: '100%', height: 'auto', maxHeight: '280px', ...style }}
      >
        <defs>
          <linearGradient id="nightSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B0F20" />
            <stop offset="100%" stopColor="#171C38" />
          </linearGradient>
          <linearGradient id="laptopGlow" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>

        {/* Background Window / Wall */}
        <rect x="10" y="10" width="440" height="300" rx="16" fill="url(#nightSky)" />

        {/* Distant City Skyline Lights */}
        <rect x="40" y="70" width="45" height="110" rx="3" fill="#1B2240" />
        <circle cx="55" cy="90" r="2" fill="#FBBF24" opacity="0.8" />
        <circle cx="70" cy="110" r="2" fill="#60A5FA" opacity="0.8" />
        <circle cx="55" cy="130" r="2" fill="#FBBF24" opacity="0.6" />
        <rect x="95" y="50" width="55" height="130" rx="3" fill="#161C36" />
        <circle cx="115" cy="70" r="2" fill="#38BDF8" opacity="0.9" />
        <circle cx="135" cy="90" r="2" fill="#F43F5E" opacity="0.7" />
        <circle cx="115" cy="115" r="2" fill="#FBBF24" opacity="0.8" />

        {/* Window Grid Frame */}
        <line x1="30" y1="180" x2="180" y2="180" stroke="#2A355A" strokeWidth="3" />
        <line x1="180" y1="30" x2="180" y2="180" stroke="#2A355A" strokeWidth="3" />

        {/* Neon Quote on wall */}
        <rect x="290" y="35" width="130" height="55" rx="10" fill="#12172E" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="355" y="55" textAnchor="middle" fill="#38BDF8" fontFamily="Caveat, cursive" fontSize="16" fontWeight="bold">
          Just one more
        </text>
        <text x="355" y="75" textAnchor="middle" fill="#818CF8" fontFamily="Caveat, cursive" fontSize="18" fontWeight="bold">
          practice... ⚡
        </text>

        {/* Neon Progress Bar on wall */}
        <rect x="305" y="96" width="100" height="8" rx="4" fill="#1E2746" />
        <rect x="305" y="96" width="72" height="8" rx="4" fill="url(#neonCyan)" />

        {/* Wall sticky card */}
        <rect x="210" y="30" width="60" height="75" rx="6" fill="#1E1B38" stroke="#8B5CF6" strokeWidth="1" />
        <text x="240" y="50" textAnchor="middle" fill="#C084FC" fontSize="9" fontWeight="bold" fontFamily="sans-serif">A</text>
        <text x="240" y="62" textAnchor="middle" fill="#C084FC" fontSize="9" fontWeight="bold" fontFamily="sans-serif">BRIGHTER</text>
        <text x="240" y="74" textAnchor="middle" fill="#C084FC" fontSize="9" fontWeight="bold" fontFamily="sans-serif">YOU</text>
        <text x="240" y="92" textAnchor="middle" fill="#C084FC" fontSize="14">✨</text>

        {/* Desk Surface */}
        <path d="M10 240 L450 240 L450 310 L10 310 Z" fill="#101426" />
        <line x1="10" y1="240" x2="450" y2="240" stroke="#2A355A" strokeWidth="2" />

        {/* Character with Headphones (Back/Side view studying focused) */}
        {/* Hoodie Body */}
        <path d="M190 310 C190 230 230 200 270 200 C310 200 350 230 350 310 Z" fill="#181D33" />
        <path d="M210 310 C215 245 240 220 270 220 C300 220 325 245 330 310 Z" fill="#111628" />

        {/* Head */}
        <circle cx="270" cy="180" r="38" fill="#1F2642" />
        {/* Dark Hair Texture */}
        <path d="M240 180 C240 150 260 145 285 145 C305 145 315 160 310 185 C300 170 280 165 260 175 Z" fill="#0C101D" />

        {/* Headphones (Electric Violet Glow) */}
        <path d="M236 175 C234 140 306 140 304 175" stroke="#8B5CF6" strokeWidth="7" strokeLinecap="round" fill="none" />
        {/* Ear Cups */}
        <rect x="232" y="165" width="12" height="26" rx="6" fill="#A855F7" />
        <rect x="296" y="165" width="12" height="26" rx="6" fill="#A855F7" />

        {/* Laptop open on desk */}
        <polygon points="120,255 190,255 200,285 110,285" fill="#242C4C" />
        {/* Screen */}
        <polygon points="120,255 190,255 190,200 120,200" fill="url(#laptopGlow)" />
        {/* Code / Text lines on laptop */}
        <line x1="130" y1="212" x2="160" y2="212" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        <line x1="130" y1="222" x2="180" y2="222" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="130" y1="232" x2="150" y2="232" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <line x1="130" y1="242" x2="170" y2="242" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

        {/* Desk Plant on the right */}
        <rect x="390" y="225" width="22" height="25" rx="3" fill="#334155" />
        <path d="M401 225 Q385 200 395 190 Q405 210 401 225" fill="#10B981" />
        <path d="M401 225 Q420 205 415 195 Q405 212 401 225" fill="#059669" />
        <path d="M401 225 Q401 185 407 180 Q409 205 401 225" fill="#34D399" />
      </svg>
    )
  }

  // Blossom Light Theme SVG illustration
  return (
    <svg
      viewBox="0 0 460 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: '100%', height: 'auto', maxHeight: '280px', ...style }}
    >
      <defs>
        <linearGradient id="blossomBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2F5" />
          <stop offset="100%" stopColor="#FFF8F0" />
        </linearGradient>
        <linearGradient id="blossomDesk" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5ECE5" />
          <stop offset="100%" stopColor="#EADDCF" />
        </linearGradient>
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#B8869B" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Backdrop */}
      <rect x="10" y="10" width="440" height="300" rx="16" fill="url(#blossomBg)" />

      {/* Cute Sticky Notes on the Wall */}
      <g filter="url(#softShadow)" transform="rotate(-3 220 50)">
        <rect x="195" y="25" width="75" height="90" rx="4" fill="#FFE2EC" />
        <text x="232" y="45" textAnchor="middle" fill="#8B2648" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          SAME
        </text>
        <text x="232" y="58" textAnchor="middle" fill="#8B2648" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          STUDENT
        </text>
        <text x="232" y="71" textAnchor="middle" fill="#E83D75" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          BRIGHTER
        </text>
        <text x="232" y="84" textAnchor="middle" fill="#E83D75" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          FUTURE
        </text>
        <text x="232" y="102" textAnchor="middle" fill="#E83D75" fontSize="12">
          ♡
        </text>
      </g>

      <g filter="url(#softShadow)" transform="rotate(4 160 85)">
        <rect x="145" y="65" width="45" height="55" rx="3" fill="#FFF3D6" />
        <text x="167" y="82" textAnchor="middle" fill="#92400E" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
          YOU
        </text>
        <text x="167" y="93" textAnchor="middle" fill="#92400E" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
          GOT
        </text>
        <text x="167" y="104" textAnchor="middle" fill="#92400E" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
          THIS
        </text>
        <text x="167" y="115" textAnchor="middle" fill="#D97706" fontSize="9">
          ♡
        </text>
      </g>

      {/* Stacked books on right side */}
      <g transform="translate(370, 165)">
        <rect x="0" y="0" width="70" height="15" rx="3" fill="#E0E7FF" stroke="#C7D2FE" />
        <text x="35" y="11" textAnchor="middle" fill="#4338CA" fontSize="7" fontWeight="bold" fontFamily="sans-serif">PLAN</text>

        <rect x="2" y="16" width="66" height="15" rx="3" fill="#FCE7F3" stroke="#FBCFE8" />
        <text x="35" y="27" textAnchor="middle" fill="#BE185D" fontSize="7" fontWeight="bold" fontFamily="sans-serif">PRACTICE</text>

        <rect x="-2" y="32" width="72" height="15" rx="3" fill="#DCFCE7" stroke="#BBF7D0" />
        <text x="35" y="43" textAnchor="middle" fill="#15803D" fontSize="7" fontWeight="bold" fontFamily="sans-serif">PROGRESS</text>

        <rect x="1" y="48" width="68" height="15" rx="3" fill="#FEF3C7" stroke="#FDE68A" />
        <text x="35" y="59" textAnchor="middle" fill="#B45309" fontSize="7" fontWeight="bold" fontFamily="sans-serif">REPEAT</text>
      </g>

      {/* Potted Plant in background */}
      <g transform="translate(390, 80)">
        <ellipse cx="20" cy="55" rx="14" ry="7" fill="#C2A490" />
        <path d="M8 55 L12 85 L28 85 L32 55 Z" fill="#D4BBA8" />
        <path d="M20 55 Q5 30 18 15 Q30 35 20 55" fill="#10B981" />
        <path d="M20 55 Q35 32 30 18 Q20 38 20 55" fill="#059669" />
        <path d="M20 55 Q20 20 24 10 Q26 30 20 55" fill="#34D399" />
      </g>

      {/* Wooden Desk Surface */}
      <rect x="10" y="240" width="440" height="70" fill="url(#blossomDesk)" />
      <line x1="10" y1="240" x2="450" y2="240" stroke="#DFCFBE" strokeWidth="2" />

      {/* Laptop on desk */}
      <g transform="translate(180, 150)">
        {/* Screen back */}
        <rect x="0" y="0" width="135" height="95" rx="8" fill="#4B4553" />
        <text x="67" y="35" textAnchor="middle" fill="#E2D9F3" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          Good
        </text>
        <text x="67" y="47" textAnchor="middle" fill="#E2D9F3" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          Engineers
        </text>
        <text x="67" y="59" textAnchor="middle" fill="#E2D9F3" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          Great
        </text>
        <text x="67" y="71" textAnchor="middle" fill="#E2D9F3" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          Humans
        </text>
        {/* Heart sticker on laptop */}
        <circle cx="20" cy="20" r="8" fill="#F472B6" />
        <text x="20" y="24" textAnchor="middle" fill="#FFF" fontSize="9">♡</text>
        {/* Base */}
        <polygon points="-15,95 150,95 160,105 -25,105" fill="#807887" />
      </g>

      {/* Chai Mug ("Fueled by chai & goals") */}
      <g transform="translate(325, 205)">
        {/* Steam */}
        <path d="M12 -8 Q16 -16 12 -24" stroke="#D1C7BD" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M18 -5 Q22 -14 18 -22" stroke="#D1C7BD" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        {/* Mug Body */}
        <rect x="0" y="0" width="28" height="35" rx="5" fill="#FFFFFF" stroke="#E2D8CC" strokeWidth="1.5" />
        {/* Mug Handle */}
        <path d="M28 8 C36 8 36 26 28 26" stroke="#FFFFFF" strokeWidth="3" fill="none" />
        <text x="14" y="11" textAnchor="middle" fill="#786B63" fontSize="5" fontWeight="bold">FUELED</text>
        <text x="14" y="17" textAnchor="middle" fill="#786B63" fontSize="5" fontWeight="bold">BY</text>
        <text x="14" y="23" textAnchor="middle" fill="#E83D75" fontSize="5" fontWeight="bold">CHAI</text>
        <text x="14" y="29" textAnchor="middle" fill="#786B63" fontSize="5" fontWeight="bold">&amp; GOALS</text>
      </g>

      {/* Student Character (Smiling Girl with hair bun, resting chin on hand) */}
      <g transform="translate(295, 95)">
        {/* Shoulders / Pink Sweater */}
        <path d="M-25 150 C-20 100 20 95 45 95 C70 95 110 100 115 150 Z" fill="#F472B6" />
        {/* Sweater Texture / Neck */}
        <path d="M30 95 C30 80 60 80 60 95 Z" fill="#FBCFE8" />

        {/* Head / Face */}
        <ellipse cx="45" cy="55" rx="30" ry="34" fill="#FCD3B8" />

        {/* Hair Bun & Strands */}
        <circle cx="45" cy="0" r="22" fill="#2E1B1B" />
        <path d="M15 50 C12 25 35 15 55 15 C75 15 78 30 75 50 C70 30 55 25 40 28 C25 30 18 42 15 50 Z" fill="#2E1B1B" />
        {/* Soft Tendrils */}
        <path d="M16 52 Q10 70 14 85" stroke="#2E1B1B" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M74 52 Q80 70 76 85" stroke="#2E1B1B" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Happy Expressive Eyes & Smile */}
        <ellipse cx="33" cy="53" rx="4" ry="5.5" fill="#1C1917" />
        <circle cx="34" cy="51" r="1.5" fill="#FFFFFF" />
        <ellipse cx="57" cy="53" rx="4" ry="5.5" fill="#1C1917" />
        <circle cx="58" cy="51" r="1.5" fill="#FFFFFF" />

        {/* Eyebrows */}
        <path d="M27 44 Q34 40 40 43" stroke="#443028" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M50 43 Q56 40 63 44" stroke="#443028" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Cheerful Blush */}
        <ellipse cx="28" cy="62" rx="5" ry="3" fill="#F472B6" opacity="0.6" />
        <ellipse cx="62" cy="62" rx="5" ry="3" fill="#F472B6" opacity="0.6" />

        {/* Gentle Smile */}
        <path d="M40 66 Q45 71 50 66" stroke="#9F1239" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Arm / Hand resting on chin */}
        <path d="M15 145 C15 115 35 95 40 85" stroke="#F472B6" strokeWidth="18" strokeLinecap="round" fill="none" />
        <circle cx="40" cy="80" r="9" fill="#FCD3B8" />
      </g>
    </svg>
  )
}
