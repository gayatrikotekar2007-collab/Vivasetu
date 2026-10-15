/**
 * Daily drill API calls.
 */
import api from './api'

const drillService = {
  async startDrill() {
    const response = await api.post('/api/v1/drill/start')
    return response.data
  },

  async getDrill(drillId) {
    const response = await api.get(`/api/v1/drill/${drillId}`)
    return response.data
  },

  async answerTurn(drillId, turnIndex, answer) {
    const response = await api.post(`/api/v1/drill/${drillId}/answer`, {
      turn_index: turnIndex,
      answer,
    })
    return response.data
  },

  async completeDrill(drillId) {
    const response = await api.post(`/api/v1/drill/${drillId}/complete`)
    return response.data
  },
}

export default drillService
