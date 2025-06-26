import { Outlet } from 'react-router-dom'
import Header from '@/components/Header'

export default function Layout() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden gap-2 pb-2">
      <Header />
      <Outlet /> {/* conteúdo da página corrente */}
    </div>
  )
}
