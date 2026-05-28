import { useState } from 'react'
import { useGame } from '../context/GameContext'
import GameLayout from './GameLayout'
import { MISSION_TERMS } from '../data/characters'

export default function Mission() {
  const { roomState, privateState, myId, gameMode, submitMissionCard } = useGame()
  const [submitted,    setSubmitted]    = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [showWarning,  setShowWarning]  = useState(false)

  if (!roomState?.gameState) return null
  const gs         = roomState.gameState
  const mission    = gs.currentMission
  const terms      = MISSION_TERMS[gameMode]
  const isPolashi  = gameMode === 'polashi'

  if (!mission) return null

  const onTeam        = mission.team.includes(myId)
  const alreadyDone   = submitted || privateState?.myMissionCardSubmitted
  const teamMembers   = mission.team.map(id => gs.players.find(p => p.id === id)).filter(Boolean)
  const submittedIds  = mission.submittedPlayerIds || []
  const submitted_    = mission.submittedCount || submittedIds.length
  const teamSize      = mission.team.length

  const playCard = (card) => {
    if (alreadyDone || loading) return
    // Block loyal players from playing betrayal — show a flavor warning
    // instead of even attempting to submit (server would reject anyway).
    if (card === 'fail' && privateState?.team === 'loyal') {
      setShowWarning(true)
      return
    }
    setLoading(true)
    setError('')
    submitMissionCard(roomState.code, card, (res) => {
      setLoading(false)
      if (res?.error) return setError(res.error)
      setSubmitted(true)
    })
  }

  return (
    <GameLayout
      title={`${terms.mission} ${gs.currentMissionIndex + 1} in Progress`}
      subtitle={onTeam ? 'You are on this team — choose your card carefully.' : 'Waiting for the team to submit cards…'}
    >
      {/* Team with per-player card submission status */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <span className="text-sm font-semi">
            {isPolashi ? 'অভিযানের দল' : 'Mission team'}
          </span>
          <span className={`badge badge-${submitted_ === teamSize ? 'loyal' : 'neutral'}`}>
            {submitted_} / {teamSize}
          </span>
        </div>
        <div className="flex-col gap-2">
          {teamMembers.map(p => {
            const hasSubmitted = submittedIds.includes(p.id)
            const isMe = p.id === myId
            return (
              <div
                key={p.id}
                className={`player-chip${hasSubmitted ? ' loyal' : ''}${isMe ? ' is-me' : ''}`}
                style={{ justifyContent: 'space-between' }}
              >
                <div className="flex items-center gap-2" style={{ gap: 8 }}>
                  <div className="player-avatar">{p.name.slice(0, 2)}</div>
                  <span>{p.name}{isMe ? ' (you)' : ''}</span>
                </div>
                <span style={{ fontSize: '0.875rem', color: hasSubmitted ? 'var(--loyal)' : 'var(--text-muted)' }}>
                  {hasSubmitted
                    ? (isPolashi ? '✓ কার্ড জমা' : '✓ Card played')
                    : (isPolashi ? '⏳ অপেক্ষমাণ' : '⏳ Choosing…')}
                </span>
              </div>
            )
          })}
        </div>
        <div className="vote-bar" style={{ marginTop: 12 }}>
          <div className="vote-bar-fill" style={{ width: `${(submitted_ / teamSize) * 100}%` }} />
        </div>
      </div>

      {/* Cards for team members — both buttons shown to everyone.
          No team-revealing text above (anyone glancing at the screen would
          otherwise spot "You are a traitor…"). Loyal players who tap betrayal
          get a flavor warning modal instead of submission. */}
      {onTeam && !alreadyDone && (
        <div className="animate-in">
          {error && <p className="text-sm text-traitor" style={{ marginBottom: 8 }}>{error}</p>}
          <div className="flex gap-3" style={{ gap: 12 }}>
            <button className="btn btn-loyal btn-full btn-lg" onClick={() => playCard('success')}>
              ✅ {terms.success}
            </button>
            <button className="btn btn-traitor btn-full btn-lg" onClick={() => playCard('fail')}>
              💀 {terms.fail}
            </button>
          </div>
        </div>
      )}

      {onTeam && alreadyDone && (
        <div className="card text-center">
          <p className="text-loyal font-semi">✓ Card submitted — waiting for others…</p>
        </div>
      )}

      {!onTeam && (
        <div className="card text-center">
          <p className="text-muted pulse">Waiting for the team to play their cards…</p>
          <p className="text-xs text-muted mt-2" style={{ marginTop: 8 }}>
            Cards are shuffled before being revealed.
          </p>
        </div>
      )}

      {/* Honor warning — shown when a loyal player tries to play betrayal */}
      {showWarning && (
        <div className="modal-backdrop" onClick={() => setShowWarning(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-content card"
            style={{
              textAlign: 'center',
              borderColor: 'var(--loyal)',
              borderWidth: 2,
              padding: 28,
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🛡️</div>
            <h2 className="font-bold" style={{ fontSize: '1.25rem', color: 'var(--loyal)' }}>
              {isPolashi ? 'বিশ্বাসঘাতকতা সম্ভব নয়' : 'Honor stays your hand'}
            </h2>
            <p className="text-sm" style={{ marginTop: 12, color: 'var(--text)', lineHeight: 1.5 }}>
              {isPolashi
                ? 'আপনি অনুগত পক্ষের সদস্য। আপনার হৃদয় বিশ্বাসঘাতকতার কার্ড খেলতে দেবে না।'
                : 'You serve the Loyal side. A faithful heart cannot wield the Betrayal card.'}
            </p>
            <p className="text-xs text-muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
              {isPolashi
                ? `শুধুমাত্র বিশ্বাসঘাতকরা ${terms.fail} খেলতে পারে — আপনাকে অবশ্যই ${terms.success} খেলতে হবে।`
                : `Only traitors may play ${terms.fail} — you must play ${terms.success}.`}
            </p>
            <button
              className="btn btn-loyal btn-full"
              style={{ marginTop: 20 }}
              onClick={() => setShowWarning(false)}
            >
              {isPolashi ? 'বুঝেছি' : 'I understand'}
            </button>
          </div>
        </div>
      )}
    </GameLayout>
  )
}
