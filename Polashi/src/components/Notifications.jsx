// Stack of transient toasts at the top-center of the viewport. Subscribes to
// `notifications` from GameContext — each entry auto-dismisses after its TTL
// (handled inside the context). This component is just the renderer.
//
// Toast kinds:
//   • 'info'  → neutral (player joined / left)
//   • 'good'  → green   (player reconnected)
//   • 'warn'  → amber   (player went offline, AFK timer, AFK auto-action)

import { useGame } from '../context/GameContext'

const KIND_STYLES = {
  info: { borderColor: 'var(--border)',  bg: 'rgba(20, 25, 35, 0.92)' },
  good: { borderColor: 'var(--loyal)',   bg: 'rgba(20, 40, 25, 0.94)' },
  warn: { borderColor: '#d6b56b',        bg: 'rgba(50, 35, 15, 0.94)' },
}

export default function Notifications() {
  const { notifications } = useGame()
  if (!notifications || notifications.length === 0) return null

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'max(64px, calc(env(safe-area-inset-top) + 64px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        pointerEvents: 'none',  // toasts shouldn't block gameplay clicks
        width: '100%',
        maxWidth: 380,
        padding: '0 16px',
      }}
    >
      {notifications.map(n => {
        const style = KIND_STYLES[n.kind] || KIND_STYLES.info
        return (
          <div
            key={n.id}
            className="toast-in"
            style={{
              background: style.bg,
              border: `1px solid ${style.borderColor}`,
              color: 'var(--text)',
              padding: '10px 16px',
              borderRadius: 999,
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(6px)',
              maxWidth: '100%',
              textAlign: 'center',
            }}
          >
            {n.message}
          </div>
        )
      })}
    </div>
  )
}
