/**
 * VoiceRecorder component.
 * Hold-to-talk interface with graceful microphone error fallback handling.
 */
import { useEffect } from 'react'
import useVoiceRecorder from '../hooks/useVoiceRecorder'

export default function VoiceRecorder({ onRecorded, isTranscribing = false, disabled = false }) {
  const {
    isSupported,
    isRecording,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    reset,
  } = useVoiceRecorder()

  // When audio blob is ready, forward it to parent
  useEffect(() => {
    if (audioBlob) {
      onRecorded(audioBlob)
      reset()
    }
  }, [audioBlob, onRecorded, reset])

  if (!isSupported) {
    return (
      <div
        className="surface"
        style={{
          padding: '0.75rem 1rem',
          borderLeft: '3px solid var(--accent-warn)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
        }}
      >
        ℹ️ Voice mode not supported in this browser. Please use text mode.
      </div>
    )
  }

  if (error === 'permission_denied') {
    return (
      <div
        className="surface"
        style={{
          padding: '0.75rem 1rem',
          borderLeft: '3px solid var(--accent-warn)',
          fontSize: '0.85rem',
          color: 'var(--accent-warn)',
        }}
      >
        ⚠️ Microphone access denied — using text mode.
      </div>
    )
  }

  if (error === 'unavailable') {
    return (
      <div
        className="surface"
        style={{
          padding: '0.75rem 1rem',
          borderLeft: '3px solid var(--accent-warn)',
          fontSize: '0.85rem',
          color: 'var(--accent-warn)',
        }}
      >
        ⚠️ Microphone unavailable — using text mode.
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1.25rem',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
      }}
    >
      <button
        type="button"
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerCancel={stopRecording}
        disabled={disabled || isTranscribing}
        className="button"
        style={{
          padding: '1rem 2rem',
          minWidth: '220px',
          fontSize: '0.95rem',
          fontWeight: 700,
          background: isRecording
            ? 'var(--accent-error)'
            : isTranscribing
            ? 'var(--bg-surface)'
            : 'var(--accent-blue)',
          color: '#fff',
          border: 'none',
          cursor: disabled || isTranscribing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          transition: 'background 0.2s ease',
        }}
      >
        {isRecording && <span className="recording-pulse" />}
        {isTranscribing
          ? '⏳ Transcribing Audio...'
          : isRecording
          ? '🔴 Release to Finish'
          : '🎙️ Hold to Speak'}
      </button>

      <span className="label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
        {isRecording
          ? 'LISTENING... RELEASE BUTTON WHEN DONE ANSWERING'
          : isTranscribing
          ? 'SENDING TO WHISPER TRANSCRIPTION MODEL...'
          : 'PRESS & HOLD WHILE SPEAKING YOUR ANSWER'}
      </span>
    </div>
  )
}
