/**
 * Auth API calls — register, login, logout, fetch current user.
 */
import api from './api'

const authService = {
  async register(data) {
    const response = await api.post('/api/v1/auth/register', data)
    return response.data
  },

  async login(data) {
    const response = await api.post('/api/v1/auth/login', data)
    return response.data
  },

  async getMe() {
    const response = await api.get('/api/v1/users/me')
    return response.data
  },

  async updateProfile(data) {
    const response = await api.patch('/api/v1/users/me/profile', data)
    return response.data
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}

export default authService
