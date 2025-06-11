import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { PlayersProvider } from './context/PlayersContext.js'
import { RoundsProvider } from './context/RoundsContext.js'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <PlayersProvider>
    <RoundsProvider>
      <App />
    </RoundsProvider>
  </PlayersProvider>,
)
