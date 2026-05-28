import { Routes, Route, Navigate } from 'react-router-dom'
import { useGame } from './context/GameContext'
import HomePage from './pages/HomePage'
import RoomPage from './pages/RoomPage'
import Notifications from './components/Notifications'

export default function App() {
  const { connected, gameMode } = useGame()

  return (
    <div data-mode={gameMode}>
      {!connected && (
        <div className="conn-banner pulse">Connecting to server…</div>
      )}
      <Notifications />
      <Routes>
        <Route path="/"           element={<HomePage />} />
        <Route path="/room/:code" element={<RoomPage />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
