import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Logo from '@/assets/logo.svg'

export default function Header() {
  const { pathname } = useLocation()

  const isQna = useMemo(() => pathname.toLowerCase().includes('qna'), [pathname])
  const isMy = useMemo(() => pathname.toLowerCase().includes('my'), [pathname])

  return (
    <header className="sticky top-0 z-50 w-full bg-cream-0 [box-shadow:0_3px_10px_0_rgba(0,0,0,0.25)] [padding-top:var(--sat)]">
      <div className="h-[61px] flex items-center justify-center px-4">
        {isQna ? (
          <h1 className="text-primary-dark text-[20px] font-bold">문의 사항</h1>
        ) : isMy ? (
          <h1 className="text-primary-dark text-[20px] font-bold">마이페이지</h1>
        ) : (
          <img src={Logo} alt="Map In Duksung" className="h-[35px] w-auto" />
        )}
      </div>
    </header>
  )
}