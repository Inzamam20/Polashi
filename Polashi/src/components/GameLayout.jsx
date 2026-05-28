import MissionTracker from './MissionTracker'
import RoleReveal from './RoleReveal'
import { useGame } from '../context/GameContext'
import { PHASES } from '../gameRules'

const REJECTION_LIMIT = 5  // matches MAX_CONSECUTIVE_REJECTIONS on the backend

export default function GameLayout({ children, title, subtitle }) {
  const { roomState, gameMode, privateState } = useGame()
  const gs = roomState?.gameState
  const isPolashi = gameMode === 'polashi'

  // Show rejection counter prominently during proposal / voting phases so
  // players can see how close we are to the 5-rejection auto-loss.
  const rejections = gs?.consecutiveRejections ?? 0
  const showRejections =
    gs && (gs.phase === PHASES.TEAM_PROPOSAL || gs.phase === PHASES.VOTING || rejections > 0)
  const rejectionWarn = rejections >= 3
  const rejectionDanger = rejections >= 4

  return (
    <div className="page" style={{ paddingTop: 12, paddingBottom: 24 }}>
      {privateState && <RoleReveal variant="floating" />}
      <div className="container">

        {/* Top bar */}
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <div>
            <span className="text-xs text-muted" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {roomState?.code}
            </span>
            {title && (
              <h2 className="text-lg font-semi" style={{ marginTop: 2 }}>{title}</h2>
            )}
          </div>
          <span className="badge badge-neutral">
            {isPolashi ? '🇧🇩 Polashi' : '⚔️ Avalon'}
          </span>
        </div>

        {/* Mission tracker */}
        {gs && (
          <div className="card" style={{ marginBottom: 12 }}>
            <MissionTracker />

            {showRejections && (
              <div
                className={`rejection-panel${rejectionWarn ? ' warn' : ''}${rejectionDanger ? ' danger' : ''}`}
                style={{ marginTop: 12 }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                  <span className="text-xs font-semi">
                    {isPolashi
                      ? `প্রত্যাখ্যান: ${rejections} / ${REJECTION_LIMIT}`
                      : `Rejections: ${rejections} / ${REJECTION_LIMIT}`}
                  </span>
                  <span className="text-xs text-muted">
                    {rejectionDanger
                      ? (isPolashi ? '⚠️ পরের প্রত্যাখ্যান = বিশ্বাসঘাতকদের জয়' : '⚠️ Next rejection = traitors win')
                      : rejectionWarn
                        ? (isPolashi ? 'সাবধান!' : 'Careful…')
                        : (isPolashi ? '৫ হলে স্বয়ংক্রিয় হার' : '5 = automatic mission loss')}
                  </span>
                </div>
                <div className="rejection-track">
                  {Array.from({ length: REJECTION_LIMIT }).map((_, i) => (
                    <div
                      key={i}
                      className={`rejection-pip${i < rejections ? ' filled' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {subtitle && (
          <p className="text-sm text-muted text-center" style={{ marginBottom: 12 }}>
            {subtitle}
          </p>
        )}

        {children}
      </div>
    </div>
  )
}
