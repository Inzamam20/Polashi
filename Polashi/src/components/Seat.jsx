// ── Seat ───────────────────────────────────────────────────────────────────
// Shared seat rendering for the circular table. Owns:
//   • The seat container (position via left/top %)
//   • The avatar with initials
//   • The name label below
//   • The "(you)" suffix
//
// Anything else (eye/thumb/crown/vote/team-marker badges, hover effects) is
// passed in as `children` of the avatar — the caller composes whatever overlay
// makes sense for their phase.
//
// Change the LOOK of every seat (size, shape, font, etc.) here ONCE.

export default function Seat({
  player,
  isMe,
  x,
  y,
  className = '',
  isPolashi = false,
  onClick,
  ariaRole,
  children,         // overlays rendered INSIDE .seat-avatar (badges, crown, etc.)
}) {
  const cls = [
    'seat',
    isMe ? 'seat-me' : '',
    player?.disconnected ? 'seat-disconnected' : '',
    className,
  ].filter(Boolean).join(' ')

  const interactive = !!onClick
  const onKeyDown = interactive
    ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }
    : undefined

  return (
    <div
      key={player.id}
      className={cls}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onClick}
      role={ariaRole || (interactive ? 'button' : undefined)}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={onKeyDown}
    >
      <div className="seat-avatar">
        <span className="seat-initials">{player.name.slice(0, 2)}</span>
        {children}
      </div>
      <div className="seat-name">
        {player.name}{isMe ? (isPolashi ? ' (আপনি)' : ' (you)') : ''}
        {player.disconnected && (
          <span style={{ marginLeft: 4, opacity: 0.7 }} title={isPolashi ? 'অফলাইন' : 'offline'}>
            📡
          </span>
        )}
      </div>
    </div>
  )
}
