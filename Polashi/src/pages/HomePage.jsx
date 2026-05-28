import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'

export default function HomePage() {
  const navigate = useNavigate()
  const { createRoom, joinRoom, connected } = useGame()

  const [mode, setMode]             = useState('create')   // 'create' | 'join'
  const [gameMode, setGameMode]     = useState('avalon')   // 'avalon' | 'polashi'
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const handleCreate = () => {
    if (!playerName.trim()) return setError('Enter your name first.')
    setLoading(true)
    setError('')
    createRoom(playerName.trim(), gameMode, (res) => {
      setLoading(false)
      if (res?.error) return setError(res.error)
      navigate(`/room/${res.code}`)
    })
  }

  const handleJoin = () => {
    if (!playerName.trim()) return setError('Enter your name first.')
    if (!roomCode.trim())   return setError('Enter a room code.')
    setLoading(true)
    setError('')
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim(), (res) => {
      setLoading(false)
      if (res?.error) return setError(res.error)
      navigate(`/room/${roomCode.trim().toUpperCase()}`)
    })
  }

  const isPolashi = gameMode === 'polashi'

  return (
    <div className="page flex-center" style={{ paddingTop: 40 }}>
      <div className="container animate-in">

        {/* Header */}
        <div className="text-center mb-4" style={{ paddingBottom: 8 }}>
          {/* Small uppercase tagline on top */}
          <p style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            {isPolashi ? '১৭৫৭ • পলাশীর প্রান্তর' : 'Arthurian Legend'}
          </p>

          {/* Icon inline with name */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 6,
          }}>
            <span style={{
              fontSize: '2.5rem',
              filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4))',
              lineHeight: 1,
            }}>
              {isPolashi ? '🗡️' : '⚔️'}
            </span>
            <h1 style={{
              fontSize: '2.2rem',
              fontWeight: 700,
              color: 'var(--primary)',
              lineHeight: 1,
            }}>
              {isPolashi ? 'পলাশী' : 'Avalon'}
            </h1>
          </div>

          <p className="text-muted text-sm">
            {isPolashi ? 'বুদ্ধি ও প্রতারণার খেলা' : 'A game of wit and deception'}
          </p>
        </div>

        {/* Game Mode Toggle */}
        <div className="card mb-4">
          <p className="text-sm text-muted mb-2" style={{ marginBottom: 8 }}>Game Mode</p>
          <div className="toggle-group">
            <div
              className={`toggle-option${gameMode === 'avalon' ? ' active' : ''}`}
              onClick={() => setGameMode('avalon')}
            >
              ⚔️ Avalon
            </div>
            <div
              className={`toggle-option${gameMode === 'polashi' ? ' active' : ''}`}
              onClick={() => setGameMode('polashi')}
            >
              🇧🇩 Polashi
            </div>
          </div>
        </div>

        {/* Create / Join Tabs */}
        <div className="card">
          <div className="toggle-group mb-4" style={{ marginBottom: 16 }}>
            <div
              className={`toggle-option${mode === 'create' ? ' active' : ''}`}
              onClick={() => { setMode('create'); setError('') }}
            >
              Create Room
            </div>
            <div
              className={`toggle-option${mode === 'join' ? ' active' : ''}`}
              onClick={() => { setMode('join'); setError('') }}
            >
              Join Room
            </div>
          </div>

          <div className="flex-col gap-3">
            <div>
              <label className="text-sm text-muted" style={{ display: 'block', marginBottom: 6 }}>
                Your Name
              </label>
              <input
                className="input"
                placeholder={isPolashi ? 'আপনার নাম লিখুন…' : 'Enter your name…'}
                value={playerName}
                maxLength={20}
                onChange={e => { setPlayerName(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && (mode === 'create' ? handleCreate() : handleJoin())}
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: 6 }}>
                  Room Code
                </label>
                <input
                  className="input"
                  placeholder="e.g. MIRJF3"
                  value={roomCode}
                  maxLength={6}
                  onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  style={{ letterSpacing: '0.2em', fontFamily: 'monospace', fontSize: '1.1rem' }}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-traitor">{error}</p>
            )}

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading || !connected}
            >
              {loading
                ? 'Connecting…'
                : mode === 'create'
                  ? isPolashi ? 'রুম তৈরি করুন' : 'Create Room'
                  : isPolashi ? 'রুমে যোগ দিন' : 'Join Room'
              }
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted mt-4" style={{ marginTop: 20, lineHeight: 1.8 }}>
          5–10 players · No account required<br />
          Play over Discord voice chat
        </p>
      </div>
    </div>
  )
}
