import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import App from './app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" duration={5000} richColors toastOptions={{ style: { zIndex: 99999 } }} />
    </BrowserRouter>
  </StrictMode>,
)
