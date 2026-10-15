/**
 * Session API calls.
 */
import api from './api'

const sessionService = {
  async startSession(data) {
    const response = await api.post('/api/v1/sessions/start', data)
    return response.data
  },

  async submitAnswer(sessionId, answer) {
    const response = await api.post(`/api/v1/sessions/${sessionId}/answer`, { answer })
    return response.data
  },

  async endSession(sessionId) {
    const response = await api.post(`/api/v1/sessions/${sessionId}/end`)
    return response.data
  },

  async getSession(sessionId) {
    const response = await api.get(`/api/v1/sessions/${sessionId}`)
    return response.data
  },

  async getDashboardStats() {
    const response = await api.get('/api/v1/sessions/dashboard-stats')
    return response.data
  },

  async transcribeAudio(sessionId, audioBlob) {
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.webm')
    const response = await api.post(`/api/v1/sessions/${sessionId}/transcribe`, formData)
    return response.data
  },
}

export default sessionService
