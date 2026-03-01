import { createBrowserRouter } from "react-router-dom"
import type { RouteObject } from "react-router-dom"
import SplashPage from "@/pages/splash/SplashPage"
import LoginPage from "@/pages/auth/LoginPage"
import MainPage from "@/pages/map/MainPage"
import MapPage from "@/pages/map/MapPage"
import QnaPage from "@/pages/qna/QnaPage"
import AdminMode from "@/pages/qna/AdminMode"
import NotFoundPage from "@/pages/notFound/NotFoundPage"
import RootLayout from "@/layout/RootLayout"
import ProtectedLayout from "@/layout/ProtectedLayout"

const publicChildren: RouteObject[] = [
  { index: true, element: <SplashPage /> },
  { path: "splash", element: <SplashPage /> },
  { path: "login", element: <LoginPage /> },
]

const protectedChildren: RouteObject[] = [
  { path: "main", element: <MainPage /> },
  { path: "map", element: <MapPage /> },
  { path: "qna", element: <QnaPage /> },
  { path: "admin", element: <AdminMode /> },
]

const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      ...publicChildren,
      {
        element: <ProtectedLayout />,
        children: protectedChildren,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]

export const router = createBrowserRouter(routes)