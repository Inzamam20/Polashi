import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

// Stable per-tab identity that survives page refresh and brief disconnects.
// The backend uses this to match the same human to the same seat — so a
// refresh or wifi blip restores your role + game state instead of treating
// you as a brand-new player.
//
// sessionStorage (not localStorage) means: same tab refresh = same identity,
// but a new tab is a new identity. Avoids the "two tabs accidentally share
// the same seat" trap that localStorage would create.
function getClientId() {
  let id = null
  try { id = sessionStorage.getItem('polashiClientId') } catch { /* storage blocked (private mode) — ignore */ }
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    try { sessionStorage.setItem('polashiClientId', id) } catch { /* storage blocked (private mode) — ignore */ }
  }
  return id
}

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  // Sent with the initial handshake AND every reconnection attempt
  auth: { clientId: getClientId() },
})

export default socket
