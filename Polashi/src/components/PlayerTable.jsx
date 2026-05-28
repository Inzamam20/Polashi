// ── PlayerTable ────────────────────────────────────────────────────────────
// Shared circular POV layout used by every phase that visualizes the room as
// a board (Night, Voting, Team Proposal). Owns:
//   • Geometry — viewer at the bottom, others fan clockwise around the table
//   • The wooden circle container + glow
//   • The center slot (candle / tally / instruction text — caller's content)
//   • The seat positioning (calls renderSeat for each player)
//
// Phase-specific concerns (eye state, vote color, team marker, click handlers)
// live in renderSeat — passed by the caller as a function.
//
// Change the LOOK of the table (size, border, background, animation, etc.)
// here ONCE → applies to every phase automatically.

import Seat from './Seat'

export default function PlayerTable({
  players,
  viewerId,
  center,           // ReactNode rendered inside the central panel
  renderSeat,       // (player, ctx) => ReactNode — ctx = { isMe, seatDelta, x, y }
}) {
  const N = players.length
  const myIdx = players.findIndex(p => p.id === viewerId)
  if (myIdx < 0 || N === 0) return null

  return (
    <div className="night-table-wrap">
      <div className="night-table">

        {/* Center slot — phase-specific content goes here */}
        <div className="night-table-center">
          {center}
        </div>

        {/* Seats fanned around the circle. seatDelta=0 is the viewer (bottom),
            increments going clockwise on screen (= to viewer's left at the
            real table). */}
        {players.map((player, i) => {
          const seatDelta = (i - myIdx + N) % N
          const clockAngleDeg = 180 + seatDelta * (360 / N)
          const rad = clockAngleDeg * Math.PI / 180
          const x = 50 + 41 * Math.sin(rad)
          const y = 50 - 41 * Math.cos(rad)
          const isMe = player.id === viewerId

          return renderSeat(player, { isMe, seatDelta, x, y, index: i })
        })}
      </div>
    </div>
  )
}

// Re-export Seat for convenience — most callers want both.
export { Seat }
