import 'scrollyfills'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { PlayersProvider } from './context/PlayersContext.js'
import { Toaster } from '@/components/ui/sonner'
import { FormationModeProvider } from '@/context/FormationModeContext'
import { CourtsProvider } from './context/CourtsContext.js'
import { MatchesProvider } from './context/MatchesContext.js'

createRoot(document.getElementById('root')!).render(
  <FormationModeProvider>
    <PlayersProvider>
      <MatchesProvider>
        <CourtsProvider>
          <App />
          <Toaster position="top-center" visibleToasts={1} />
        </CourtsProvider>
      </MatchesProvider>
    </PlayersProvider>
  </FormationModeProvider>,
)
