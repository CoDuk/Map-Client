import { Outlet, useLocation } from 'react-router-dom'
import Header from '@/components/Header'
import FloatingMenu from '@/components/FloatingMenu'

export default function RootLayout() {
  const { pathname } = useLocation()
  const hideHeader = pathname === '/'

  return (
    <div className="root-layout h-full">
      {!hideHeader ? <Header /> : null}
      {!hideHeader ? <FloatingMenu /> : null}
      <Outlet />
    </div>
  )
}
