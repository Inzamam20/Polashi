// Night-phase view of the circular POV table.
//
// Two independent visual states per seat:
//   • Eye state   — 😴 closed / 👁 open. Whether that player is "looking around".
//   • Thumb state — 👍 raised / nothing. Whether they're signalling to a seer.
//
// No info leak: OTHER players' eye/thumb state is only visible to the viewer
// when the viewer's own eyes are open. The viewer always sees their own state.

import PlayerTable, { Seat } from './PlayerTable'
import { viewerEyesOpenAt, viewerThumbUpAt } from '../gameRules'

export default function NightTable({
  players,
  viewerId,
  viewerRole,
  knowledge,
  step,
  stepInstruction,
  isPolashi,
}) {
  const viewerEyesOpen = viewerEyesOpenAt(step, viewerRole)
  const viewerThumbUp  = viewerThumbUpAt(step, viewerRole)

  // Build the visible state sets from the viewer's POV.
  // Viewer always sees their own state. Others only when viewer's eyes open.
  const openEyeIds = new Set()
  const thumbUpIds = new Set()
  if (viewerEyesOpen) openEyeIds.add(viewerId)
  if (viewerThumbUp)  thumbUpIds.add(viewerId)

  if (viewerEyesOpen) {
    if (step === 2) {
      // Traitor identification — fellow traitors: eyes open AND thumbs up
      ;(knowledge?.fellowTraitors || []).forEach(id => {
        openEyeIds.add(id)
        thumbUpIds.add(id)
      })
    } else if (step === 5) {
      // Merlin sees Minions (except Mordred) — thumbs raised, eyes closed
      ;(knowledge?.knownTraitors || []).forEach(id => thumbUpIds.add(id))
    } else if (step === 8) {
      // Percival sees Merlin + Morgana — thumbs raised, eyes closed
      ;(knowledge?.knownAsMerlin || []).forEach(id => thumbUpIds.add(id))
    }
  }

  // Highlight color for revealed seats:
  // - Percival's view → "candidate" (purple-gold — ambiguous side)
  // - Everyone else's reveal → "traitor" (red, confirmed traitors)
  const highlightTeam = viewerRole === 'PERCIVAL' ? 'candidate' : 'traitor'

  const center = (
    <>
      <div className="flicker" style={{ fontSize: '2.5rem' }}>🕯️</div>
      <p className="night-table-instruction">{stepInstruction}</p>
      <p className="night-table-step">
        {isPolashi ? 'রাত পর্ব' : 'Night Phase'}
      </p>
    </>
  )

  const renderSeat = (player, { isMe, x, y }) => {
    const eyesOpen = openEyeIds.has(player.id)
    const thumbUp  = thumbUpIds.has(player.id)
    const isOtherReveal = !isMe && (eyesOpen || thumbUp)

    const className = [
      eyesOpen ? 'seat-open' : 'seat-closed',
      isOtherReveal ? `seat-reveal seat-${highlightTeam}` : '',
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
      >
        {thumbUp && <span className="seat-thumb">👍</span>}
        <span
          className="seat-eye"
          aria-label={eyesOpen ? 'eyes open' : 'eyes closed'}
        >
          {eyesOpen ? '👁' : '😴'}
        </span>
      </Seat>
    )
  }

  return (
    <PlayerTable
      players={players}
      viewerId={viewerId}
      center={center}
      renderSeat={renderSeat}
    />
  )
}
