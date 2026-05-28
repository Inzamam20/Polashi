import { useGame } from '../context/GameContext'
import NightTable from './NightTable'
import RoleCard from './RoleCard'
import RoleReveal from './RoleReveal'
import {
  TRAITORS_NON_OBERON,
  viewerEyesOpenAt,
  viewerThumbUpAt,
} from '../gameRules'

// Steps 0–9. Faithful to the official Avalon moderator script — the "thumb"
// mechanic prevents the role being seen from accidentally seeing the seer.
// e.g. when Merlin and Morgana raise thumbs for Percival, both keep their
// eyes closed, so Morgana never sees who the real Merlin is.
const STEPS = [
  {
    // 0 — Role distribution (like dealing cards face-down)
    instruction: 'Your role for this game.',
    bengali:     'এই খেলায় আপনার ভূমিকা।',
    forRoles:    null,
  },
  {
    // 1 — Everyone close eyes & extend fists
    instruction: 'Everyone, close your eyes and extend your fists.',
    bengali:     'সবাই চোখ বন্ধ করুন এবং হাত মুষ্টি করে সামনে রাখুন।',
    forRoles:    null,
  },
  {
    // 2 — Traitors thumbs up + open eyes (Oberon excluded)
    instruction: 'Minions of Mordred — except Oberon — thumbs up and open your eyes. Recognize your fellow traitors.',
    bengali:     'মীর জাফরের অনুচরগণ — উমিচাঁদ ছাড়া — থাম্বস আপ করুন এবং চোখ খুলুন। সহ-বিশ্বাসঘাতকদের চিনে নিন।',
    forRoles:    TRAITORS_NON_OBERON,
  },
  {
    // 3 — Traitors thumbs down + close eyes
    instruction: 'Minions of Mordred, thumbs down and close your eyes.',
    bengali:     'মীর জাফরের অনুচরগণ, থাম্বস ডাউন এবং চোখ বন্ধ করুন।',
    forRoles:    null,
  },
  {
    // 4 — Minions (except Mordred) thumbs up, eyes stay closed
    instruction: 'Minions of Mordred — except Mordred — thumbs up so Merlin may see you. Keep your eyes closed.',
    bengali:     'মীর জাফরের অনুচরগণ — রায় দুর্লভ ছাড়া — থাম্বস আপ করুন যাতে মীর মদন আপনাদের দেখতে পান। চোখ বন্ধ রাখুন।',
    forRoles:    null,
  },
  {
    // 5 — Merlin opens eyes, sees the raised thumbs
    instruction: 'Merlin, open your eyes — behold the agents of evil.',
    bengali:     'মীর মদন, চোখ খুলুন — অন্ধকারের শক্তিদের দেখুন।',
    forRoles:    ['MERLIN'],
  },
  {
    // 6 — Minions thumbs down, Merlin closes
    instruction: 'Minions of Mordred, thumbs down. Merlin, close your eyes.',
    bengali:     'মীর জাফরের অনুচরগণ, থাম্বস ডাউন। মীর মদন, চোখ বন্ধ করুন।',
    forRoles:    null,
  },
  {
    // 7 — Merlin and Morgana thumbs up, eyes stay closed
    instruction: 'Merlin and Morgana, thumbs up so Percival may see you. Keep your eyes closed.',
    bengali:     'মীর মদন এবং ঘষেটি বেগম, থাম্বস আপ করুন যাতে মোহন লাল আপনাদের দেখতে পান। চোখ বন্ধ রাখুন।',
    forRoles:    null,
  },
  {
    // 8 — Percival opens, sees Merlin + Morgana indistinguishable
    instruction: 'Percival, open your eyes — behold Merlin and Morgana. You cannot tell which is which.',
    bengali:     'মোহন লাল, চোখ খুলুন — মীর মদন এবং ঘষেটি বেগমকে দেখুন। কে কে তা চেনা যাবে না।',
    forRoles:    ['PERCIVAL'],
  },
  {
    // 9 — Merlin & Morgana thumbs down, Percival closes
    instruction: 'Merlin and Morgana, thumbs down. Percival, close your eyes.',
    bengali:     'মীর মদন এবং ঘষেটি বেগম, থাম্বস ডাউন। মোহন লাল, চোখ বন্ধ করুন।',
    forRoles:    null,
  },
]

export default function NightPhase() {
  const { roomState, privateState, nightStep, isHost, advanceNightStep, gameMode, myId } = useGame()
  if (!roomState?.gameState || !privateState) return null

  const step      = Math.min(nightStep, STEPS.length - 1)
  const stepData  = STEPS[step]
  const isPolashi = gameMode === 'polashi'
  const myRole    = privateState.roleId
  const players   = roomState.gameState.players || []

  // Map private knowledge ({id, name} objects) to id arrays for the table
  const knowledgeIds = {
    knownTraitors:  (privateState.knowledge?.knownTraitors  || []).map(p => p.id),
    knownAsMerlin:  (privateState.knowledge?.knownAsMerlin  || []).map(p => p.id),
    fellowTraitors: (privateState.knowledge?.fellowTraitors || []).map(p => p.id),
  }

  // Derive the viewer's state at this step from the shared helpers — the
  // SAME logic the table uses to decide which seats glow.
  const myEyesOpen = viewerEyesOpenAt(step, myRole)
  const myThumbUp  = viewerThumbUpAt(step, myRole)

  const handleNext = () => {
    advanceNightStep(roomState.code, step + 1)
  }

  return (
    <div className="page animate-in" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {/* Floating "🎭 My Role" button — works during night too */}
      <RoleReveal variant="floating" />

      <div className="container">
        {/* Step dots */}
        <div className="text-center" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i <= step ? 'var(--primary)' : 'var(--bg-elevated)',
                border: '1px solid var(--border)',
              }} />
            ))}
          </div>
        </div>

        {/* Step 0: private role distribution — like dealing cards face-down */}
        {step === 0 && (
          <div className="animate-in text-center" style={{ marginTop: 12 }}>
            <h2 className="text-lg font-bold" style={{ marginBottom: 4, color: 'var(--primary)' }}>
              {isPolashi ? 'আপনার ভূমিকা' : 'Your Role'}
            </h2>
            <p className="text-xs text-muted" style={{ marginBottom: 16 }}>
              {isPolashi
                ? 'নীরবে মনে রাখুন। কাউকে দেখাবেন না।'
                : 'Memorize this silently. Do not show your screen.'}
            </p>

            <div style={{ maxWidth: 360, margin: '0 auto' }}>
              <RoleCard showNightInfo />
            </div>

            <p className="pulse" style={{
              marginTop: 18, fontSize: '0.85rem',
              color: 'var(--text-muted)', fontWeight: 600,
            }}>
              {isPolashi ? 'রাত শীঘ্রই শুরু হবে…' : 'Night phase begins shortly…'}
            </p>
          </div>
        )}

        {/* Steps 1-9: the circular table with eye + thumb reveals */}
        {step >= 1 && (
          <>
            <NightTable
              players={players}
              viewerId={privateState.playerId || myId}
              viewerRole={myRole}
              knowledge={knowledgeIds}
              step={step}
              stepInstruction={isPolashi ? stepData.bengali : stepData.instruction}
              isPolashi={isPolashi}
            />
            <p
              className="drift text-center text-xs text-muted"
              style={{ marginTop: 16, fontStyle: 'italic' }}
            >
              {myEyesOpen
                ? (isPolashi
                    ? 'আপনার চোখ খোলা — চারদিকে তাকান।'
                    : 'Your eyes are open — look around the table.')
                : myThumbUp
                  ? (isPolashi
                      ? 'আপনার থাম্ব উঠানো। দ্রষ্টা আপনাকে দেখতে পাবেন।'
                      : 'Your thumb is raised. The seer can see you.')
                  : (isPolashi
                      ? 'আপনার চোখ বন্ধ। বাকিদের জন্য অপেক্ষা করুন…'
                      : 'Your eyes are closed. Listen to the room…')}
            </p>
          </>
        )}

        {/* Host advance button — always visible to host, even on dark steps */}
        <div style={{ marginTop: 18 }}>
          {isHost && step < STEPS.length - 1 && (
            <button className="btn btn-primary btn-full" onClick={handleNext}>
              {isPolashi ? 'পরবর্তী ধাপ →' : 'Next Step →'}
            </button>
          )}
          {isHost && step === STEPS.length - 1 && (
            <button className="btn btn-loyal btn-full btn-lg" onClick={handleNext}>
              {isPolashi ? '▶ খেলা শুরু করুন' : '▶ Begin Game'}
            </button>
          )}
          {!isHost && (
            <p className="text-center text-sm text-muted pulse">
              {isPolashi ? 'হোস্টের জন্য অপেক্ষা…' : 'Waiting for host to advance…'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
