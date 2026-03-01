import axios from 'axios'

const authApi = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

type SendAuthEmailCodeResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: { expiresInSec: number }
}

export async function sendAuthEmailCode(
  duksungId: string
): Promise<SendAuthEmailCodeResponse> {
  try {
    const { data } = await authApi.post<SendAuthEmailCodeResponse>(
      '/api/auth/email/send',
      { duksungId }
    )
    return data
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const message =
        (err.response?.data as unknown as { message?: string })?.message ||
        err.response?.statusText ||
        err.message
      throw new Error(message || '인증 코드 발송에 실패했습니다.')
    }
    throw new Error('인증 코드 발송에 실패했습니다.')
  }
}