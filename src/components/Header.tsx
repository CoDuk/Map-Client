import { useNavigate } from 'react-router-dom'
import Logo from '@/assets/logo.svg'

export default function Header() {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 w-full bg-cream-0 [box-shadow:0_3px_10px_0_rgba(0,0,0,0.25)] [padding-top:var(--sat)]">
      <div className="h-[61px] flex items-center justify-center px-4">
        <button type="button" onClick={() => navigate('/')} className="block">
          <img src={Logo} alt="Map In Duksung" className="h-[35px] w-auto" />
        </button>
      </div>
    </header>
  )
}
