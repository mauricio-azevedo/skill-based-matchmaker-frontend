import { useEffect, useState } from 'react'
import * as React from 'react'
import PlayersTab from './components/PlayersTab'
import MatchesTab from './components/MatchesTab'
import LeaderboardTab from './components/LeaderboardTab'

const App: React.FC = () => {
  const [tab, setTab] = useState<'players' | 'matches' | 'leaderboard'>('players')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* NavBar */}
      <header className="navbar bg-base-200 px-4">
        <a className="btn btn-ghost text-xl">Skill‑Based Matchmaker</a>
        <div className="ml-auto flex items-center space-x-2">
          <label className="swap swap-rotate">
            <input type="checkbox" onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} />
            <svg
              className="swap-on fill-current w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              data-set-theme="dark"
            >
              <path d="M5.64 17.64A9 9 0 0 1 12 3v9z" />
            </svg>
            <svg
              className="swap-off fill-current w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              data-set-theme="light"
            >
              <path d="M5 12a7 7 0 0 1 14 0" />
            </svg>
          </label>
        </div>
      </header>

      {/* Tabs Bar */}
      <div role="tablist" className="tabs tabs-boxed join mb-4 mx-auto mt-4">
        <button
          role="tab"
          className={`tab join-item${tab === 'players' ? ' tab-active' : ''}`}
          onClick={() => setTab('players')}
        >
          Players
        </button>
        <button
          role="tab"
          className={`tab join-item${tab === 'matches' ? ' tab-active' : ''}`}
          onClick={() => setTab('matches')}
        >
          Matches
        </button>
        <button
          role="tab"
          className={`tab join-item${tab === 'leaderboard' ? ' tab-active' : ''}`}
          onClick={() => setTab('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      {/* Content */}
      <main className="flex-grow overflow-hidden">
        {tab === 'players' && <PlayersTab />}
        {tab === 'matches' && <MatchesTab />}
        {tab === 'leaderboard' && <LeaderboardTab />}
      </main>

      <footer className="p-4 text-center text-xs opacity-60">© 2025 Skill‑Based Matchmaker</footer>
    </div>
  )
}

export default App
