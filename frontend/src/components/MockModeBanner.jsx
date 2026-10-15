/**
 * MockModeBanner — shown on every session screen when mock_mode is true.
 *
 * REQUIRED by design: when the AI is not configured, this banner must be
 * visible at all times within a session. Mock responses must NEVER look
 * identical to real AI responses.
 *
 * Renders nothing when mockMode is false or undefined.
 */
export default function MockModeBanner({ mockMode }) {
  if (!mockMode) return null

  return (
    <div className="mock-mode-banner" role="alert" aria-live="polite">
      ▲ DEMO MODE — AI EXAMINER NOT ACTIVE
    </div>
  )
}
