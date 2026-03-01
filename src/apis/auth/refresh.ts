import axios from 'axios'

const authApi = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

type RefreshResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: { accessToken: string }
}

export async function refreshAccessToken(): Promise<string> {
  const { data } = await authApi.post<RefreshResponse>('/api/auth/refresh')

  if (!data?.isSuccess || !data?.result?.accessToken) {
    throw new Error(data?.message || '토큰 재발급에 실패했습니다.')
  }

  return data.result.accessToken
}