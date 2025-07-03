import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--surface-color)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        },
      }}
    />
    <App />
  </StrictMode>,
)
