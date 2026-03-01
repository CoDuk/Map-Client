import { useEffect, useState } from 'react'
import Logo from '@/assets/logo.svg'
import LogoName from '@/assets/logoName.svg'
import AlertIcon from '@/assets/alert.svg'
import NextIcon from '@/assets/nextB.svg'

export default function SplashPage() {
  const [animate, setAnimate] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true)
      setTimeout(() => setShowForm(true), 700)
    }, 1800)

    return () => clearTimeout(timer)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const isCommitted = !isFocused && email.length > 0

  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)

  return (
    <div className="relative min-h-screen bg-cream-100 overflow-hidden">
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-[317px] transition-all duration-700 ease-in-out ${
          animate ? 'top-[236px]' : 'top-1/2 -translate-y-1/2'
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
            <div className="mt-[47px] flex items-center justify-center gap-4">
              <div className="w-[317px] h-[54px] rounded-full bg-rose-100 px-[30px] py-[15px] flex items-center">
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

              {email ? (
                <img src={NextIcon} alt="next" className="w-10 h-10" />
              ) : null}
            </div>

            {!email ? (
              <img src={AlertIcon} alt="alert" className="w-62.5 mt-[10px]" />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
