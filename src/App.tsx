import { useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import { router } from "@/routes/routes"

function App() {
  useEffect(() => {
    const handleOffline = () => {
      window.location.href = "/offline.html"
    }

    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
      <RouterProvider router={router} />
  )
}

export default App
