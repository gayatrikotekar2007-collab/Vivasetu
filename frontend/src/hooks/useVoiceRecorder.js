/**
 * useVoiceRecorder hook.
 * Manages MediaRecorder lifecycle, audio chunk accumulation, and microphone permissions.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useVoiceRecorder() {
  const [isSupported, setIsSupported] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const shouldStopRef = useRef(false)
  const startTimeRef = useRef(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      setIsSupported(true)
    } else {
      setIsSupported(false)
    }
  }, [])

  const reset = useCallback(() => {
    shouldStopRef.current = true
    setAudioBlob(null)
    setError(null)
    setIsRecording(false)
    chunksRef.current = []
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const stopRecording = useCallback(() => {
    shouldStopRef.current = true
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const startRecording = useCallback(async () => {
    shouldStopRef.current = false
    setError(null)
    setAudioBlob(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // If user already released button before mic access was granted
      if (shouldStopRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        setError('too_short')
        setIsRecording(false)
        return
      }

      streamRef.current = stream

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '',
      })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const durationMs = Date.now() - startTimeRef.current
        const totalBytes = chunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0)

        // Ignore micro-taps (< 400ms or < 500 bytes)
        if (durationMs < 400 || totalBytes < 500) {
          setError('too_short')
        } else {
          const blob = new Blob(chunksRef.current, { type: mimeType })
          setAudioBlob(blob)
        }
        setIsRecording(false)

        // Stop all tracks to release microphone hardware
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      startTimeRef.current = Date.now()
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('permission_denied')
      } else {
        setError('unavailable')
      }
      setIsRecording(false)
    }
  }, [])

  return {
    isSupported,
    isRecording,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    reset,
  }
}
