import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import {BrowserRouter} from 'react-router-dom'
import {ClerkProvider} from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './utils/queryClient.js'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl={'/'}>
  <QueryClientProvider client={queryClient}>
  <AppProvider>
    <App />
  </AppProvider>
  </QueryClientProvider>
  </ClerkProvider>
  </BrowserRouter>
)
