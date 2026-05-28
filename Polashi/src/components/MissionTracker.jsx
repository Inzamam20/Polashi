import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext'
import { MISSION_SIZES, DOUBLE_FAIL_MIN_PLAYERS, DOUBLE_FAIL_MISSION_INDEX } from '../gameRules'
import { MISSION_TERMS } from '../data/characters'

export default function MissionTracker() {
  const { roomState, gameMode } = useGame()
  const [openIdx, setOpenIdx] = useState(null)

  // Close on ESC
  useEffect(() => {
    if (openIdx === null) return
    const onKey = (e) => { if (e.key === 'Escape') setOpenIdx(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIdx])

  const gs = roomState?.gameState
  if (!gs) return null

  const { missions = [], currentMissionIndex, loyalWins, traitorWins, playerCount } = gs
  const sizes = MISSION_SIZES[playerCount] || []
  const isPolashi = gameMode === 'polashi'
  const terms = MISSION_TERMS[gameMode]

  const openMission = openIdx !== null ? missions.find(m => m.missionIndex === openIdx) : null
  const openSize = openIdx !== null ? sizes[openIdx] : null
  const openNeedsTwoFails =
    openIdx === DOUBLE_FAIL_MISSION_INDEX && playerCount >= DOUBLE_FAIL_MIN_PLAYERS

  return (
    <div>
      <div className="flex items-center justify-between mb-2" style={{ marginBottom: 8 }}>
        <span className="text-xs text-muted">{isPolashi ? 'অভিযান' : 'Missions'}</span>
        <span className="text-xs">
          <span className="text-loyal font-semi">{loyalWins}</span>
          <span className="text-muted"> – </span>
          <span className="text-traitor font-semi">{traitorWins}</span>
        </span>
      </div>

      <div className="mission-track">
        {[0,1,2,3,4].map(i => {
          const result = missions.find(m => m.missionIndex === i)
          let cls = 'mission-dot'
          let label = sizes[i] ? `${sizes[i]}p` : ''

          if (result) {
            cls += result.loyalWon ? ' loyal' : ' traitor'
            cls += ' clickable'
            label = result.loyalWon ? '✓' : '✗'
          } else if (i === currentMissionIndex) {
            cls += ' current'
          }

          const title = result
            ? `${terms.mission} ${i + 1} — ${isPolashi ? 'বিস্তারিত দেখুন' : 'tap for details'}`
            : `${terms.mission} ${i + 1}: ${sizes[i]} ${isPolashi ? 'খেলোয়াড়' : 'players'}`

          return (
            <div
              key={i}
              className={cls}
              title={title}
              onClick={result ? () => setOpenIdx(i) : undefined}
              role={result ? 'button' : undefined}
              tabIndex={result ? 0 : undefined}
              onKeyDown={result ? (e) => { if (e.key === 'Enter' || e.key === ' ') setOpenIdx(i) } : undefined}
            >
              {label}
            </div>
          )
        })}
      </div>

      {playerCount >= DOUBLE_FAIL_MIN_PLAYERS && (
        <p className="text-xs text-muted mt-2" style={{ marginTop: 6 }}>
          {isPolashi
            ? `* অভিযান ${DOUBLE_FAIL_MISSION_INDEX + 1} এ ${DOUBLE_FAIL_MIN_PLAYERS}+ খেলোয়াড়ের জন্য ২টি ব্যর্থতা কার্ড দরকার`
            : `* Mission ${DOUBLE_FAIL_MISSION_INDEX + 1} needs 2 Fail cards to sabotage`}
        </p>
      )}

      {/* Chapter detail modal */}
      {openMission && (
        <div className="modal-backdrop" onClick={() => setOpenIdx(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-content card"
            style={{
              borderColor: openMission.loyalWon ? 'var(--loyal)' : 'var(--traitor)',
              borderWidth: 2,
            }}
          >
            <button
              onClick={() => setOpenIdx(null)}
              aria-label="Close"
              style={{
                position: 'absolute', top: 8, right: 8,
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text)', cursor: 'pointer', fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>

            {/* Header */}
            <p className="text-xs text-muted" style={{ letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
              {terms.mission} {openMission.missionIndex + 1}
            </p>
            <h2 className="font-bold" style={{ fontSize: '1.4rem', color: openMission.loyalWon ? 'var(--loyal)' : 'var(--traitor)' }}>
              {openMission.autoRejected
                ? (isPolashi ? 'স্বয়ংক্রিয় হার' : 'Auto-failed')
                : openMission.loyalWon
                  ? (isPolashi ? 'অভিযান সফল' : 'Mission succeeded')
                  : (isPolashi ? 'অভিযান বিফল' : 'Mission sabotaged')}
            </h2>
            <p className="text-xs text-muted" style={{ marginTop: 4 }}>
              {openSize} {isPolashi ? 'জনের দল' : 'player team'}
              {openNeedsTwoFails && (isPolashi
                ? ' · ২টি ব্যর্থতা দরকার'
                : ' · needs 2 fails to sabotage')}
            </p>

            <div className="divider" style={{ margin: '14px 0', height: 1, background: 'var(--border)' }} />

            {openMission.autoRejected ? (
              <>
                <p className="text-sm text-muted" style={{ marginBottom: 6 }}>
                  {isPolashi
                    ? 'পরপর ৫টি দল প্রস্তাব প্রত্যাখ্যাত হয়েছে।'
                    : '5 team proposals were rejected in a row.'}
                </p>
                <p className="text-sm">
                  {isPolashi ? 'শেষ সেনাপতি: ' : 'Last leader: '}
                  <span className="font-semi">{openMission.leaderName || '—'}</span>
                </p>
                <p className="text-sm" style={{ marginTop: 4 }}>
                  {isPolashi ? 'প্রস্তাবিত দল: ' : 'Proposed team: '}
                  <span className="font-semi">
                    {openMission.teamNames?.join(', ') || '—'}
                  </span>
                </p>
              </>
            ) : (
              <>
                <p className="text-sm">
                  {isPolashi ? 'সেনাপতি: ' : 'Leader: '}
                  <span className="font-semi">{openMission.leaderName || '—'}</span>
                </p>
                <p className="text-sm" style={{ marginTop: 6 }}>
                  {isPolashi ? 'দল: ' : 'Team: '}
                  <span className="font-semi">
                    {openMission.teamNames?.join(', ') || '—'}
                  </span>
                </p>
                <p className="text-sm" style={{ marginTop: 6 }}>
                  {isPolashi ? 'ভোট: ' : 'Vote: '}
                  <span className="text-loyal font-semi">👍 {openMission.approveCount}</span>
                  <span className="text-muted"> · </span>
                  <span className="text-traitor font-semi">👎 {openMission.rejectCount}</span>
                </p>
                <div
                  className="card-elevated"
                  style={{ marginTop: 14, padding: 12, textAlign: 'center', borderRadius: 8 }}
                >
                  <p className="text-xs text-muted" style={{ marginBottom: 4 }}>
                    {isPolashi ? 'ফলাফল' : 'Outcome'}
                  </p>
                  <p className="font-bold" style={{
                    fontSize: '1.1rem',
                    color: openMission.loyalWon ? 'var(--loyal)' : 'var(--traitor)',
                  }}>
                    {openMission.loyalWon
                      ? (isPolashi ? `🟢 অনুগত পক্ষ জিতেছে` : `🟢 Loyal side wins`)
                      : (isPolashi ? `🔴 বিশ্বাসঘাতকরা জিতেছে` : `🔴 Traitors win`)}
                  </p>
                  <p className="text-xs text-muted" style={{ marginTop: 4 }}>
                    {openMission.failCount} / {openMission.cardCount} {isPolashi ? 'ব্যর্থতা কার্ড' : 'fail cards'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
