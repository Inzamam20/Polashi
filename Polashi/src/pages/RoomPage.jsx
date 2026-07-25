import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { PHASES } from '../gameRules'
import Lobby          from '../components/Lobby'
import NightPhase     from '../components/NightPhase'
import TeamProposal   from '../components/TeamProposal'
import Voting         from '../components/Voting'
import Mission        from '../components/Mission'
import MissionResult  from '../components/MissionResult'
import LadyOfLake     from '../components/LadyOfLake'
import FinalGuess     from '../components/FinalGuess'
import GameOver       from '../components/GameOver'

// Phase → component map. Adding a new phase = add one entry here.
const PHASE_COMPONENTS = {
  [PHASES.LOBBY]:          Lobby,
  [PHASES.NIGHT]:          NightPhase,
  [PHASES.TEAM_PROPOSAL]:  TeamProposal,
  [PHASES.VOTING]:         Voting,
  [PHASES.MISSION]:        Mission,
  [PHASES.MISSION_RESULT]: MissionResult,
  [PHASES.LADY_OF_LAKE]:   LadyOfLake,
  [PHASES.FINAL_GUESS]:    FinalGuess,
  [PHASES.GAME_OVER]:      GameOver,
}

export default function RoomPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const {
    getRoomState,
    joinRoom,
    roomState,
    connected,
    myId,
    gameMode,
  } = useGame()

  const [fetchError,   setFetchError]   = useState('')
  const [joinError,    setJoinError]    = useState('')
  const [joining,      setJoining]      = useState(false)
  const [name,         setName]         = useState('')

  // Fetch room state when this page first opens (works for refresh AND invite link).
  useEffect(() => {
    if (!connected || !code) return
    // Clear/set the error inside the async callback (not synchronously in the
    // effect body) — same result, avoids a redundant re-render.
    getRoomState(code, (res) => {
      setFetchError(res?.error || '')
    })
  }, [connected, code, getRoomState])

  const upperCode = code?.toUpperCase()
  const amInRoom = !!roomState?.players?.find(p => p.id === myId)
  const isPolashi = gameMode === 'polashi'

  const handleJoin = () => {
    const trimmed = name.trim()
    if (!trimmed) return setJoinError(isPolashi ? 'আপনার নাম লিখুন।' : 'Please enter your name.')
    setJoinError('')
    setJoining(true)
    joinRoom(upperCode, trimmed, (res) => {
      setJoining(false)
      if (res?.error) setJoinError(res.error)
    })
  }

  // ── Error: room not found ────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="page flex-center">
        <div className="card text-center animate-in" style={{ maxWidth: 360 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚪</div>
          <h2 className="text-lg font-bold" style={{ marginBottom: 8 }}>
            {isPolashi ? 'রুম পাওয়া যায়নি' : 'Room not found'}
          </h2>
          <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
            {isPolashi
              ? `কোড "${upperCode}" এর কোনো রুম নেই — হয়তো বন্ধ হয়ে গেছে।`
              : `No active room with code "${upperCode}". It may have closed.`}
          </p>
          <button
            className="btn btn-primary btn-full"
            onClick={() => navigate('/')}
          >
            {isPolashi ? 'হোমে ফিরুন' : 'Back to home'}
          </button>
        </div>
      </div>
    )
  }

  // ── Loading: waiting for server response ─────────────────────────────────
  if (!roomState) {
    return (
      <div className="page flex-center">
        <div className="text-center animate-in">
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <p className="text-muted">
            {isPolashi ? `রুম ${upperCode}-এ যোগ দিচ্ছি…` : `Joining room ${upperCode}…`}
          </p>
          <p className="text-xs text-muted" style={{ marginTop: 10 }}>
            {isPolashi
              ? <>কয়েক সেকেন্ড পরও দেখলে,{' '}<span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/')}>হোমে ফিরুন</span></>
              : <>If you see this for more than a few seconds,{' '}<span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/')}>go back home</span></>}
          </p>
        </div>
      </div>
    )
  }

  // ── Visitor arrived via invite link — prompt for a name and join ─────────
  if (!amInRoom) {
    const playerCount = roomState.players?.length ?? 0
    const gameStarted = roomState.gameState && roomState.gameState.phase !== PHASES.LOBBY
    const roomFull = playerCount >= 10

    return (
      <div className="page flex-center">
        <div className="card animate-in" style={{ maxWidth: 380, width: '100%' }}>
          <div className="text-center" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '2rem', marginBottom: 6 }}>🎴</div>
            <p className="text-xs text-muted" style={{ letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              {isPolashi ? 'আমন্ত্রণ' : 'Invite'}
            </p>
            <h2 className="text-xl font-bold" style={{ marginTop: 4, color: 'var(--primary)' }}>
              {upperCode}
            </h2>
            <p className="text-sm text-muted" style={{ marginTop: 6 }}>
              {gameStarted
                ? (isPolashi
                    ? 'খেলা ইতিমধ্যে শুরু হয়েছে।'
                    : 'A game is already in progress.')
                : roomFull
                  ? (isPolashi ? 'রুমটি পূর্ণ।' : 'This room is full.')
                  : (isPolashi
                      ? `${playerCount} জন খেলোয়াড় অপেক্ষা করছেন। যোগ দিন!`
                      : `${playerCount} player${playerCount === 1 ? '' : 's'} already inside. Hop in!`)}
            </p>
          </div>

          {!gameStarted && !roomFull ? (
            <>
              <label className="text-sm text-muted" style={{ display: 'block', marginBottom: 6 }}>
                {isPolashi ? 'আপনার নাম' : 'Your name'}
              </label>
              <input
                className="input"
                value={name}
                maxLength={20}
                placeholder={isPolashi ? 'আপনার নাম লিখুন…' : 'Enter your name…'}
                onChange={e => { setName(e.target.value); setJoinError('') }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                autoFocus
              />
              {joinError && (
                <p className="text-sm text-traitor" style={{ marginTop: 8 }}>
                  {joinError}
                </p>
              )}
              <button
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: 14 }}
                onClick={handleJoin}
                disabled={joining || !connected}
              >
                {joining
                  ? (isPolashi ? 'যোগ দিচ্ছি…' : 'Joining…')
                  : (isPolashi ? 'রুমে যোগ দিন' : 'Join Room')}
              </button>
            </>
          ) : (
            <button
              className="btn btn-outline btn-full"
              onClick={() => navigate('/')}
            >
              {isPolashi ? 'হোমে ফিরুন' : 'Back to home'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── In-room phase router ─────────────────────────────────────────────────
  const phase = roomState.gameState?.phase || PHASES.LOBBY
  const Component = PHASE_COMPONENTS[phase] || Lobby
  return <Component />
}
