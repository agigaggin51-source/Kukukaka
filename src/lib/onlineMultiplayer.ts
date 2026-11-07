import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';
import { PlayerColor } from '../types/chess';

export interface OnlinePlayer {
  id: string;
  name: string;
  color: PlayerColor;
  role: 'host' | 'guest';
  onlineAt: string;
}

export interface OnlineMovePayload {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  fen: string;
  whiteTime: number;
  blackTime: number;
  turn: PlayerColor;
  senderId: string;
  moveIndex: number;
}

export interface OnlineRoomEvents {
  onOpponentJoin: (opponent: OnlinePlayer) => void;
  onOpponentLeave: () => void;
  onMoveReceived: (move: OnlineMovePayload) => void;
  onResignReceived: (data: { resigningColor: PlayerColor; senderName: string }) => void;
  onRematchReceived: () => void;
  onGameSyncReceived: (state: { fen: string; whiteTime: number; blackTime: number; timeControlMinutes: number }) => void;
  onStatusChange: (status: 'connecting' | 'connected' | 'waiting' | 'ready' | 'error' | 'disconnected') => void;
}

export interface OnlineMatchSession {
  roomCode: string;
  myPlayerId: string;
  myPlayerName: string;
  myColor: PlayerColor;
  myRole: 'host' | 'guest';
  timeControlMinutes: number;
  channel: RealtimeChannel;
}

let currentSession: OnlineMatchSession | null = null;

/**
 * Generate clean 6-character room code (e.g. WCH-7K9M)
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WCH-${randomPart}`;
}

/**
 * Clean and format room code string
 */
export function formatRoomCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

/**
 * Host a new online room (Creator plays White by default or chosen color)
 */
export async function createOnlineRoom(
  roomCode: string,
  playerName: string,
  colorPreference: PlayerColor = 'w',
  timeControlMinutes: number = 5,
  events: OnlineRoomEvents
): Promise<OnlineMatchSession> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Koneksi Supabase belum siap');
  }

  // Cleanup existing session if any
  leaveOnlineRoom();

  const formattedCode = formatRoomCode(roomCode);
  const myPlayerId = 'p-' + Math.random().toString(36).substring(2, 9);
  const channelName = `wchess-room:${formattedCode}`;

  events.onStatusChange('connecting');

  const channel = client.channel(channelName, {
    config: {
      broadcast: { self: false },
      presence: { key: myPlayerId },
    },
  });

  const session: OnlineMatchSession = {
    roomCode: formattedCode,
    myPlayerId,
    myPlayerName: playerName,
    myColor: colorPreference,
    myRole: 'host',
    timeControlMinutes,
    channel,
  };

  currentSession = session;

  // Broadcast listeners
  channel
    .on('broadcast', { event: 'player-joined' }, ({ payload }) => {
      if (payload && payload.senderId !== myPlayerId) {
        events.onOpponentJoin({
          id: payload.senderId,
          name: payload.senderName || 'Lawan',
          color: colorPreference === 'w' ? 'b' : 'w',
          role: 'guest',
          onlineAt: new Date().toISOString(),
        });

        // Host sends immediate state sync
        channel.send({
          type: 'broadcast',
          event: 'game-sync',
          payload: {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            whiteTime: timeControlMinutes * 60,
            blackTime: timeControlMinutes * 60,
            timeControlMinutes,
            hostColor: colorPreference,
            hostName: playerName,
          },
        });
      }
    })
    .on('broadcast', { event: 'game-move' }, ({ payload }) => {
      if (payload && payload.senderId !== myPlayerId) {
        events.onMoveReceived(payload as OnlineMovePayload);
      }
    })
    .on('broadcast', { event: 'game-resign' }, ({ payload }) => {
      if (payload) {
        events.onResignReceived(payload);
      }
    })
    .on('broadcast', { event: 'game-rematch' }, () => {
      events.onRematchReceived();
    })
    .on('broadcast', { event: 'game-sync' }, ({ payload }) => {
      if (payload) {
        events.onGameSyncReceived(payload);
      }
    });

  // Presence tracking for connection status
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const players = Object.values(state).flat() as any[];
      const opponent = players.find((p) => p && p.id !== myPlayerId);
      if (opponent) {
        events.onStatusChange('ready');
        events.onOpponentJoin({
          id: opponent.id,
          name: opponent.name || 'Lawan',
          color: colorPreference === 'w' ? 'b' : 'w',
          role: opponent.role || 'guest',
          onlineAt: opponent.onlineAt || new Date().toISOString(),
        });
      } else {
        events.onStatusChange('waiting');
      }
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const hasOpponentLeft = leftPresences.some((p: any) => p && p.id !== myPlayerId);
      if (hasOpponentLeft) {
        events.onOpponentLeave();
      }
    });

  // Subscribe channel
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      events.onStatusChange('waiting');
      channel.track({
        id: myPlayerId,
        name: playerName,
        color: colorPreference,
        role: 'host',
        onlineAt: new Date().toISOString(),
      });
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      events.onStatusChange('error');
    }
  });

  return session;
}

/**
 * Join an existing online room (Guest plays opposite color of Host)
 */
export async function joinOnlineRoom(
  roomCode: string,
  playerName: string,
  events: OnlineRoomEvents
): Promise<OnlineMatchSession> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Koneksi Supabase belum siap');
  }

  leaveOnlineRoom();

  const formattedCode = formatRoomCode(roomCode);
  const myPlayerId = 'p-' + Math.random().toString(36).substring(2, 9);
  const channelName = `wchess-room:${formattedCode}`;

  events.onStatusChange('connecting');

  const channel = client.channel(channelName, {
    config: {
      broadcast: { self: false },
      presence: { key: myPlayerId },
    },
  });

  const session: OnlineMatchSession = {
    roomCode: formattedCode,
    myPlayerId,
    myPlayerName: playerName,
    myColor: 'b', // Default guest color, syncs if host picks black
    myRole: 'guest',
    timeControlMinutes: 5,
    channel,
  };

  currentSession = session;

  channel
    .on('broadcast', { event: 'game-move' }, ({ payload }) => {
      if (payload && payload.senderId !== myPlayerId) {
        events.onMoveReceived(payload as OnlineMovePayload);
      }
    })
    .on('broadcast', { event: 'game-resign' }, ({ payload }) => {
      if (payload) {
        events.onResignReceived(payload);
      }
    })
    .on('broadcast', { event: 'game-rematch' }, () => {
      events.onRematchReceived();
    })
    .on('broadcast', { event: 'game-sync' }, ({ payload }) => {
      if (payload) {
        if (payload.hostColor) {
          session.myColor = payload.hostColor === 'w' ? 'b' : 'w';
        }
        if (payload.timeControlMinutes) {
          session.timeControlMinutes = payload.timeControlMinutes;
        }
        events.onGameSyncReceived(payload);
        events.onStatusChange('ready');
      }
    });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const players = Object.values(state).flat() as any[];
      const host = players.find((p) => p && p.role === 'host' && p.id !== myPlayerId);
      if (host) {
        session.myColor = host.color === 'w' ? 'b' : 'w';
        events.onStatusChange('ready');
        events.onOpponentJoin({
          id: host.id,
          name: host.name || 'Host',
          color: host.color,
          role: 'host',
          onlineAt: host.onlineAt || new Date().toISOString(),
        });
      }
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const hasOpponentLeft = leftPresences.some((p: any) => p && p.id !== myPlayerId);
      if (hasOpponentLeft) {
        events.onOpponentLeave();
      }
    });

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      events.onStatusChange('connected');
      channel.track({
        id: myPlayerId,
        name: playerName,
        color: session.myColor,
        role: 'guest',
        onlineAt: new Date().toISOString(),
      });

      // Announce guest arrival to host
      channel.send({
        type: 'broadcast',
        event: 'player-joined',
        payload: {
          senderId: myPlayerId,
          senderName: playerName,
        },
      });
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      events.onStatusChange('error');
    }
  });

  return session;
}

/**
 * Broadcast move to the opponent
 */
export async function sendOnlineMove(payload: Omit<OnlineMovePayload, 'senderId'>): Promise<boolean> {
  if (!currentSession || !currentSession.channel) return false;

  try {
    const res = await currentSession.channel.send({
      type: 'broadcast',
      event: 'game-move',
      payload: {
        ...payload,
        senderId: currentSession.myPlayerId,
      },
    });
    return res === 'ok';
  } catch (err) {
    console.warn('Failed to broadcast online move:', err);
    return false;
  }
}

/**
 * Broadcast resignation
 */
export async function sendOnlineResign(resigningColor: PlayerColor): Promise<boolean> {
  if (!currentSession || !currentSession.channel) return false;

  try {
    await currentSession.channel.send({
      type: 'broadcast',
      event: 'game-resign',
      payload: {
        resigningColor,
        senderName: currentSession.myPlayerName,
      },
    });
    return true;
  } catch (err) {
    console.warn('Failed to broadcast resignation:', err);
    return false;
  }
}

/**
 * Broadcast rematch request
 */
export async function sendOnlineRematch(): Promise<boolean> {
  if (!currentSession || !currentSession.channel) return false;

  try {
    await currentSession.channel.send({
      type: 'broadcast',
      event: 'game-rematch',
      payload: {
        senderId: currentSession.myPlayerId,
      },
    });
    return true;
  } catch (err) {
    console.warn('Failed to broadcast rematch:', err);
    return false;
  }
}

/**
 * Leave current online match room
 */
export function leaveOnlineRoom() {
  if (currentSession && currentSession.channel) {
    try {
      const client = getSupabase();
      if (client) {
        client.removeChannel(currentSession.channel);
      }
    } catch {
      // Ignore cleanup error
    }
    currentSession = null;
  }
}

/**
 * Get current online session
 */
export function getOnlineSession(): OnlineMatchSession | null {
  return currentSession;
}
