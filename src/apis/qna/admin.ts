import { api } from '@/apis/client'

type BaseResponse<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
}

export async function postQnaAnswer(threadId: number, content: string) {
  const { data } = await api.post<BaseResponse<{ messageId: number }>>(
    `/api/qna/threads/${threadId}/answer`,
    { content }
  )
  if (!data?.isSuccess) throw new Error(data?.message || '답변 등록에 실패했습니다.')
  return data.result.messageId
}

export async function patchQnaAnswer(messageId: number, content: string) {
  const { data } = await api.patch<BaseResponse<{ messageId: number }>>(
    `/api/qna/answers/${messageId}`,
    { content }
  )
  if (!data?.isSuccess) throw new Error(data?.message || '답변 수정에 실패했습니다.')
  return data.result.messageId
}

export async function deleteQnaAnswer(messageId: number) {
  const { data } = await api.delete<BaseResponse<unknown>>(`/api/qna/answers/${messageId}`)
  if (!data?.isSuccess) throw new Error(data?.message || '답변 삭제에 실패했습니다.')
}

export async function deleteQnaThread(threadId: number) {
  const { data } = await api.delete<BaseResponse<unknown>>(`/api/qna/threads/${threadId}`)
  if (!data?.isSuccess) throw new Error(data?.message || '질문 삭제에 실패했습니다.')
}