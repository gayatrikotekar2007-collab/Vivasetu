/**
 * Subject API calls.
 */
import api from './api'

const subjectService = {
  async listSubjects(branch, year, semester) {
    const params = { year }
    if (branch) params.branch = branch
    if (semester) params.semester = semester
    const response = await api.get('/api/v1/subjects', { params })
    return response.data
  },

  async suggestSubject(data) {
    const response = await api.post('/api/v1/subjects/suggest', data)
    return response.data
  },
}

export default subjectService
