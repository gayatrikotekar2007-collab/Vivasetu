/**
 * Crowdsourced reported questions API calls.
 */
import api from './api'

const questionsService = {
  async getQuestions({ branch, subject_id } = {}) {
    const params = {}
    if (branch) params.branch = branch
    if (subject_id) params.subject_id = subject_id
    const response = await api.get('/api/v1/reported-questions', { params })
    return response.data
  },

  async reportQuestion({ subject_id, topic, college_id, branch, question_text }) {
    const response = await api.post('/api/v1/reported-questions', {
      subject_id,
      topic,
      college_id: college_id || null,
      branch,
      question_text,
    })
    return response.data
  },

  async upvoteQuestion(questionId) {
    const response = await api.post(`/api/v1/reported-questions/${questionId}/upvote`)
    return response.data
  },
}

export default questionsService
