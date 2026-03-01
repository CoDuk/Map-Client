import { Outlet, Navigate } from "react-router-dom"

// TODO: 실제 인증 상태는 Context API, Redux 등에서 가져오기
const isAuthenticated = false

export default function ProtectedLayout() {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="protected-layout">
      <Outlet />
    </div>
  )
}
