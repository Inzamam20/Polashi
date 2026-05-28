import { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import GameLayout from './GameLayout'
import TeamProposalTable from './TeamProposalTable'
import { MISSION_TERMS } from '../data/characters'
import { MISSION_SIZES } from '../gameRules'

export default function TeamProposal() {
  const {
    roomState,
    myId,
    gameMode,
    proposeTeam,
    previewTeamSelection,
    previewedTeam,
  } = useGame()
  const [selected, setSelected] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const gs       = roomState?.gameState
  const isPolashi = gameMode === 'polashi'
  const required  = gs ? MISSION_SIZES[gs.playerCount]?.[gs.currentMissionIndex] ?? 0 : 0
  const amLeader  = gs?.leaderId === myId
  const leaderName = gs?.players.find(p => p.id === gs.leaderId)?.name
  const terms     = MISSION_TERMS[gameMode]

  // Reset local selection whenever the leader changes (next round) or a new
  // game starts. Also broadcast the (now empty) preview so other players
  // don't see stale markers.
  useEffect(() => {
    setSelected([])
    setError('')
    // Don't broadcast on the very first mount if we're not the leader; only
    // the leader needs to clear other players' previews.
    if (amLeader && roomState?.code) {
      previewTeamSelection(roomState.code, [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gs?.leaderId, gs?.currentMissionIndex])

  if (!gs) return null

  const toggle = (id) => {
    if (!amLeader) return
    const next = selected.includes(id)
      ? selected.filter(x => x !== id)
      : selected.length < required ? [...selected, id] : selected
    setSelected(next)
    setError('')
    // Live broadcast to everyone in the room — they'll see the marker pop
    // onto / off the seat in real time.
    previewTeamSelection(roomState.code, next)
  }

  const handlePropose = () => {
    if (selected.length !== required) {
      return setError(isPolashi
        ? `ঠিক ${required} জন খেলোয়াড় বাছুন।`
        : `Select exactly ${required} players.`)
    }
    setLoading(true)
    proposeTeam(roomState.code, selected, (res) => {
      setLoading(false)
      if (res?.error) setError(res.error)
    })
  }

  // What the table shows:
  //   - Leader: their OWN local selection (instant feedback, no round-trip)
  //   - Everyone else: whatever the leader has broadcast via team:preview
  const tableProposedTeam = amLeader ? selected : previewedTeam

  return (
    <GameLayout
      title={`${terms.mission} ${gs.currentMissionIndex + 1}`}
      subtitle={
        amLeader
          ? (isPolashi
              ? `আপনি সেনাপতি — এই অভিযানের জন্য ${required} জনকে বাছুন।`
              : `You are the ${terms.leader}. Pick ${required} players for this mission.`)
          : (isPolashi
              ? `${leaderName} সেনাপতি — দলের প্রস্তাবের জন্য অপেক্ষা…`
              : `${leaderName} is the ${terms.leader} — waiting for their team proposal…`)
      }
    >
      <TeamProposalTable
        players={gs.players}
        viewerId={myId}
        leaderId={gs.leaderId}
        proposedTeam={tableProposedTeam}
        amLeader={amLeader}
        requiredSize={required}
        onToggle={toggle}
        missionIndex={gs.currentMissionIndex}
        isPolashi={isPolashi}
      />

      {amLeader && (
        <div style={{ marginTop: 16 }}>
          {error && (
            <p className="text-sm text-traitor" style={{ marginBottom: 8 }}>
              {error}
            </p>
          )}
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handlePropose}
            disabled={selected.length !== required || loading}
          >
            {loading
              ? (isPolashi ? 'প্রস্তাব করছেন…' : 'Proposing…')
              : (isPolashi
                  ? `দল চূড়ান্ত করুন (${selected.length}/${required})`
                  : `Confirm Team (${selected.length}/${required})`)}
          </button>
        </div>
      )}

      {!amLeader && (
        <p
          className="text-center text-sm text-muted pulse"
          style={{ marginTop: 16 }}
        >
          {isPolashi
            ? 'সেনাপতি দল বাছছেন — সিল চিহ্ন দেখুন।'
            : 'Leader is choosing — watch the markers appear.'}
        </p>
      )}
    </GameLayout>
  )
}
