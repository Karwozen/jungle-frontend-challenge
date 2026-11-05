import axios from 'axios'
export const api = axios.create({ baseURL: '/api', timeout: 12_000, headers: { Accept: 'application/json' } })
export const SESSION_TOKEN_KEY = 'kurio.session.token'
api.interceptors.request.use(config => {
  let guest = localStorage.getItem('kurio.guest')
  if (!guest) { guest = crypto.randomUUID(); localStorage.setItem('kurio.guest', guest) }
  config.headers['X-Guest-Id'] = guest
  const token = localStorage.getItem(SESSION_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(response => response, error => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && error.response.data?.code === 'SESSION_EXPIRED') {
    localStorage.removeItem(SESSION_TOKEN_KEY)
    window.dispatchEvent(new Event('kurio:session-expired'))
  }
  return Promise.reject(error)
})
