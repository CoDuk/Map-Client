import { createBrowserRouter } from "react-router-dom"
import type { RouteObject } from "react-router-dom"
import SplashPage from "@/pages/splash/SplashPage"
import MainPage from "@/pages/map/MainPage"
import MapPage from "@/pages/map/MapPage"
import NotFoundPage from "@/pages/notFound/NotFoundPage"
import RootLayout from "@/layout/RootLayout"

const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <SplashPage /> },
      { path: "main", element: <MainPage /> },
      { path: "map", element: <MapPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]

export const router = createBrowserRouter(routes)
