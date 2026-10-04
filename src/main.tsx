import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { AuthProvider } from './lib/AuthContext'
import { Analytics } from "@vercel/analytics/react"


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Analytics />
    </AuthProvider>
  </StrictMode>,
)
