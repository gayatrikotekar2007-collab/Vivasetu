/**
 * Topic mastery API calls.
 */
import api from './api'

const masteryService = {
  async getMastery() {
    const response = await api.get('/api/v1/users/me/mastery')
    return response.data
  },
}

export default masteryService
