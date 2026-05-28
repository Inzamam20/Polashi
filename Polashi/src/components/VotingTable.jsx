// Voting phase view of the circular POV table.
// - 👑 marker for the leader
// - 🗡️ team marker for players on the proposed team
// - Live "voted / waiting" badge during pending vote
// - Green / red glow + 👍 / 👎 once revealed (only if individualVotes is non-null,
//   controlled by REVEAL_INDIVIDUAL_VOTES in gameConfig.js)
// - Otherwise: aggregate-only "secret vote" badge on revealed seats

import PlayerTable, { Seat } from './PlayerTable'

export default function VotingTable({
  players,
  viewerId,
  leaderId,
  proposedTeam,
  votedPlayerIds,
  individualVotes,   // { playerId: bool } | null — non-null only when allowed
  revealed,
  approveCount,
  rejectCount,
  passed,
  missionIndex,
  isPolashi,
}) {
  const teamIds = new Set(proposedTeam || [])
  const votedSet = new Set(votedPlayerIds || [])

  const center = revealed ? (
    <>
      <div style={{ fontSize: '2.5rem' }}>{passed ? '✅' : '❌'}</div>
      <p
        className="night-table-instruction"
        style={{ color: passed ? 'var(--loyal)' : 'var(--traitor)' }}
      >
        {isPolashi
          ? (passed ? 'দল অনুমোদিত!' : 'দল প্রত্যাখ্যাত!')
          : (passed ? 'Team Approved!' : 'Team Rejected!')}
      </p>
      <p className="night-table-step">
        👍 {approveCount} &nbsp;·&nbsp; 👎 {rejectCount}
      </p>
    </>
  ) : (
    <>
      <div className="pulse" style={{ fontSize: '2.4rem' }}>🗳️</div>
      <p className="night-table-instruction">
        {isPolashi
          ? `অভিযান ${missionIndex + 1} — ভোট চলছে`
          : `Quest ${missionIndex + 1} — Voting`}
      </p>
      <p className="night-table-step">
        {votedSet.size} / {players.length} {isPolashi ? 'ভোট' : 'voted'}
      </p>
    </>
  )

  const renderSeat = (player, { isMe, x, y }) => {
    const isLeader   = player.id === leaderId
    const onTeam     = teamIds.has(player.id)
    const hasVoted   = votedSet.has(player.id)
    const voteResult = individualVotes ? individualVotes[player.id] : null

    const className = [
      onTeam ? 'seat-team' : '',
      !revealed && hasVoted    ? 'seat-voted-pending' : '',
      !revealed && !hasVoted   ? 'seat-not-voted'      : '',
      voteResult === true      ? 'seat-vote-approve'   : '',
      voteResult === false     ? 'seat-vote-reject'    : '',
      // Revealed but individual votes hidden — neutral "voted" indicator
      revealed && voteResult === null ? 'seat-voted-secret' : '',
    ].filter(Boolean).join(' ')

    // Badge: bottom-right slot (reuses .seat-eye position)
    let badge = null
    if (revealed && voteResult === true)  badge = '👍'
    else if (revealed && voteResult === false) badge = '👎'
    else if (revealed && voteResult === null)  badge = '✓'
    else if (!revealed && hasVoted)            badge = '✓'
    else if (!revealed && !hasVoted)           badge = '⋯'

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
        {isLeader && <span className="seat-crown">👑</span>}
        {onTeam && (
          <img
            src="/team-marker.png"
            alt={isPolashi ? 'দলে আছে' : 'On the team'}
            className="seat-team-marker"
            draggable="false"
          />
        )}
        {badge && <span className="seat-eye">{badge}</span>}
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
