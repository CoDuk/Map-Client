import axios from 'axios'

const authApi = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

type VerifyAuthEmailCodeResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: { accessToken: string }
}

export async function verifyAuthEmailCode(params: {
  duksungId: string
  code: string
  deviceId: string
}): Promise<VerifyAuthEmailCodeResponse> {
  const { duksungId, code, deviceId } = params

  try {
    const { data } = await authApi.post<VerifyAuthEmailCodeResponse>(
      '/api/auth/email/verify',
      { duksungId, code },
      {
        headers: {
          'X-Device-Id': deviceId,
        },
      }
    )
    return data
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const message =
        (err.response?.data as unknown as { message?: string })?.message ||
        err.response?.statusText ||
        err.message
      throw new Error(message || '인증 코드 검증에 실패했습니다.')
    }
    throw new Error('인증 코드 검증에 실패했습니다.')
  }
}