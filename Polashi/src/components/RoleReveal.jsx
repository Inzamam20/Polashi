import { useState, useEffect } from 'react'
import RoleCard from './RoleCard'
import { useGame } from '../context/GameContext'

/**
 * Hidden-by-default role display. Renders a small "View my role" trigger
 * button; tapping it pops up a centered modal showing the full role card.
 * Closes on backdrop click, ESC key, or close button.
 *
 * Variant:
 *   - 'floating' → fixed pill at the top-right (in-game default)
 *   - 'inline'   → block button (use inside dark overlay etc.)
 */
export default function RoleReveal({ variant = 'floating' }) {
  const { privateState, gameMode } = useGame()
  const [open, setOpen] = useState(false)

  // Close on ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!privateState) return null
  const isPolashi = gameMode === 'polashi'
  const label = isPolashi ? '🎭 আমার ভূমিকা' : '🎭 My Role'

  const triggerStyle = variant === 'floating' ? {
    position: 'fixed',
    top: 'max(12px, env(safe-area-inset-top))',
    right: 'max(12px, env(safe-area-inset-right))',
    zIndex: 50,
    padding: '10px 16px',
    minHeight: 40,
    borderRadius: 999,
    background: 'rgba(20, 25, 35, 0.92)',
    border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600,
    cursor: 'pointer', backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  } : {
    display: 'inline-block', marginTop: 8,
    padding: '10px 18px', borderRadius: 999,
    background: 'rgba(40, 50, 70, 0.6)',
    border: '1px solid #444',
    color: '#bbb', fontSize: '0.85rem', fontWeight: 600,
    cursor: 'pointer',
  }

  return (
    <>
      <button style={triggerStyle} onClick={() => setOpen(true)}>
        {label}
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 360 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute', top: -10, right: -10, zIndex: 1,
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
            <RoleCard showNightInfo />
            <p style={{
              textAlign: 'center', marginTop: 12, fontSize: '0.75rem',
              color: '#888',
            }}>
              {isPolashi ? 'বন্ধ করতে যেকোনো জায়গায় ট্যাপ করুন' : 'Tap anywhere to close'}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
