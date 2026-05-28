import { useState } from 'react'
import { useGame } from '../context/GameContext'
import GameLayout from './GameLayout'
import VotingTable from './VotingTable'
import { MISSION_TERMS } from '../data/characters'
import { REVEAL_INDIVIDUAL_VOTES } from '../gameConfig'

export default function Voting() {
  const { roomState, privateState, myId, gameMode, submitVote } = useGame()
  const [voted,   setVoted]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  if (!roomState?.gameState) return null
  const gs        = roomState.gameState
  const proposal  = gs.currentProposal
  const terms     = MISSION_TERMS[gameMode]
  const isPolashi = gameMode === 'polashi'

  if (!proposal) return null

  const team         = proposal.proposedTeam || []
  const totalPlayers = gs.playerCount
  const revealed     = proposal.votes !== null && proposal.votes !== undefined
  const myVoteKnown  = privateState?.myVote !== null && privateState?.myVote !== undefined
  const alreadyVoted = voted || myVoteKnown

  const approveCount = revealed ? Object.values(proposal.votes).filter(Boolean).length : 0
  const rejectCount  = revealed ? totalPlayers - approveCount : 0
  const passed       = revealed && approveCount > rejectCount

  const leaderName = gs.players.find(p => p.id === gs.leaderId)?.name

  const handleVote = (approve) => {
    if (alreadyVoted || loading) return
    setLoading(true)
    setError('')
    submitVote(roomState.code, approve, (res) => {
      setLoading(false)
      if (res?.error) return setError(res.error)
      setVoted(true)
    })
  }

  const title = revealed
    ? (isPolashi ? 'ভোটের ফলাফল' : 'Vote Results')
    : (isPolashi
        ? `অভিযান ${gs.currentMissionIndex + 1} এর দলের ভোট`
        : `Vote on ${terms.mission} ${gs.currentMissionIndex + 1} Team`)
  const subtitle = revealed
    ? null
    : (isPolashi
        ? `${leaderName} এই দল প্রস্তাব করেছেন`
        : `${leaderName} proposed this team`)

  return (
    <GameLayout title={title} subtitle={subtitle}>

      {/* Live circular table view of all players + vote state.
          The aggregate (approve/reject counts) is always shown after the
          reveal. Per-player vote colors only appear if REVEAL_INDIVIDUAL_VOTES
          is on — toggle it in src/gameConfig.js. */}
      <VotingTable
        players={gs.players}
        viewerId={myId}
        leaderId={gs.leaderId}
        proposedTeam={team}
        votedPlayerIds={proposal.votedPlayerIds}
        individualVotes={revealed && REVEAL_INDIVIDUAL_VOTES ? proposal.votes : null}
        revealed={revealed}
        approveCount={approveCount}
        rejectCount={rejectCount}
        passed={passed}
        missionIndex={gs.currentMissionIndex}
        isPolashi={isPolashi}
      />

      {/* Action area below the table */}
      <div style={{ marginTop: 16 }}>
        {!revealed && !alreadyVoted && (
          <>
            {error && <p className="text-sm text-traitor" style={{ marginBottom: 8 }}>{error}</p>}
            <div className="flex gap-3" style={{ gap: 12 }}>
              <button
                className="btn btn-loyal btn-full btn-lg"
                onClick={() => handleVote(true)}
                disabled={loading}
              >
                👍 {isPolashi ? 'সমর্থন' : 'Approve'}
              </button>
              <button
                className="btn btn-traitor btn-full btn-lg"
                onClick={() => handleVote(false)}
                disabled={loading}
              >
                👎 {isPolashi ? 'প্রত্যাখ্যান' : 'Reject'}
              </button>
            </div>
          </>
        )}

        {!revealed && alreadyVoted && (
          <div className="card text-center">
            <p className="text-loyal font-semi">
              ✓ {isPolashi ? 'ভোট জমা — অন্যদের জন্য অপেক্ষা…' : 'Vote submitted — waiting for others…'}
            </p>
          </div>
        )}

        {revealed && !passed && gs.consecutiveRejections >= 5 && (
          <div
            className="card text-center"
            style={{ borderColor: 'var(--traitor)', background: 'var(--traitor-dim)' }}
          >
            <p className="font-bold text-traitor">
              {isPolashi
                ? 'পরপর ৫টি প্রত্যাখ্যান — বিশ্বাসঘাতকরা এই অভিযান জিতেছে!'
                : '5 consecutive rejections — Traitors win this mission!'}
            </p>
          </div>
        )}

        {revealed && (
          <p className="text-center text-sm text-muted pulse" style={{ marginTop: 12 }}>
            {passed
              ? (isPolashi ? 'অভিযানে এগিয়ে যাওয়া হচ্ছে…' : 'Proceeding to the mission…')
              : (isPolashi ? 'পরবর্তী সেনাপতি দল প্রস্তাব করবেন…' : 'Next leader will propose a team…')}
          </p>
        )}
      </div>
    </GameLayout>
  )
}
