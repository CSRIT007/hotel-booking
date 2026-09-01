import axios from 'axios'
import { useAuth } from '../composables/useAuth'

const apiBase = import.meta.env.VITE_AUTH_API_URL || '/api'

const client = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
})

export async function login(loginId, password) {
  const { data } = await client.post('/auth/login', { login: loginId, password })
  return data
}

export async function register({ username, email, password }) {
  const { data } = await client.post('/auth/register', { username, email, password })
  return data
}

function getErrorMessage(e) {
  const msg = e.response?.data?.error || e.response?.data?.message
  if (msg && typeof msg === 'string') return msg
  if (e.message) return e.message
  return 'Login failed'
}

export function useAuthApi() {
  const { setUser, logout: doLogout } = useAuth()
  return {
    async login(loginId, password) {
      try {
        const res = await login(loginId, password)
        if (res.user) {
          setUser({ id: res.user.id, username: res.user.username, email: res.user.email, role: res.user.role || 'guest' })
          return res
        }
        throw new Error(res.error || 'Login failed')
      } catch (e) {
        throw new Error(getErrorMessage(e))
      }
    },
    async register(payload) {
      try {
        const res = await register(payload)
        if (res.user) {
          setUser({ id: res.user.id, username: res.user.username, email: res.user.email, role: res.user.role || 'guest' })
          return res
        }
        throw new Error(res.error || 'Registration failed')
      } catch (e) {
        throw new Error(getErrorMessage(e))
      }
    },
    logout() {
      doLogout()
    },
  }
}
