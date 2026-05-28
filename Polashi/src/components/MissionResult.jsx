import { useState } from 'react'
import { useGame } from '../context/GameContext'
import GameLayout from './GameLayout'
import { MISSION_TERMS } from '../data/characters'

export default function MissionResult() {
  const { roomState, isHost, gameMode, advanceFromMissionResult } = useGame()
  const [loading, setLoading] = useState(false)

  if (!roomState?.gameState) return null
  const gs       = roomState.gameState
  const missions = gs.missions || []
  const last     = missions[missions.length - 1]
  const terms    = MISSION_TERMS[gameMode]
  const isPolashi = gameMode === 'polashi'

  if (!last) return null

  const { loyalWon, failCount, cardCount, autoRejected } = last

  const handleContinue = () => {
    setLoading(true)
    advanceFromMissionResult(roomState.code, (res) => {
      setLoading(false)
    })
  }

  return (
    <GameLayout title={`${terms.mission} ${last.missionIndex + 1} Result`}>
      <div className="card animate-in text-center" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>
          {loyalWon ? '🎉' : '💥'}
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: loyalWon ? 'var(--loyal)' : 'var(--traitor)', marginBottom: 8 }}>
          {autoRejected
            ? (isPolashi ? 'স্বয়ংক্রিয় বিফলতা!' : 'Auto-Sabotaged!')
            : loyalWon
              ? (isPolashi ? 'অভিযান সফল!' : 'Mission Succeeded!')
              : (isPolashi ? 'অভিযান ব্যর্থ!' : 'Mission Sabotaged!')}
        </h2>

        {autoRejected ? (
          <p className="text-sm text-muted">
            5 proposals were rejected in a row — the traitors win this mission automatically.
          </p>
        ) : (
          <div style={{ marginTop: 12 }}>
            <p className="text-sm text-muted" style={{ marginBottom: 8 }}>Cards revealed:</p>
            <div className="flex flex-center gap-2" style={{ justifyContent: 'center' }}>
              {Array.from({ length: cardCount }, (_, i) => {
                const isFailCard = i < failCount
                return (
                  <div key={i} style={{
                    width: 44, height: 60, borderRadius: 6,
                    background: isFailCard ? 'var(--traitor-dim)' : 'var(--loyal-dim)',
                    border: `2px solid ${isFailCard ? 'var(--traitor)' : 'var(--loyal)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}>
                    {isFailCard ? '💀' : '✅'}
                  </div>
                )
              })}
            </div>
            {failCount > 0 && (
              <p className="text-sm text-traitor" style={{ marginTop: 8 }}>
                {failCount} Fail card{failCount !== 1 ? 's' : ''} played
              </p>
            )}
          </div>
        )}
      </div>

      {/* Score summary */}
      <div className="card text-center" style={{ marginBottom: 16 }}>
        <p className="text-sm text-muted" style={{ marginBottom: 8 }}>Score</p>
        <div className="flex flex-center gap-4" style={{ justifyContent: 'center', gap: 24 }}>
          <div>
            <p className="text-2xl font-bold text-loyal">{gs.loyalWins}</p>
            <p className="text-xs text-muted">Loyal</p>
          </div>
          <div style={{ color: 'var(--border)', fontSize: '1.5rem' }}>—</div>
          <div>
            <p className="text-2xl font-bold text-traitor">{gs.traitorWins}</p>
            <p className="text-xs text-muted">Traitors</p>
          </div>
        </div>
      </div>

      {isHost && (
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? 'Continuing…' : isPolashi ? 'পরবর্তী →' : 'Continue →'}
        </button>
      )}
      {!isHost && (
        <p className="text-center text-sm text-muted pulse">Waiting for host to continue…</p>
      )}
    </GameLayout>
  )
}
