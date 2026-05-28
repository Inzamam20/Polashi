// Team-proposal phase view of the circular POV table.
// - 👑 marker on the leader
// - 🗡️ team marker on each currently-selected player (live preview)
// - Leader can tap seats to toggle; everyone else watches read-only

import PlayerTable, { Seat } from './PlayerTable'

export default function TeamProposalTable({
  players,
  viewerId,
  leaderId,
  proposedTeam,    // leader's own selection / others' live-previewed selection
  amLeader,
  requiredSize,
  onToggle,
  missionIndex,
  isPolashi,
}) {
  const teamIds = new Set(proposedTeam || [])
  const selectedCount = teamIds.size

  const center = (
    <>
      <div style={{ fontSize: '2.2rem' }}>{amLeader ? '🤝' : '⏳'}</div>
      <p className="night-table-instruction">
        {amLeader
          ? (isPolashi
              ? `অভিযান ${missionIndex + 1} — দল বাছুন`
              : `Quest ${missionIndex + 1} — Pick your team`)
          : (isPolashi
              ? `অভিযান ${missionIndex + 1} — সেনাপতি বাছছেন`
              : `Quest ${missionIndex + 1} — Leader is choosing`)}
      </p>
      <p
        className="night-table-step"
        style={{
          color: selectedCount === requiredSize ? 'var(--loyal)' : undefined,
        }}
      >
        {selectedCount} / {requiredSize} {isPolashi ? 'নির্বাচিত' : 'selected'}
      </p>
    </>
  )

  const renderSeat = (player, { isMe, x, y }) => {
    const isLeader = player.id === leaderId
    const onTeam   = teamIds.has(player.id)

    const className = [
      onTeam ? 'seat-team' : '',
      amLeader ? 'seat-clickable' : '',
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
        onClick={amLeader ? () => onToggle?.(player.id) : undefined}
      >
        {isLeader && <span className="seat-crown">👑</span>}
        {onTeam && (
          <img
            src="/team-marker.png"
            alt={isPolashi ? 'দলে আছে' : 'On the team'}
            className="seat-team-marker"
            draggable="false"
          />
        )}
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
