import { Outlet, Navigate } from "react-router-dom"


export default function ProtectedLayout() {
  const isAuthenticated = true // TODO: 실제 인증 상태로 변경

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />
  }

  return (
    <div className="protected-layout">
      <Outlet />
    </div>
  )
}
