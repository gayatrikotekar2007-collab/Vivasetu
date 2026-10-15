/**
 * Notes API calls — check and upload shared notes documents.
 */
import api from './api'

const notesService = {
  async checkNotes({ college_id, branch, subject_id }) {
    const response = await api.get('/api/v1/notes', {
      params: { college_id, branch, subject_id },
    })
    return response.data
  },

  async uploadNotes(formData) {
    const response = await api.post('/api/v1/notes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

export default notesService
