import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import SendIcon from '@/assets/send.svg'
import CloseIcon from '@/assets/close.svg'
import CodukIcon from '@/assets/coduk.svg'
import CheckIcon from '@/assets/check.svg'
import ReplyIcon from '@/assets/reply.svg'
import Duk1 from '@/assets/nobgduk1.svg'
import ScrollToBottomIcon from '@/assets/scrolltobottom.svg'
import ThreadsSkeleton from '@/pages/qna/components/ThreadsSkeleton'
import { getQnaThreadDetail, getQnaThreads, postQnaThread } from '@/apis/qna/threads'
import {
  deleteQnaAnswer,
  deleteQnaThread,
  patchQnaAnswer,
  postQnaAnswer,
} from '@/apis/qna/admin'


export default function QnaPage() {
  const qc = useQueryClient()
  const [content, setContent] = useState('')
  const MAX_CHARS = 500

  const [isAdmin, setIsAdmin] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('dev:isAdmin') === '1'
  )

  const [activeThreadId, setActiveThreadId] = useState<number | null>(null)
  const [expandedThreadId, setExpandedThreadId] = useState<number | null>(null)
  const [adminMode, setAdminMode] = useState<'answer' | 'delete' | null>(null)
  const [answerDraft, setAnswerDraft] = useState('')
  const [answerMessageIdByThread, setAnswerMessageIdByThread] = useState<Record<number, number>>({})
  const [answerContentByThread, setAnswerContentByThread] = useState<Record<number, string>>({})
  const [answerDeletedLocal, setAnswerDeletedLocal] = useState<Record<number, true>>({})
  const [isAnswerEditing, setIsAnswerEditing] = useState(false)
  const activeBubbleRef = useRef<HTMLDivElement | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [scrollToTopAfterPost, setScrollToTopAfterPost] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const adminClickCountRef = useRef(0)
  const adminClickTimerRef = useRef<number | null>(null)
  const MAX_LINES = 3
  const LINE_HEIGHT = 20
  const MAX_HEIGHT = MAX_LINES * LINE_HEIGHT

  const syncTextareaHeight = () => {
    const el = textareaRef.current
    if (!el) return

    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, MAX_HEIGHT)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }

  const threadsQuery = useQuery({
    queryKey: ['qna', 'threads'],
    queryFn: getQnaThreads,
    staleTime: 10_000,
  })

  const createMutation = useMutation({
    mutationFn: postQnaThread,
    onSuccess: () => {
      setContent('')
      setScrollToTopAfterPost(true)
      requestAnimationFrame(syncTextareaHeight)
      qc.invalidateQueries({ queryKey: ['qna', 'threads'] })
    },
  })

  const isSubmitDisabled = useMemo(
    () => createMutation.isPending || content.trim().length === 0,
    [content, createMutation.isPending]
  )

  const handleSubmit = () => {
    if (isSubmitDisabled) return
    createMutation.mutate(content.trim())
  }

  const closeAdminMode = () => {
    setActiveThreadId(null)
    setAdminMode(null)
    setIsAnswerEditing(false)
  }

  const createAnswerMutation = useMutation({
    mutationFn: ({ threadId, content }: { threadId: number; content: string }) =>
      postQnaAnswer(threadId, content),
    onSuccess: (messageId, vars) => {
      setAnswerMessageIdByThread((prev) => ({ ...prev, [vars.threadId]: messageId }))
      setAnswerContentByThread((prev) => ({ ...prev, [vars.threadId]: vars.content }))
      setAnswerDeletedLocal((prev) => { const n = { ...prev }; delete n[vars.threadId]; return n })
      qc.invalidateQueries({ queryKey: ['qna', 'threads'] })
    },
  })

  const patchAnswerMutation = useMutation({
    mutationFn: ({ messageId, content }: { threadId: number; messageId: number; content: string }) =>
      patchQnaAnswer(messageId, content),
    onSuccess: (_, vars) => {
      setAnswerContentByThread((prev) => ({ ...prev, [vars.threadId]: vars.content }))
      qc.invalidateQueries({ queryKey: ['qna', 'threads'] })
      qc.invalidateQueries({ queryKey: ['qna', 'thread', vars.threadId] })
    },
  })

  const deleteAnswerMutation = useMutation({
    mutationFn: ({ messageId }: { threadId: number; messageId: number }) => deleteQnaAnswer(messageId),
    onSuccess: (_, vars) => {
      setAnswerDraft('')
      qc.invalidateQueries({ queryKey: ['qna', 'threads'] })
      qc.invalidateQueries({ queryKey: ['qna', 'thread', vars.threadId] })
    },
  })

  const deleteThreadMutation = useMutation({
    mutationFn: (threadId: number) => deleteQnaThread(threadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qna', 'threads'] })
    },
  })

  const dukAvatarMap = useMemo(() => {
    const mods = import.meta.glob('/src/assets/duk*.svg', {
      eager: true,
      import: 'default',
    }) as Record<string, string>

    const ordered = Object.entries(mods)
      .map(([path, url]) => {
        const m = path.match(/duk(\d+)\.svg$/)
        const n = m ? Number(m[1]) : NaN
        return { n, url }
      })
      .filter((x) => Number.isFinite(x.n) && x.n >= 1 && x.n <= 20)
      .sort((a, b) => a.n - b.n)
      .map((x) => x.url)

    return ordered
  }, [])

  const [avatarByUser, setAvatarByUser] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('qna-avatar-map')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('qna-avatar-map', JSON.stringify(avatarByUser))
    } catch {
      //  ignore
    }
  }, [avatarByUser])

  const getUserKey = (userId: number) => String(userId)

  const getAvatarUrl = (userKey: string) => {
    if (dukAvatarMap.length === 0) return ''
    const existing = avatarByUser[userKey]
    if (typeof existing === 'number') {
      return dukAvatarMap[existing % dukAvatarMap.length]
    }
    return ''
  }

  const threads = threadsQuery.data ?? []

  const detailThreadId = isAdmin ? activeThreadId : expandedThreadId

  const threadDetailQuery = useQuery({
    queryKey: ['qna', 'thread', detailThreadId],
    queryFn: () => getQnaThreadDetail(detailThreadId as number),
    enabled: typeof detailThreadId === 'number',
    staleTime: 10_000,
  })

  const enterAdminAnswerMode = (threadId: number, editing?: boolean) => {
    setActiveThreadId(threadId)
    setAdminMode('answer')

    const isDeleted = answerDeletedLocal[threadId]
    const existing = !isDeleted ? answerContentByThread[threadId] : undefined
    const d = threadDetailQuery.data
    const fromDetail = !isDeleted && d && d.threadId === threadId ? d.answer?.content ?? '' : ''

    const seed = existing ?? (fromDetail || undefined)
    setAnswerDraft(seed ?? '')
    setIsAnswerEditing(editing ?? !(seed && seed.length > 0))
  }
  useEffect(() => {
    if (!isAdmin) return
    if (adminMode !== 'answer') return
    if (activeThreadId == null) return

    const d = threadDetailQuery.data
    if (!d || d.threadId !== activeThreadId) return

    const serverMessageId = d.answer?.messageId
    const serverContent = d.answer?.content ?? ''

    if (answerDeletedLocal[activeThreadId]) return

    if (typeof serverMessageId === 'number' && answerMessageIdByThread[activeThreadId] == null) {
      requestAnimationFrame(() => {
        setAnswerMessageIdByThread((prev) =>
          prev[activeThreadId] != null ? prev : { ...prev, [activeThreadId]: serverMessageId }
        )
      })
    }

    if (serverContent && answerContentByThread[activeThreadId] == null) {
      requestAnimationFrame(() => {
        setAnswerContentByThread((prev) =>
          prev[activeThreadId] != null ? prev : { ...prev, [activeThreadId]: serverContent }
        )
        setAnswerDraft((prev) => (prev ? prev : serverContent))
      })
    }
  }, [activeThreadId, adminMode, isAdmin, threadDetailQuery.data, answerMessageIdByThread, answerContentByThread, answerDeletedLocal])

  const saveAnswerIfNeeded = (threadId: number) => {
    const trimmed = answerDraft.trim()
    if (!trimmed) return
    const messageId = answerMessageIdByThread[threadId]
    if (messageId) {
      patchAnswerMutation.mutate({ threadId, messageId, content: trimmed })
    } else {
      createAnswerMutation.mutate({ threadId, content: trimmed })
    }
  }

  
  useEffect(() => {
    if (!isAdmin) return
    if (adminMode === null) return
    if (activeThreadId == null) return

    const onDown = (e: MouseEvent) => {
      const el = activeBubbleRef.current
      if (!el) return
      if (el.contains(e.target as Node)) return

      if (adminMode === 'delete') {
        
        setAdminMode('answer')
        return
      }

      if (isAnswerEditing) {
        
        saveAnswerIfNeeded(activeThreadId)
        setIsAnswerEditing(false)
        return
      }

      
      closeAdminMode()
    }

    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [activeThreadId, adminMode, isAdmin, isAnswerEditing, answerDraft])

  
  useEffect(() => {
    if (isAdmin) return
    if (expandedThreadId == null) return

    const onDown = (e: MouseEvent) => {
      const el = activeBubbleRef.current
      if (!el) return
      if (el.contains(e.target as Node)) return
      setExpandedThreadId(null)
    }

    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [expandedThreadId, isAdmin])

  useEffect(() => {
    if (dukAvatarMap.length === 0) return
    if (threads.length === 0) return

    const neededKeys = new Set<string>()
    for (const t of threads) {
      neededKeys.add(getUserKey(t.userId))
    }

    const missing: string[] = []
    neededKeys.forEach((k) => {
      if (typeof avatarByUser[k] !== 'number') missing.push(k)
    })

    if (missing.length === 0) return

    
    const used = new Set<number>()
    Object.values(avatarByUser).forEach((v) => {
      if (typeof v === 'number') used.add(((v % dukAvatarMap.length) + dukAvatarMap.length) % dukAvatarMap.length)
    })

    const available: number[] = []
    for (let i = 0; i < dukAvatarMap.length; i += 1) {
      if (!used.has(i)) available.push(i)
    }

    const pickRandom = (arr: number[]) => arr[Math.floor(Math.random() * arr.length)]

    const newAvatars: Record<string, number> = {}
    for (const k of missing) {
      if (available.length > 0) {
        const idx = Math.floor(Math.random() * available.length)
        const chosen = available[idx]
        available.splice(idx, 1)
        newAvatars[k] = chosen
      } else {
        newAvatars[k] = pickRandom([...Array(dukAvatarMap.length).keys()])
      }
    }

    requestAnimationFrame(() => {
      setAvatarByUser((prev) => ({ ...prev, ...newAvatars }))
    })
  }, [dukAvatarMap.length, threads.length, avatarByUser])

  useEffect(() => {
    if (!scrollToTopAfterPost) return
    const el = listRef.current
    if (!el) return

    el.scrollTo({ top: 0, behavior: 'smooth' })
  }, [scrollToTopAfterPost])

  useEffect(() => {
    if (scrollToTopAfterPost && threads.length > 0) {
      Promise.resolve().then(() => {
        setShowScrollToBottom(false)
        setScrollToTopAfterPost(false)
      })
    }
  }, [scrollToTopAfterPost, threads.length])

  return (
    <div className="h-[calc(100dvh-61px-var(--sat))] bg-cream-100 flex flex-col">
      {showAdminModal ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-cream-100 rounded-2xl w-[280px] p-5 flex flex-col gap-4">
            <div className="text-neutral-300 text-[14px] font-semibold text-center">
              관리자 비밀번호 입력
            </div>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (adminPassword === 'coduk0204!') {
                    localStorage.setItem('dev:isAdmin', '1')
                    setIsAdmin(true)
                    alert('관리자모드로 전환합니다.')
                  } else {
                    alert('비밀번호가 틀렸습니다.')
                    return
                  }
                  setShowAdminModal(false)
                  setAdminPassword('')
                }
              }}
              className="w-full rounded-lg px-3 py-2 text-[14px] outline-none border border-primary"
              placeholder="비밀번호"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAdminModal(false)
                  setAdminPassword('')
                }}
                className="flex-1 py-2 rounded-lg bg-neutral-300 text-cream-100 text-[13px]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (adminPassword === 'coduk0204!') {
                    localStorage.setItem('dev:isAdmin', '1')
                    setIsAdmin(true)
                    alert('관리자모드로 전환합니다.')
                  } else {
                    alert('비밀번호가 틀렸습니다.')
                    return
                  }
                  setShowAdminModal(false)
                  setAdminPassword('')
                }}
                className="flex-1 py-2 rounded-lg bg-primary text-cream-100 text-[13px]"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div
        className="bg-rose-100 flex items-center py-[16px] px-[17px]"
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
          const isRightArea = e.clientX > rect.right - 80
          if (!isRightArea) return

          adminClickCountRef.current += 1

          if (adminClickTimerRef.current) {
            window.clearTimeout(adminClickTimerRef.current)
          }

          adminClickTimerRef.current = window.setTimeout(() => {
            adminClickCountRef.current = 0
          }, 1000)

          if (adminClickCountRef.current >= 5) {
            adminClickCountRef.current = 0
            setShowAdminModal(true)
          }
        }}
      >
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 min-h-[44px] rounded-[20px] bg-cream-100 px-5 py-[12px] flex items-start [filter:drop-shadow(1px_1px_4px_rgba(72,37,7,0.1))]">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value.slice(0, MAX_CHARS))
                requestAnimationFrame(syncTextareaHeight)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="질문을 입력해주세요."
              rows={1}
              className="w-full bg-transparent outline-none text-neutral-300 placeholder-rose-300 text-[15px] font-normal leading-[20px] resize-none overflow-y-auto max-h-[60px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`rounded-full p-[7px] [filter:drop-shadow(1px_1px_4px_rgba(72,37,7,0.1))] bg-rose-100 ${
              isSubmitDisabled ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <img
              src={SendIcon}
              alt="send"
              className="w-[24px] h-[24px]"
            />
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={() => {
          const el = listRef.current
          if (!el) return
          const diff = el.scrollHeight - el.scrollTop - el.clientHeight
          const atBottom = diff <= 8
          setShowScrollToBottom(!atBottom)
        }}
        className="relative pt-[20px] flex-1 overflow-y-auto space-y-4 no-scrollbar"
      >
        <div className="mb-[40px] flex flex-col gap-3 px-[17px]">
        {threadsQuery.isLoading ? (
          <ThreadsSkeleton />
        ) : threads.length === 0 ? (
          <div className="h-[calc(100vh-266px)] flex flex-col items-center justify-center">
            <img src={Duk1} alt="empty" className="w-[180px] h-auto" />
            <div className="mt-4 text-neutral-300 text-[14px] text-center font-medium">
              문의사항이 없습니다.
            </div>
          </div>
        ) : (
          threads.map((t, idx) => {
            const userKey = getUserKey(t.userId)
            const next = threads[idx + 1]
            const nextUserKey = next ? getUserKey(next.userId) : null
            const isLastOfUser = nextUserKey !== userKey

            const avatarUrl = isLastOfUser ? getAvatarUrl(userKey) : ''

            const isAdminActive = isAdmin && activeThreadId === t.threadId
            const isUserExpanded = !isAdmin && expandedThreadId === t.threadId
            const showAnswerSection = isAdminActive || isUserExpanded

            const localAnswerId = answerMessageIdByThread[t.threadId]
            const localAnswerContent = answerContentByThread[t.threadId]
            const hasAnswer = !answerDeletedLocal[t.threadId] && (Boolean(localAnswerId) || Boolean(localAnswerContent) || t.answered)
            const isDeleteMode = isAdminActive && adminMode === 'delete'

            const detailAnswer =
              showAnswerSection && threadDetailQuery.data?.threadId === t.threadId
                ? threadDetailQuery.data?.answer?.content ?? ''
                : ''

            const displayAnswer = localAnswerContent ?? detailAnswer ?? t.answer ?? ''

            const bubbleBg = showAnswerSection
              ? 'bg-rose-200 text-neutral-300'
              : 'bg-cream-200 text-neutral-300'

            return (
              <div key={t.threadId} ref={showAnswerSection ? activeBubbleRef : undefined} className={`w-full ${showAnswerSection ? 'pb-3' : ''}`}>
                <div className="flex items-end w-full">
                  
                  <div className="w-[37px] h-[37px] shrink-0 rounded-full flex items-center justify-center mr-[11px]">
                    {!showAnswerSection && isLastOfUser && avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="profile"
                        className="w-full h-full object-cover rounded-full mt-[35px] "
                      />
                    ) : null}
                  </div>

                  
                  <div
                    className={`relative min-w-0 ${showAnswerSection ? 'flex-1' : 'inline-block'}`}
                  >
                    <div
                      className={`relative ${showAnswerSection ? 'w-full' : ''} rounded-[20px] ${
                        showAnswerSection ? 'rounded-br-none' : ''
                      } ${!showAnswerSection && isLastOfUser ? 'rounded-bl-none' : ''} ${bubbleBg}`}
                    >
                      
                      {isAdmin && isAdminActive ? (
                        <>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setAdminMode('delete')
                              setIsAnswerEditing(false)
                            }}
                            className={`absolute -top-1.3 -right-0.5 rounded-full bg-primary flex items-center justify-center p-0.5 transition-all duration-200 ${
                              isDeleteMode
                                ? 'opacity-0 scale-90 pointer-events-none'
                                : 'opacity-100 scale-100'
                            }`}
                          >
                            <img src={CloseIcon} alt="close" className="w-[10px] h-[10px]" />
                          </button>

                          
                          <div
                            className={`absolute top-0 right-0 -translate-y-1/2 origin-right transition-all duration-200 ${
                              isDeleteMode
                                ? 'opacity-100 scale-x-100 pointer-events-auto'
                                : 'opacity-0 scale-x-0 pointer-events-none'
                            }`}
                          >
                            <div className="flex items-center rounded-full bg-primary overflow-hidden">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteThreadMutation.mutate(t.threadId, {
                                    onSuccess: () => {
                                      setActiveThreadId(null)
                                      setAdminMode(null)
                                    },
                                  })
                                }}
                                className={`py-0.5 text-cream-100 text-[11px] font-semibold ${hasAnswer ? 'pl-2.5 pr-1' : 'px-2.5'}`}
                              >
                                질문
                              </button>

                              {hasAnswer ? (
                                <>
                                  <span className="text-cream-100 text-[11px] font-semibold opacity-60 select-none">|</span>
                                  <button
                                    type="button"
                                    disabled={!localAnswerId}
                                    onClick={() => {
                                      if (!localAnswerId) return
                                      deleteAnswerMutation.mutate(
                                        { threadId: t.threadId, messageId: localAnswerId },
                                        {
                                          onSuccess: () => {
                                            setAnswerMessageIdByThread((prev) => {
                                              const nextMap = { ...prev }
                                              delete nextMap[t.threadId]
                                              return nextMap
                                            })
                                            setAnswerContentByThread((prev) => {
                                              const nextMap = { ...prev }
                                              delete nextMap[t.threadId]
                                              return nextMap
                                            })
                                            setAnswerDeletedLocal((prev) => ({ ...prev, [t.threadId]: true }))
                                            setActiveThreadId(null)
                                            setAdminMode(null)
                                          },
                                        }
                                      )
                                    }}
                                    className={`pl-1 pr-2.5 py-0.5 text-[11px] font-semibold ${
                                      localAnswerId ? 'text-cream-100' : 'text-cream-100/40'
                                    }`}
                                  >
                                    답변
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </>
                      ) : null}

                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => enterAdminAnswerMode(t.threadId)}
                          className="block text-left w-full"
                        >
                          <div className="px-4 pt-3 pb-3 text-[12px] font-normal leading-5 whitespace-pre-wrap break-all">
                            {t.content}
                          </div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedThreadId((prev) => (prev === t.threadId ? null : t.threadId))
                          }}
                          className="block text-left w-full"
                        >
                          <div className="px-4 pt-3 pb-3 text-[12px] font-normal leading-5 whitespace-pre-wrap break-all">
                            {t.content}
                          </div>
                        </button>
                      )}

                      
                      {showAnswerSection ? (
                        <div className="px-4 pb-3">
                          <div className="h-px w-full bg-primary/20" />
                          <div className="mt-3">
                            {isAdminActive ? (
                              isAnswerEditing ? (
                                <textarea
                                  value={answerDraft}
                                  onChange={(e) => setAnswerDraft(e.target.value)}
                                  placeholder="답변을 입력해주세요."
                                  rows={3}
                                  className="w-full bg-transparent outline-none resize-none text-[12px] text-primary font-normal leading-5 whitespace-pre-wrap break-all"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setIsAnswerEditing(true)}
                                  className="w-full text-left text-[12px] font-normal leading-5 whitespace-pre-wrap break-all text-primary"
                                >
                                  {displayAnswer || ''}
                                </button>
                              )
                            ) : (
                              <div className={`w-full text-[12px] font-normal leading-5 whitespace-pre-wrap text-primary break-all ${!displayAnswer ? 'opacity-50' : ''}`}>
                                {displayAnswer || '답변을 준비하고 있어요.'}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  
                  {showAnswerSection ? (
                    <div className="w-13.75 shrink-0 self-end translate-y-1/2">
                      <img src={CodukIcon} alt="coduk" className="w-13.75" />
                    </div>
                  ) : hasAnswer ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (isAdmin) {
                          enterAdminAnswerMode(t.threadId, false)
                        } else {
                          setExpandedThreadId((prev) =>
                            prev === t.threadId ? null : t.threadId
                          )
                        }
                      }}
                      className="shrink-0 self-end -ml-2 z-20"
                    >
                      <img src={CheckIcon} alt="answered" className="w-4.25 h-4.25" />
                    </button>
                  ) : isAdmin ? (
                    <button
                      type="button"
                      onClick={() => enterAdminAnswerMode(t.threadId, true)}
                      className="shrink-0 self-end -ml-2 z-20"
                    >
                      <img src={ReplyIcon} alt="reply" className="w-4.25 h-4.25" />
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
        </div>
        {showScrollToBottom ? (
          <button
            type="button"
            onClick={() => {
              const el = listRef.current
              if (!el) return
              el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
            }}
            className="sticky bottom-(--sab) w-full"
          >
            <div className="w-full h-16.5 flex items-center justify-center [background:linear-gradient(180deg,rgba(246,241,236,0)_0%,rgba(245,233,213,0.9)_100%)]">
              <img src={ScrollToBottomIcon} alt="scroll to bottom" className="w-5 h-5 mt-5" />
            </div>
          </button>
        ) : null}
      </div>
    </div>
  )
}
