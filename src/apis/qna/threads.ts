import { api } from '@/apis/client'

export type Thread = {
  threadId: number
  userId: number
  content: string
  answered: boolean
  createdAt: string
  answer?: string
}

type ThreadsResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: { threads: Thread[] }
}

type CreateThreadResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: { threadId: number }
}

export async function getQnaThreads(): Promise<Thread[]> {
  const { data } = await api.get<ThreadsResponse>('/api/qna/threads')
  if (!data?.isSuccess) throw new Error(data?.message || '질문 목록을 불러오지 못했습니다.')
  return data.result.threads
}

export async function postQnaThread(content: string): Promise<number> {
  const { data } = await api.post<CreateThreadResponse>('/api/qna/threads', { content })
  if (!data?.isSuccess) throw new Error(data?.message || '질문 등록에 실패했습니다.')
  return data.result.threadId
}

export type ThreadAnswer = {
  messageId: number
  content: string
  createdAt: string
}

export type ThreadDetail = {
  threadId: number
  userId: number
  content: string
  createdAt: string
  answered: boolean
  answer: ThreadAnswer | null
}

type ThreadDetailResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: ThreadDetail
}

export async function getQnaThreadDetail(threadId: number): Promise<ThreadDetail> {
  const { data } = await api.get<ThreadDetailResponse>(`/api/qna/threads/${threadId}`)
  if (!data?.isSuccess) throw new Error(data?.message || '질문 상세를 불러오지 못했습니다.')
  return data.result
}