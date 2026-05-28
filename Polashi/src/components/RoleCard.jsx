import { getCharacter } from '../data/characters'
import { useGame } from '../context/GameContext'

export default function RoleCard({ showNightInfo = false }) {
  const { privateState, gameMode } = useGame()
  if (!privateState) return null

  const char = getCharacter(privateState.roleId, gameMode)
  if (!char) return null

  const teamClass = `role-card team-${char.team}`

  return (
    <div className={teamClass}>
      <div className="role-icon">{char.icon}</div>
      <div className="role-name">{char.name}</div>
      <div className="role-title">{char.title}</div>

      <div className="divider" />

      <div className="role-desc">
        {showNightInfo ? char.nightDescription : char.description}
      </div>

      <div style={{ marginTop: 12 }}>
        <span className={`badge badge-${char.team}`}>
          {char.team === 'loyal' ? '🟢 Loyal Side' : '🔴 Traitor Side'}
        </span>
      </div>
    </div>
  )
}
