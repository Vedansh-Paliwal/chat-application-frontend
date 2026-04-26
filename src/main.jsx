import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './config/AppRoutes'
import { Toaster } from 'react-hot-toast'
import { ChatProvider } from './context/ChatContext.jsx'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <Toaster />
      <ChatProvider>
        <AppRoutes />
      </ChatProvider>
    </BrowserRouter>
);