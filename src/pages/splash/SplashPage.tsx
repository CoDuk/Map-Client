import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '@/assets/logo.svg'
import LogoName from '@/assets/logoName.svg'

const NAV_DELAY_MS = 1800

export default function SplashPage() {
  const navigate = useNavigate()
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const inTimer = setTimeout(() => setAnimate(true), 50)
    const navTimer = setTimeout(() => {
      navigate('/main', { replace: true })
    }, NAV_DELAY_MS)
    return () => { clearTimeout(inTimer); clearTimeout(navTimer) }
  }, [navigate])

  return (
    <div className="relative min-h-screen bg-cream-100 overflow-hidden flex items-center justify-center">
      <div
        className={`flex flex-col items-center gap-4 transition-all duration-700 ease-in-out ${
          animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <img src={Logo} alt="Map Pin Logo" className="w-[169px] h-[233px] drop-shadow-md" />
        <img src={LogoName} alt="Map In Duksung" className="w-[247px] h-[42px]" />
      </div>
    </div>
  )
}
