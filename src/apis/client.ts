import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { refreshAccessToken } from '@/apis/auth/refresh'

const BASE_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_SERVER_API_URL ?? '')

let refreshingPromise: Promise<string> | null = null

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem('accessToken', token)
  else localStorage.removeItem('accessToken')
}

export function getAccessToken() {
  return localStorage.getItem('accessToken')
}

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    if (original?._retry || original?.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error)
    }

    if (status === 401) {
      original._retry = true

      try {
        if (!refreshingPromise) {
          refreshingPromise = refreshAccessToken().finally(() => {
            refreshingPromise = null
          })
        }
        const newToken = await refreshingPromise
        setAccessToken(newToken)

        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (e) {
        setAccessToken(null)
        return Promise.reject(e)
      }
    }

    return Promise.reject(error)
  }
)