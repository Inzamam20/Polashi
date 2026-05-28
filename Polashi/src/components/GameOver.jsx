import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { getCharacter } from '../data/characters'

const WIN_REASON_TEXT = {
  three_missions:   { en: 'Won 3 missions',            bn: '৩টি অভিযান সফল' },
  five_rejections:  { en: 'Auto-win via 5 rejections', bn: '৫ বার প্রস্তাব প্রত্যাখ্যান' },
  assassination:    { en: 'Merlin was identified!',    bn: 'মীর মদন চিহ্নিত হয়েছেন!' },
  merlin_survived:  { en: 'Merlin survived!',          bn: 'মীর মদন বেঁচে গেছেন!' },
}

export default function GameOver() {
  const navigate                    = useNavigate()
  const { roomState, privateState, myId, gameMode } = useGame()

  if (!roomState?.gameState) return null
  const gs        = roomState.gameState
  const isPolashi = gameMode === 'polashi'

  const winner    = gs.winner        // 'loyal' | 'traitor'
  const winReason = gs.winReason     // 'three_missions' | 'five_rejections' | 'assassination' | 'merlin_survived'
  const roleReveal = gs.roleReveal || []

  const isLoyal   = privateState?.team === 'loyal'
  const iWon      = (winner === 'loyal' && isLoyal) || (winner === 'traitor' && !isLoyal)
  const reasonText = WIN_REASON_TEXT[winReason]

  const winnerName = winner === 'loyal'
    ? (isPolashi ? 'নবাব পক্ষ' : 'Loyal Side')
    : (isPolashi ? 'EIC পক্ষ'  : 'Traitor Side')

  return (
    <div className="page animate-in" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="container">

        {/* Result banner */}
        <div className={`card text-center`} style={{
          marginBottom: 20,
          borderColor: `var(--${winner})`,
          background: `linear-gradient(135deg, var(--bg-surface), var(--${winner}-dim))`,
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>
            {iWon ? '🏆' : '💀'}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: `var(--${winner})`, marginBottom: 4 }}>
            {iWon
              ? (isPolashi ? 'আপনারা জিতেছেন!' : 'You Win!')
              : (isPolashi ? 'আপনারা হেরেছেন!' : 'You Lose!')}
          </h1>
          <p className="font-semi text-lg" style={{ color: `var(--${winner})`, marginBottom: 6 }}>
            {winnerName} {isPolashi ? 'জিতেছে' : 'Wins'}!
          </p>
          <p className="text-sm text-muted">
            {isPolashi ? reasonText?.bn : reasonText?.en}
          </p>
        </div>

        {/* Final guess result (if applicable) */}
        {(winReason === 'assassination' || winReason === 'merlin_survived') && gs.finalGuess && (
          <div className="card text-center" style={{ marginBottom: 12 }}>
            <p className="text-sm text-muted" style={{ marginBottom: 4 }}>Final guess:</p>
            <p className="font-semi">
              The Assassin guessed <strong>
                {roleReveal.find(p => p.id === gs.finalGuess)?.name || '?'}
              </strong> as {isPolashi ? 'মীর মদন' : 'Merlin'}
            </p>
            <p className={`font-bold mt-1 text-${winReason === 'assassination' ? 'traitor' : 'loyal'}`} style={{ marginTop: 6 }}>
              {winReason === 'assassination'
                ? (isPolashi ? '✓ সঠিক! বিশ্বাসঘাতকরা জিতেছে।' : '✓ Correct! Traitors win.')
                : (isPolashi ? '✗ ভুল! বিশ্বস্তরা জিতেছে।'      : '✗ Wrong! Loyal side wins.')}
            </p>
          </div>
        )}

        {/* Role reveal */}
        {roleReveal.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <p className="font-semi" style={{ marginBottom: 12 }}>
              {isPolashi ? 'সবার পরিচয়:' : 'Everyone\'s Roles:'}
            </p>
            <div className="flex-col gap-2">
              {roleReveal.map(p => {
                const char = getCharacter(p.roleId, gameMode)
                if (!char) return null
                return (
                  <div key={p.id} className={`player-chip ${p.team}`}>
                    <div className="player-avatar">{p.name.slice(0,2)}</div>
                    <span style={{ flex: 1 }}>{p.name}</span>
                    <span>{char.icon}</span>
                    <span className="text-sm">{char.name}</span>
                    {p.id === myId && <span className="text-xs text-muted">(you)</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Play again */}
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={() => navigate('/')}
        >
          {isPolashi ? '🔄 নতুন খেলা' : '🔄 Play Again'}
        </button>
      </div>
    </div>
  )
}
