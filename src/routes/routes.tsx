import { createBrowserRouter } from "react-router-dom"
import type { RouteObject } from "react-router-dom"
import HomePage from "@/pages/Home/HomePage"
import LoginPage from "@/pages/Auth/LoginPage"
import NotFoundPage from "@/pages/NotFound/NotFoundPage"
import RootLayout from "@/components/RootLayout"
import ProtectedLayout from "@/components/ProtectedLayout"

const publicChildren: RouteObject[] = [
  { index: true, element: <LoginPage /> },
  { path: "login", element: <LoginPage /> },
]

const protectedChildren: RouteObject[] = [
  { path: "home", element: <HomePage /> },
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