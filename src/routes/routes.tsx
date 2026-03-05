import { createBrowserRouter } from "react-router-dom"
import type { RouteObject } from "react-router-dom"
import LoginPage from "@/pages/auth/LoginPage"
import MainPage from "@/pages/map/MainPage"
import MapPage from "@/pages/map/MapPage"
import QnaPage from "@/pages/qna/QnaPage"
import MyPage from "@/pages/my/MyPage"
import NotFoundPage from "@/pages/notFound/NotFoundPage"
import RootLayout from "@/layout/RootLayout"
import ProtectedLayout from "@/layout/ProtectedLayout"

const publicChildren: RouteObject[] = [
  { index: true, element: <LoginPage /> },
    { path: "main", element: <MainPage /> },
  { path: "map", element: <MapPage /> },
]

const protectedChildren: RouteObject[] = [

  { path: "qna", element: <QnaPage /> },
  { path: "my", element: <MyPage /> },
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