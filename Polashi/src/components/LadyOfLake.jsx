import { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import GameLayout from './GameLayout'
import PlayerTable, { Seat } from './PlayerTable'

export default function LadyOfLake() {
  const { roomState, myId, gameMode, ladyResult, investigateWithLady } = useGame()
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(null)

  const gs         = roomState?.gameState
  const isPolashi  = gameMode === 'polashi'
  const holderId   = gs?.ladyOfLakeHolder
  const amHolder   = holderId === myId
  const holderName = gs?.players.find(p => p.id === holderId)?.name
  const usedByIds  = gs?.ladyOfLakeUsedBy || []

  // Latch the holder's investigation result into local state so it persists for
  // the rest of this phase. This is a deliberate "copy an incoming event into
  // state" sync — flagged by set-state-in-effect but correct and intended.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ladyResult && amHolder && !revealed) setRevealed(ladyResult)
  }, [ladyResult, amHolder, revealed])

  if (!gs) return null

  const handleUse = () => {
    if (!selected || loading) return
    setLoading(true)
    setError('')
    investigateWithLady(roomState.code, selected, (res) => {
      setLoading(false)
      if (res?.error) setError(res.error)
    })
  }

  // ── Investigation result ─────────────────────────────────────────────────
  if (revealed) {
    const targetName = gs.players.find(p => p.id === revealed.targetId)?.name
    return (
      <GameLayout title={isPolashi ? 'লেডি অব দ্য লেক' : 'Lady of the Lake'}>
        <div className="card animate-in text-center" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🌊</div>
          <h2 className="text-xl font-semi" style={{ marginBottom: 12 }}>
            {isPolashi ? 'হ্রদ একটি গোপন প্রকাশ করছে…' : 'The lake reveals a secret…'}
          </h2>
          <div className="card-elevated" style={{ padding: 16, borderRadius: 8 }}>
            <p className="text-muted text-sm">{isPolashi ? 'আপনি তদন্ত করেছেন:' : 'You investigated:'}</p>
            <p className="font-bold text-lg" style={{ marginTop: 4 }}>{targetName}</p>
            <p className="text-muted text-sm" style={{ marginTop: 8 }}>{isPolashi ? 'তাঁর পক্ষ:' : 'Their alignment is:'}</p>
            <p className={`text-2xl font-bold mt-2 text-${revealed.targetTeam}`} style={{ marginTop: 6 }}>
              {revealed.targetTeam === 'loyal'
                ? (isPolashi ? '🟢 অনুগত' : '🟢 Loyal')
                : (isPolashi ? '🔴 বিশ্বাসঘাতক' : '🔴 Traitor')}
            </p>
          </div>
          <p className="text-xs text-muted" style={{ marginTop: 16 }}>
            {isPolashi
              ? `আপনি সত্য বা মিথ্যা বলতে পারেন। টোকেন এখন ${targetName}-এর কাছে যাবে।`
              : `You may lie or tell the truth about this. The token passes to ${targetName}.`}
          </p>
        </div>
        <p className="text-center text-sm text-muted pulse">
          {isPolashi ? 'পরবর্তী অভিযানের দিকে…' : 'Continuing to next mission…'}
        </p>
      </GameLayout>
    )
  }

  // ── Picking phase ────────────────────────────────────────────────────────
  // Targets the holder cannot pick: themselves + anyone who has already held
  // the token (game rule prevents re-investigating a chain).
  const disabledIds = new Set([myId, ...usedByIds])

  const center = (
    <>
      <div className="pulse" style={{ fontSize: '2.6rem' }}>🌊</div>
      <p className="night-table-instruction">
        {amHolder
          ? (isPolashi ? 'একজনকে বাছুন' : 'Choose a player')
          : (isPolashi ? `${holderName} তদন্ত করছেন…` : `${holderName} is investigating…`)}
      </p>
      <p className="night-table-step">
        {isPolashi ? 'লেডি অব দ্য লেক' : 'Lady of the Lake'}
      </p>
    </>
  )

  const renderSeat = (player, { isMe, x, y }) => {
    const isHolder = player.id === holderId
    const isDisabled = disabledIds.has(player.id)
    const isSelected = selected === player.id
    const clickable = amHolder && !isDisabled

    const className = [
      isHolder ? 'seat-team' : '',      // gold halo on the token holder
      isSelected ? 'seat-vote-approve' : '',  // green glow on the selected target
      clickable ? 'seat-clickable' : '',
      isDisabled && !isHolder ? 'seat-not-voted' : '',  // dim already-investigated
    ].filter(Boolean).join(' ')

    return (
      <Seat
        key={player.id}
        player={player}
        isMe={isMe}
        x={x}
        y={y}
        isPolashi={isPolashi}
        className={className}
        onClick={clickable ? () => setSelected(isSelected ? null : player.id) : undefined}
      >
        {isHolder && <span className="seat-crown">🌊</span>}
        {usedByIds.includes(player.id) && !isHolder && (
          <span className="seat-eye" title={isPolashi ? 'আগেই তদন্ত হয়েছে' : 'Already investigated'}>
            ✓
          </span>
        )}
      </Seat>
    )
  }

  return (
    <GameLayout
      title={isPolashi ? 'লেডি অব দ্য লেক' : 'Lady of the Lake'}
      subtitle={
        amHolder
          ? (isPolashi
              ? 'আপনার কাছে টোকেন। একজনের পক্ষ গোপনে জানুন।'
              : 'You hold the token. Choose a player to secretly learn their alignment.')
          : (isPolashi
              ? `${holderName} এর কাছে টোকেন।`
              : `${holderName} holds the Lady of the Lake token.`)
      }
    >
      <PlayerTable
        players={gs.players}
        viewerId={myId}
        center={center}
        renderSeat={renderSeat}
      />

      {amHolder && (
        <div style={{ marginTop: 16 }}>
          {error && (
            <p className="text-sm text-traitor" style={{ marginBottom: 8 }}>{error}</p>
          )}
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleUse}
            disabled={!selected || loading}
          >
            {loading
              ? (isPolashi ? 'প্রকাশ করছে…' : 'Revealing…')
              : (isPolashi ? '🌊 তদন্ত করুন' : '🌊 Investigate')}
          </button>
        </div>
      )}
    </GameLayout>
  )
}
