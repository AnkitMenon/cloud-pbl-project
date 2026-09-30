import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_URL })

// Attach the JWT to every request once the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the token expired or is invalid, send the user back to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.startsWith('/auth/')
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('cv_token')
      localStorage.removeItem('cv_user')
      window.location.href = '/login?expired=1'
    }
    return Promise.reject(err)
  },
)

/** Pull a readable message out of any axios error. */
export async function errorMessage(err) {
  if (!err.response) return 'Cannot reach the server. Is the backend running on port 8000?'
  let data = err.response.data
  // Blob responses (downloads) hide the JSON error inside the blob.
  if (data instanceof Blob) {
    try { data = JSON.parse(await data.text()) } catch { data = null }
  }
  if (data?.detail && typeof data.detail === 'string') return data.detail
  return `Request failed (${err.response.status})`
}

/** Download a protected file: fetch as a blob with the token, then save it. */
export async function downloadWithAuth(fileId, filename) {
  const res = await api.get(`/files/${fileId}/download`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default api
