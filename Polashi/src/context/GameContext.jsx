import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import socket from '../socket/socket';
import { PHASES } from '../gameRules';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [connected, setConnected]       = useState(false);
  const [roomState, setRoomState]       = useState(null);
  const [privateState, setPrivateState] = useState(null);
  const [nightStep, setNightStep]       = useState(0);
  const [ladyResult, setLadyResult]     = useState(null); // { targetId, targetTeam }
  const [socketError, setSocketError]   = useState(null);
  // Live team selection broadcast by the leader during TEAM_PROPOSAL (before
  // they confirm). Resets to [] whenever a new proposal starts.
  const [previewedTeam, setPreviewedTeam] = useState([]);
  // Transient room notifications (toasts) — connect/disconnect, AFK
  // countdown, AFK auto-actions. Each: { id, kind, message, expiresAt }
  const [notifications, setNotifications] = useState([]);
  // Dedupe key → expiry-timestamp. Same kind+message arriving within 2s of
  // the previous one is silently dropped. Defends against duplicate backend
  // emits (StrictMode useEffect re-runs in dev, network retries, etc).
  const recentNotifKeys = useRef(new Map());

  useEffect(() => {
    socket.connect();

    socket.on('connect',    () => { setConnected(true);  setSocketError(null); });
    socket.on('disconnect', () =>   setConnected(false));
    socket.on('connect_error', (err) => setSocketError(err.message));

    socket.on('room:state',    (state) => {
      setRoomState(state);
      // Reset night step when a new game starts
      if (state.gameState?.phase === PHASES.NIGHT) setNightStep(0);
      // Clear stale team preview whenever a proposal vanishes (new leader or
      // voting starts — currentProposal is non-null during voting too, so we
      // only clear when it's been reset to null in TEAM_PROPOSAL).
      if (state.gameState?.phase === PHASES.TEAM_PROPOSAL && !state.gameState?.currentProposal) {
        setPreviewedTeam([]);
      }
    });
    socket.on('player:private',     (priv)   => setPrivateState(priv));
    socket.on('night:step',         ({ step }) => setNightStep(step));
    socket.on('lady_of_lake:result', (result) => setLadyResult(result));
    socket.on('team:preview',       ({ proposedTeam }) => setPreviewedTeam(proposedTeam || []));

    // ── Room notifications (toasts) ───────────────────────────────────────
    const DEDUPE_WINDOW_MS = 2000;
    const pushNotification = (kind, message, ttlMs = 4500) => {
      const now = Date.now();
      const key = `${kind}:${message}`;
      // Drop if same notification was shown within DEDUPE_WINDOW_MS
      const lastSeen = recentNotifKeys.current.get(key);
      if (lastSeen && now - lastSeen < DEDUPE_WINDOW_MS) return;
      recentNotifKeys.current.set(key, now);
      // Cheap cleanup of stale dedupe entries
      for (const [k, ts] of recentNotifKeys.current) {
        if (now - ts > DEDUPE_WINDOW_MS) recentNotifKeys.current.delete(k);
      }

      const id = `${now}_${Math.random().toString(36).slice(2)}`;
      const expiresAt = now + ttlMs;
      setNotifications(prev => [...prev, { id, kind, message, expiresAt }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, ttlMs);
    };

    socket.on('player:joined',       ({ playerName }) =>
      pushNotification('info', `🚪 ${playerName} joined the room`));
    socket.on('player:left',         ({ playerName }) =>
      pushNotification('info', `👋 ${playerName} left the room`));
    socket.on('player:disconnected', ({ playerName }) =>
      pushNotification('warn', `📡 ${playerName} went offline`));
    socket.on('player:reconnected',  ({ playerName }) =>
      pushNotification('good', `✅ ${playerName} reconnected`));
    socket.on('afk:timer_started',   ({ blockedNames }) =>
      pushNotification('warn',
        `⏱️ Waiting for ${blockedNames.join(', ')} — auto-action in 60s`,
        7000));
    socket.on('afk:auto_action',     ({ playerName, action }) =>
      pushNotification('warn', `🤖 ${playerName} ${action} (auto)`, 5500));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('room:state');
      socket.off('player:private');
      socket.off('night:step');
      socket.off('lady_of_lake:result');
      socket.off('team:preview');
      socket.off('player:joined');
      socket.off('player:left');
      socket.off('player:disconnected');
      socket.off('player:reconnected');
      socket.off('afk:timer_started');
      socket.off('afk:auto_action');
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const createRoom = useCallback((playerName, gameMode, cb) => {
    socket.emit('room:create', { playerName, gameMode }, cb);
  }, []);

  const joinRoom = useCallback((code, playerName, cb) => {
    socket.emit('room:join', { code, playerName }, cb);
  }, []);

  const updateSettings = useCallback((code, settings, cb) => {
    socket.emit('room:update_settings', { code, settings }, cb);
  }, []);

  const getRoomState = useCallback((code, cb) => {
    socket.emit('room:get_state', { code }, cb);
  }, []);

  const startGame = useCallback((code, cb) => {
    socket.emit('game:start', { code }, cb);
  }, []);

  // Night phase has steps 0..9 (10 total). Steps 1-9 are emitted via
  // game:night_step (UI relay only). Going past the last step (10) transitions
  // the server phase out of NIGHT.
  const NIGHT_STEP_COUNT = 10
  const advanceNightStep = useCallback((code, step) => {
    if (step < NIGHT_STEP_COUNT) {
      socket.emit('game:night_step', { code, step });
    } else {
      socket.emit('game:advance_night', { code });
    }
  }, []);

  const proposeTeam = useCallback((code, proposedTeam, cb) => {
    socket.emit('game:propose_team', { code, proposedTeam }, cb);
  }, []);

  // Live preview: leader broadcasts in-progress team selection to all players.
  // No game-state change — just a UI relay so others see the markers live.
  const previewTeamSelection = useCallback((code, proposedTeam) => {
    socket.emit('game:team_preview', { code, proposedTeam });
  }, []);

  const submitVote = useCallback((code, approve, cb) => {
    socket.emit('game:vote', { code, approve }, cb);
  }, []);

  const submitMissionCard = useCallback((code, card, cb) => {
    socket.emit('game:mission_card', { code, card }, cb);
  }, []);

  const advanceFromMissionResult = useCallback((code, cb) => {
    socket.emit('game:advance_mission_result', { code }, cb);
  }, []);

  const submitFinalGuess = useCallback((code, guessedPlayerId, cb) => {
    socket.emit('game:final_guess', { code, guessedPlayerId }, cb);
  }, []);

  const useLadyOfLake = useCallback((code, targetId, cb) => {
    socket.emit('game:lady_of_lake', { code, targetId }, cb);
  }, []);

  const myId = socket.id;
  const isHost = roomState?.hostId === myId;
  const gameMode = roomState?.gameMode || 'avalon';

  return (
    <GameContext.Provider value={{
      // State
      connected,
      socketError,
      roomState,
      privateState,
      nightStep,
      ladyResult,
      previewedTeam,
      notifications,
      // Derived
      myId,
      isHost,
      gameMode,
      // Actions
      createRoom,
      joinRoom,
      updateSettings,
      getRoomState,
      startGame,
      advanceNightStep,
      proposeTeam,
      previewTeamSelection,
      submitVote,
      submitMissionCard,
      advanceFromMissionResult,
      submitFinalGuess,
      useLadyOfLake,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
