/**
 * Guard utilities used across the app.
 *
 * safeArray(val)         — always returns an array, never null/undefined
 * isInsufficientData(r)  — true for the structured insufficient-data API response
 * isScoringFailed(r)     — true for the structured scoring-failed API response
 * isValidScore(r)        — true only for a fully-formed score payload
 */

export function safeArray(val) {
  if (Array.isArray(val)) return val
  return []
}

export function isInsufficientData(result) {
  return result && result.status === 'insufficient_data'
}

export function isScoringFailed(result) {
  return result && result.status === 'scoring_failed'
}

export function isValidScore(result) {
  return (
    result &&
    result.status === 'ok' &&
    Array.isArray(result.topics)
  )
}
