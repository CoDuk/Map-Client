import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '@/assets/logo.svg'
import LogoName from '@/assets/logoName.svg'
import AlertIcon from '@/assets/alert.svg'
import NextIcon from '@/assets/nextB.svg'
import NextIconB from '@/assets/nextburgun.svg'
import { sendAuthEmailCode } from '@/apis/auth/email'
import { verifyAuthEmailCode } from '@/apis/auth/verify'
import { getAccessToken } from '@/apis/client'
import MailVerificationSkeleton from '@/pages/auth/components/MailVerificationSkeleton'

export default function LoginPage() {
  const [animate, setAnimate] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [didSend, setDidSend] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])
  const lastVerifyCodeRef = useRef<string>('')
  const [isResending, setIsResending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const navigate = useNavigate()

  // 이미 로그인된 경우 마지막 페이지 또는 /main으로 이동
  useEffect(() => {
    if (getAccessToken()) {
      const last = localStorage.getItem('lastMapPath')
      navigate(last ?? '/main', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true)
      setTimeout(() => setShowForm(true), 700)
    }, 1800)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!didSend) return
    setSecondsLeft(300)
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [didSend])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const isCommitted = !isFocused && email.length > 0

  const timeText = useMemo(() => {
    const m = Math.floor(secondsLeft / 60)
    const s = secondsLeft % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }, [secondsLeft])

  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)

  const handleSendCode = async () => {
    if (!email || isSending || didSend) return

    try {
      setSendError(null)
      setIsSending(true)
      const res = await sendAuthEmailCode(email)

      if (!res?.isSuccess) {
        throw new Error(res?.message || '인증 코드 발송에 실패했습니다.')
      }

      setDidSend(true)
      setShowOtp(false)
      setOtp(Array(6).fill(''))
      setVerifyError(null)
      lastVerifyCodeRef.current = ''

    } catch (e) {
      const message = e instanceof Error ? e.message : '인증 코드 발송에 실패했습니다.'
      setSendError(message)
      setDidSend(false)
    } finally {
      setIsSending(false)
    }
  }

  const handleResend = async () => {
    if (!email || isResending) return
    try {
      setIsResending(true)
      const res = await sendAuthEmailCode(email)

      if (!res?.isSuccess) {
        throw new Error(res?.message || '인증 코드 재전송에 실패했습니다.')
      }

      setOtp(Array(6).fill(''))
      setVerifyError(null)
      lastVerifyCodeRef.current = ''
      setSecondsLeft(300)
    } catch (e) {
      console.error(e)
    } finally {
      setIsResending(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    setVerifyError(null)
    const v = value.replace(/[^0-9]/g, '').slice(-1)
    setOtp((prev) => {
      const next = [...prev]
      next[index] = v
      return next
    })
    if (v && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const getDeviceId = () => {
    const key = 'x-device-id'
    const existing = localStorage.getItem(key)
    if (existing) return existing

    const next =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

    localStorage.setItem(key, next)
    return next
  }

  const handleOtpPaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const raw = e.clipboardData.getData('text')
    const digits = raw.replace(/[^0-9]/g, '').slice(0, 6).split('')
    if (digits.length === 0) return

    e.preventDefault()

    setOtp((prev) => {
      const next = [...prev]
      for (let i = 0; i < 6 - index; i += 1) {
        if (!digits[i]) break
        next[index + i] = digits[i]
      }
      return next
    })

    const lastIndex = Math.min(index + digits.length - 1, 5)
    otpRefs.current[lastIndex]?.focus()
  }

  useEffect(() => {
    if (!showOtp) return
    if (!email) return
    if (isVerifying) return

    const code = otp.join('')
    const isComplete = code.length === 6 && otp.every((d) => d.length === 1)

    if (!isComplete) {
      lastVerifyCodeRef.current = ''
      return
    }

    if (lastVerifyCodeRef.current === code) return
    lastVerifyCodeRef.current = code

    ;(async () => {
      try {
        setVerifyError(null)
        setIsVerifying(true)
        const deviceId = getDeviceId()
        const res = await verifyAuthEmailCode({ duksungId: email, code, deviceId })

        if (res?.result?.accessToken) {
          localStorage.setItem('accessToken', res.result.accessToken)
          navigate('/main')
        }
      } catch (e) {
        const raw = e instanceof Error ? e.message : ''
        const lower = raw.toLowerCase()
        if (raw.includes('만료') || lower.includes('expired')) {
          setVerifyError('인증번호가 만료되었습니다.')
        } else {
          setVerifyError('인증번호가 일치하지 않습니다.')
        }
        lastVerifyCodeRef.current = ''
      } finally {
        setIsVerifying(false)
      }
    })()
  }, [email, otp, showOtp])

  return (
    <div className="relative min-h-screen bg-cream-100 overflow-hidden">
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-[317px] transition-all duration-700 ease-in-out ${
          animate ? 'top-[188px]' : 'top-1/2 -translate-y-1/2'
        }`}
      >
        <div className="w-[247px] mx-auto flex flex-col items-center gap-4">
          <img
            src={Logo}
            alt="Map Pin Logo"
            className="w-[169px] h-[233px] drop-shadow-md"
          />
          <img
            src={LogoName}
            alt="Map In Duksung"
            className={`w-[247px] h-[42px] origin-center transition-transform duration-700 ${
              animate ? 'scale-[0.712]' : 'scale-100'
            }`}
          />
        </div>

        {showForm && (
          <div className="flex flex-col items-center">
            <div className="mt-[47px] w-[317px] mx-auto flex items-center justify-between">
              <div className={`${email && !didSend ? 'w-[261px]' : 'w-[317px]'} h-[54px] rounded-full bg-rose-100 px-[30px] py-[15px] flex items-center`}>
                <div
                  className={`flex-1 min-w-0 border-b ${
                    isCommitted ? 'border-rose-300' : 'border-neutral-300'
                  }`}
                >
                  <input
                    type="text"
                    value={email}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSendCode()
                      }
                    }}
                    className={`w-full bg-transparent outline-none text-center text-[14px] font-medium truncate ${
                      isCommitted ? 'text-rose-300' : 'text-neutral-300'
                    } placeholder-neutral-100`}
                  />
                </div>

                <span
                  className={`shrink-0 text-[14px] font-medium ${
                    isCommitted ? 'text-rose-300' : 'text-neutral-300'
                  }`}
                >
                  @duksung.ac.kr
                </span>
              </div>

              {email && !didSend ? (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSending}
                  className={`w-10 h-10 ml-4 ${isSending ? 'opacity-60' : 'opacity-100'}`}
                >
                  <img src={NextIcon} alt="next" className="w-10 h-10" />
                </button>
              ) : null}
            </div>

            {sendError ? (
              <div className="mt-2 w-[317px] text-center text-primary text-[12px] font-medium">
                {sendError}
              </div>
            ) : null}

            {isSending && !didSend ? (
              <MailVerificationSkeleton className="mt-6" />
            ) : null}

            {didSend && !showOtp ? (
              <a
                href="https://mail.duksung.ac.kr/account/login.do"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowOtp(true)}
                className="mt-[18px] text-primary text-[14px] font-bold flex items-center"
              >
                덕성 메일 바로 가기
                <img src={NextIconB} alt="next" />
              </a>
            ) : null}

            {showOtp ? (
              <div className="w-full flex flex-col items-center">

                <div className="mt-[30px] flex items-end gap-[8px] ml-[25px]">
                  {otp.map((digit, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <input
                        ref={(el) => {
                          otpRefs.current[i] = el
                        }}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={(e) => handleOtpPaste(i, e)}
                        inputMode="numeric"
                        maxLength={1}
                        disabled={isVerifying}
                        className="w-[35px] bg-transparent outline-none text-center text-primary text-[36px] font-bold"
                      />
                      <div className="w-[35px] h-[2px] bg-primary" />
                    </div>
                  ))}

                  <div className="ml-[13px] text-cream-300 text-[16px] font-semibold">
                    {timeText}
                  </div>
                </div>

                {verifyError ? (
                  <div className="mt-3 w-[317px] text-center text-primary text-[12px] font-medium">
                    {verifyError}
                  </div>
                ) : null}

                {isResending ? (
                  <MailVerificationSkeleton className="mt-6" />
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="mt-[20px] text-primary-dark text-[10px] font-medium underline"
                  >
                    <a
                      href="https://mail.duksung.ac.kr/account/login.do"
                      target="_blank">
                    인증 번호 재전송
                    </a>
                  </button>
                )}
              </div>
            ) : null}

            {!email && !didSend ? (
              <img src={AlertIcon} alt="alert" className="w-62.5 mt-[10px]" />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
