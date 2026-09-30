import { createContext, useContext, useState } from 'react'
import api from './api'

const AuthContext = createContext(null)

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem('cv_user')) } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem('cv_token') ? readStoredUser() : null))

  const saveSession = ({ access_token, user }) => {
    localStorage.setItem('cv_token', access_token)
    localStorage.setItem('cv_user', JSON.stringify(user))
    setUser(user)
  }

  const login = async (email, password) => saveSession((await api.post('/auth/login', { email, password })).data)

  const register = async (username, email, password) =>
    saveSession((await api.post('/auth/register', { username, email, password })).data)

  const logout = () => {
    localStorage.removeItem('cv_token')
    localStorage.removeItem('cv_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
