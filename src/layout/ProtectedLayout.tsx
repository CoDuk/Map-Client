import { Outlet, Navigate } from "react-router-dom";
import { getAccessToken } from "@/apis/client";

export default function ProtectedLayout() {
  const isAuthenticated = Boolean(getAccessToken());

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="protected-layout">
      <Outlet />
    </div>
  );
}
