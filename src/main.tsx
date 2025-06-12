import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { PlayersProvider } from './context/PlayersContext.js'
import { RoundsProvider } from './context/RoundsContext.js'
import { Toaster } from '@/components/ui/sonner'

createRoot(document.getElementById('root')!).render(
  <PlayersProvider>
    <RoundsProvider>
      <App />
      <Toaster />
    </RoundsProvider>
  </PlayersProvider>,
)
