import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import MapFloating from '@/assets/mapFloating.svg'
import AdminFloating from '@/assets/adminFloating.svg'
import QnaFloating from '@/assets/qnaFloating.svg'

export default function FloatingMenu() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const { primary, secondary } = useMemo(() => {
    const path = pathname.toLowerCase()

    if (path.includes('qna')) {
      return {
        primary: { icon: MapFloating, to: '/main', alt: 'map' },
        secondary: { icon: AdminFloating, to: '/my', alt: 'admin' },
      }
    }

    if (path.includes('my')) {
      return {
        primary: { icon: MapFloating, to: '/main', alt: 'map' },
        secondary: { icon: QnaFloating, to: '/qna', alt: 'qna' },
      }
    }

    return {
      primary: { icon: QnaFloating, to: '/qna', alt: 'qna' },
      secondary: { icon: AdminFloating, to: '/my', alt: 'admin' },
    }
  }, [pathname])

  return (
    <div className="fixed right-[21px] z-50 bottom-[calc(43px+var(--sab))] flex flex-col items-center gap-2">
      <button type="button" onClick={() => navigate(primary.to)} className="block">
        <img src={primary.icon} alt={primary.alt} className="block" />
      </button>
      <button type="button" onClick={() => navigate(secondary.to)} className="block">
        <img src={secondary.icon} alt={secondary.alt} className="block" />
      </button>
    </div>
  )
}