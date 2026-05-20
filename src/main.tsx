import React from "react"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReactDOM from "react-dom/client"
import App from "./App"
import { LanguageProvider } from "@/contexts/LanguageContext"
import "./index.css"

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>
)