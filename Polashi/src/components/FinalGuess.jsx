import { useState } from 'react'
import { useGame } from '../context/GameContext'
import GameLayout from './GameLayout'
import PlayerTable, { Seat } from './PlayerTable'

export default function FinalGuess() {
  const { roomState, privateState, myId, gameMode, submitFinalGuess } = useGame()
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  if (!roomState?.gameState) return null
  const gs        = roomState.gameState
  const isPolashi = gameMode === 'polashi'
  const players   = gs.players || []

  const amAssassin = privateState?.roleId === 'ASSASSIN'
  const amTraitor  = privateState?.team === 'traitor'

  // Traitors see each other during the final guess (so the assassin can
  // discuss with their team).
  const fellowTraitors = privateState?.fellowTraitorsForFinalGuess || []
  const traitorIds = new Set([
    ...fellowTraitors.map(ft => ft.id),
    ...(amTraitor ? [myId] : []),
  ])

  const merlinName = isPolashi ? 'মীর মদন' : 'Merlin'

  const handleGuess = () => {
    if (!selected || !amAssassin || loading) return
    setLoading(true)
    setError('')
    submitFinalGuess(roomState.code, selected, (res) => {
      setLoading(false)
      if (res?.error) setError(res.error)
    })
  }

  const center = (
    <>
      <div style={{ fontSize: '2.5rem' }}>🗡️</div>
      <p className="night-table-instruction">
        {amAssassin
          ? (isPolashi ? `${merlinName} কে?` : `Who is ${merlinName}?`)
          : (isPolashi ? 'মীর জাফর অনুমান করছেন…' : 'Assassin is guessing…')}
      </p>
      <p className="night-table-step">
        {isPolashi ? 'চূড়ান্ত অনুমান' : 'Final Guess'}
      </p>
    </>
  )

  const renderSeat = (player, { isMe, x, y }) => {
    const isTraitor = traitorIds.has(player.id)
    const isSelected = selected === player.id
    // Assassin can pick anyone they don't know is a traitor (and not themself)
    const isPickable = amAssassin && !isTraitor && player.id !== myId

    const className = [
      isTraitor ? 'seat-reveal seat-traitor' : '',   // red glow on known traitors
      isSelected ? 'seat-vote-reject' : '',          // crosshair-red on chosen target
      isPickable ? 'seat-clickable' : '',
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
        onClick={isPickable ? () => setSelected(isSelected ? null : player.id) : undefined}
      >
        {isSelected && <span className="seat-crown">🎯</span>}
        {isTraitor && (
          <span className="seat-eye" title={isPolashi ? 'বিশ্বাসঘাতক' : 'Traitor'}>
            🔴
          </span>
        )}
      </Seat>
    )
  }

  const selectedName = selected ? players.find(p => p.id === selected)?.name : null

  return (
    <GameLayout title={isPolashi ? 'চূড়ান্ত অনুমান' : 'Final Assassination'}>
      {/* Headline banner — same flavor as before */}
      <div className="card animate-in text-center" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🗡️</div>
        <h2 className="text-xl font-semi" style={{ marginBottom: 8 }}>
          {isPolashi
            ? 'বিশ্বস্তরা ৩টি অভিযান জিতেছে!'
            : 'The loyal side won 3 missions!'}
        </h2>
        <p className="text-muted text-sm">
          {isPolashi
            ? `কিন্তু মীর জাফর এখন একটিমাত্র সুযোগ পাচ্ছেন ${merlinName}কে চিহ্নিত করার।`
            : `But the Assassin gets one final chance to identify ${merlinName}.`}
        </p>
        {amTraitor && (
          <div className="badge badge-traitor" style={{ marginTop: 12, display: 'inline-flex' }}>
            🔴 {isPolashi ? 'আপনি বিশ্বাসঘাতক — শান্তভাবে আলোচনা করুন' : 'You are a traitor — discuss quietly'}
          </div>
        )}
      </div>

      <PlayerTable
        players={players}
        viewerId={myId}
        center={center}
        renderSeat={renderSeat}
      />

      {amAssassin ? (
        <div style={{ marginTop: 16 }}>
          {error && <p className="text-sm text-traitor" style={{ marginBottom: 8 }}>{error}</p>}
          <button
            className="btn btn-traitor btn-full btn-lg"
            onClick={handleGuess}
            disabled={!selected || loading}
          >
            {loading
              ? (isPolashi ? 'জমা দিচ্ছি…' : 'Submitting…')
              : selectedName
                ? (isPolashi
                    ? `🗡️ ${selectedName} হলেন ${merlinName}!`
                    : `🗡️ ${selectedName} is ${merlinName}!`)
                : (isPolashi
                    ? 'একজন খেলোয়াড় বাছুন'
                    : 'Choose a player')}
          </button>
        </div>
      ) : (
        <p className="text-center text-sm text-muted pulse" style={{ marginTop: 16 }}>
          {amTraitor
            ? (isPolashi
                ? 'মীর জাফর অনুমান করার আগে শান্তভাবে দলের সাথে আলোচনা করুন।'
                : 'Discuss quietly with your team before the Assassin guesses.')
            : (isPolashi
                ? 'শান্ত থাকুন। বিশ্বাসঘাতকরা আলোচনা করছে।'
                : 'Stay calm. The traitors are deliberating.')}
        </p>
      )}
    </GameLayout>
  )
}
