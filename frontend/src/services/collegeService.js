/**
 * College API calls.
 */
import api from './api'

const collegeService = {
  async searchColleges(query) {
    const response = await api.get('/api/v1/colleges/search', {
      params: { q: query },
    })
    return response.data
  },

  async addCollege(name) {
    const response = await api.post('/api/v1/colleges', { name })
    return response.data
  },

  async reportAutonomy(collegeId, suggestedValue, reason) {
    const response = await api.post(`/api/v1/colleges/${collegeId}/report-autonomy`, {
      suggested_value: suggestedValue,
      reason,
    })
    return response.data
  },
}

export default collegeService
