import 'scrollyfills'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { PlayersProvider } from './context/PlayersContext.js'
import { Toaster } from '@/components/ui/sonner'
import { CourtsProvider } from './context/CourtsContext.js'
import { MatchesProvider } from './context/MatchesContext.js'
import { VersionGuard } from '@/components/VersionGuard'

createRoot(document.getElementById('root')!).render(
  <PlayersProvider>
    <MatchesProvider>
      <CourtsProvider>
        <VersionGuard>
          <App />
          <Toaster position="top-center" visibleToasts={1} />
        </VersionGuard>
      </CourtsProvider>
    </MatchesProvider>
  </PlayersProvider>,
)
