import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { BASE_ROLES_BY_COUNT, MAX_TRAITOR_SPECIALS } from '../gameRules'

const ROLE_ID_MAP = { percival: 'PERCIVAL', mordred: 'MORDRED', morgana: 'MORGANA', oberon: 'OBERON' }

// Returns true if roleKey is in the default set for playerCount
function isDefaultForCount(roleKey, playerCount) {
  const base = BASE_ROLES_BY_COUNT[playerCount]
  if (!base) return false
  const roleId = ROLE_ID_MAP[roleKey]
  return [...base.loyal, ...base.traitor].includes(roleId)
}

// Returns the effective included state: explicit override wins, else base default
function effectiveState(roleKey, playerCount, optionalRoles) {
  if (optionalRoles[roleKey] !== undefined) return optionalRoles[roleKey]
  return isDefaultForCount(roleKey, playerCount)
}

const SPECIAL_ROLES = [
  {
    key: 'percival', team: 'loyal',
    avalon: 'Percival',     descAvalon:  'Sees Merlin (confused by Morgana)',
    polashi: 'মোহন লাল',   descPolashi: 'মীর মদন ও ঘষেটি বেগমকে দেখে কিন্তু কে কোনটা জানে না',
  },
  {
    key: 'morgana', team: 'traitor',
    avalon: 'Morgana',     descAvalon:  'Appears as Merlin to Percival',
    polashi: 'ঘষেটি বেগম', descPolashi: 'মীর মদন সেজে মোহন লালকে বিভ্রান্ত করে',
  },
  {
    key: 'mordred', team: 'traitor',
    avalon: 'Mordred',     descAvalon:  'Hidden from Merlin',
    polashi: 'রায় দুর্লভ', descPolashi: 'উমিচাঁদ ছাড়া লাল দলের সবাইকে চেনে, কিন্তু মীর মদন রায় দুর্লভকে চেনে না',
  },
  {
    key: 'oberon', team: 'traitor',
    avalon: 'Oberon',      descAvalon:  'Unknown to all — even other traitors',
    polashi: 'উমিচাঁদ',     descPolashi: 'উমিচাঁদ লাল দলের হয়েও নিজ দলের কাউকে চেনে না, কিন্তু মীর মদন জানে সে লাল দলে',
  },
]

export default function Lobby() {
  const navigate = useNavigate()
  const { roomState, myId, isHost, gameMode, updateSettings, startGame, connected } = useGame()
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  if (!roomState) return null

  const players       = roomState.players || []
  const optionalRoles = roomState.optionalRoles || {}
  const playerCount   = players.length
  const isPolashi     = gameMode === 'polashi'
  const canStart      = playerCount >= 5 && playerCount <= 10
  const shareUrl      = `${window.location.origin}/room/${roomState.code}`

  const copyLink = () => navigator.clipboard?.writeText(shareUrl).catch(() => {})

  const toggleRole = (key) => {
    const current = effectiveState(key, playerCount, optionalRoles)
    const role = SPECIAL_ROLES.find(r => r.key === key)
    const newRoles = { ...optionalRoles }

    if (!current && role.team === 'traitor') {
      const maxSlots = MAX_TRAITOR_SPECIALS[playerCount]
      if (maxSlots !== undefined) {
        const traitorSpecials = SPECIAL_ROLES.filter(r => r.team === 'traitor' && r.key !== key)
        const activeTicked = traitorSpecials.filter(r => effectiveState(r.key, playerCount, newRoles))
        if (activeTicked.length >= maxSlots) {
          // No free slot — untick the first active one to make room
          newRoles[activeTicked[0].key] = false
        }
      }
    }

    newRoles[key] = !current
    updateSettings(roomState.code, { optionalRoles: newRoles })
  }

  const toggleLadyOfLake = () =>
    updateSettings(roomState.code, { ladyOfLakeEnabled: !roomState.ladyOfLakeEnabled })

  const toggleGameMode = () =>
    updateSettings(roomState.code, { gameMode: isPolashi ? 'avalon' : 'polashi' })

  const handleStart = () => {
    setLoading(true)
    setError('')
    startGame(roomState.code, (res) => {
      setLoading(false)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="page" style={{ paddingTop: 24, paddingBottom: 32 }}>
      <div className="container animate-in">

        {/* Header */}
        <div className="text-center" style={{ marginBottom: 20 }}>
          <p className="text-xs text-muted" style={{ marginBottom: 4 }}>Room Code</p>
          <div className="room-code">{roomState.code}</div>
          <button className="btn btn-ghost" onClick={copyLink} style={{ marginTop: 8 }}>
            📋 Copy invite link
          </button>
        </div>

        {/* Players */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <span className="font-semi">Players</span>
            <span className={`badge badge-${canStart ? 'loyal' : 'neutral'}`}>
              {playerCount} / 10
            </span>
          </div>
          <div className="flex-col gap-2">
            {players.map(p => (
              <div
                key={p.id}
                className={`player-chip${p.id === myId ? ' is-me' : ''}${p.id === roomState.hostId ? ' is-leader' : ''}${p.disconnected ? ' is-disconnected' : ''}`}
              >
                <div className="player-avatar">{p.name.slice(0, 2)}</div>
                <span>{p.name}</span>
                {p.id === roomState.hostId && <span className="text-xs text-gold">👑 Host</span>}
                {p.id === myId && p.id !== roomState.hostId && <span className="text-xs text-muted">(you)</span>}
                {p.disconnected && (
                  <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
                    📡 offline
                  </span>
                )}
              </div>
            ))}
          </div>
          {playerCount < 5 && (
            <p className="text-xs text-muted text-center" style={{ marginTop: 10 }}>
              Waiting for {5 - playerCount} more player{5 - playerCount !== 1 ? 's' : ''}…
            </p>
          )}
        </div>

        {/* Host settings */}
        {isHost && (
          <>
            {/* Game Mode */}
            <div className="card" style={{ marginBottom: 12 }}>
              <p className="text-sm font-semi" style={{ marginBottom: 10 }}>Game Mode</p>
              <div className="toggle-group">
                <div className={`toggle-option${!isPolashi ? ' active' : ''}`} onClick={toggleGameMode}>⚔️ Avalon</div>
                <div className={`toggle-option${isPolashi  ? ' active' : ''}`} onClick={toggleGameMode}>🇧🇩 Polashi</div>
              </div>
            </div>

            {/* Special Roles */}
            <div className="card" style={{ marginBottom: 12 }}>
              <p className="text-sm font-semi" style={{ marginBottom: 8 }}>Special Roles</p>
              <div className="flex-col gap-2">
                {SPECIAL_ROLES.map(r => {
                  const included = effectiveState(r.key, playerCount, optionalRoles)

                  return (
                    <div
                      key={r.key}
                      className={`player-chip clickable${included ? (r.team === 'loyal' ? ' loyal' : ' traitor') : ''}`}
                      style={{ justifyContent: 'space-between' }}
                      onClick={() => toggleRole(r.key)}
                    >
                      <span className="font-semi">{isPolashi ? r.polashi : r.avalon}</span>
                      <span className="text-xs text-muted" style={{ flex: 1, marginLeft: 8 }}>
                        {isPolashi ? r.descPolashi : r.descAvalon}
                      </span>
                      <span style={{ fontSize: '1rem' }}>{included ? '✓' : '+'}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Lady of the Lake (Avalon only) */}
            {!isPolashi && (
              <div className="card" style={{ marginBottom: 12 }}>
                <div
                  className={`player-chip clickable${roomState.ladyOfLakeEnabled ? ' loyal' : ''}`}
                  style={{ justifyContent: 'space-between' }}
                  onClick={toggleLadyOfLake}
                >
                  <div>
                    <span className="font-semi">Lady of the Lake</span>
                    <p className="text-xs text-muted">Reveals loyalty of one player after each mission</p>
                  </div>
                  <span>{roomState.ladyOfLakeEnabled ? '✓' : '+'}</span>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-traitor" style={{ marginBottom: 8 }}>{error}</p>}

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleStart}
              disabled={!canStart || loading || !connected}
            >
              {loading
                ? 'Starting…'
                : canStart
                  ? '▶ Start Game'
                  : `Need ${5 - playerCount} more player${5 - playerCount !== 1 ? 's' : ''}`}
            </button>
          </>
        )}

        {!isHost && (
          <div className="card text-center">
            <p className="text-muted">Waiting for the host to start the game…</p>
            <p className="text-xs text-muted" style={{ marginTop: 8 }}>
              Share the room code: <span className="text-primary font-semi">{roomState.code}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
