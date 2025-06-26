import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { PlayersProvider } from './context/PlayersContext.js'
import { RoundsProvider } from './context/RoundsContext.js'
import { Toaster } from '@/components/ui/sonner'
import { CourtsProvider } from '@/context/CourtsContext'
import { AuthProvider } from '@/context/AuthContext'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <CourtsProvider>
        <PlayersProvider>
          <RoundsProvider>
            <App />
            <Toaster position="top-center" visibleToasts={1} />
          </RoundsProvider>
        </PlayersProvider>
      </CourtsProvider>
    </AuthProvider>
  </BrowserRouter>,
)
