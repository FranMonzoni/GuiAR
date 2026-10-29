import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { groupService } from '../services/groupService';

const GroupContext = createContext(null);

export function GroupProvider({ children }) {
  const { token, user, getFreshToken } = useAuth();

  const [group, setGroup]           = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState(null);

  // userId -> { displayName, latitude, longitude, deviceId, battery, signal, timestamp }
  const [memberLocations, setMemberLocations] = useState({});

  const wsRef = useRef(null);
  const [wsStatus, setWsStatus] = useState('disconnected');

  // ── Cargar grupo ─────────────────────────────────────────────────────────────
  const fetchGroup = useCallback(async () => {
    if (!token) return;
    setGroupLoading(true);
    setGroupError(null);
    try {
      const data = await groupService.getMyGroup(token);
      setGroup(data.group);
    } catch (err) {
      if (err.message.includes('ningún grupo')) {
        setGroup(null);
      } else {
        setGroupError(err.message);
      }
    } finally {
      setGroupLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) fetchGroup();
  }, [user, fetchGroup]);

  // ── Crear grupo ───────────────────────────────────────────────────────────────
  const createGroup = useCallback(async (name) => {
    const t = await getFreshToken();
    const data = await groupService.createGroup(t, name);
    setGroup(data.group);
    return data.group;
  }, [getFreshToken]);

  // ── Unirse a grupo ────────────────────────────────────────────────────────────
  const joinGroup = useCallback(async (joinKey) => {
    const t = await getFreshToken();
    const data = await groupService.joinGroup(t, joinKey);
    setGroup(data.group);
    return data.group;
  }, [getFreshToken]);

  // ── WebSocket ─────────────────────────────────────────────────────────────────
  const connectWs = useCallback(async () => {
    if (!group) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const freshToken = await getFreshToken();
    const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    const url = `${WS_BASE}/ws?token=${freshToken}`;

    setWsStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen  = () => setWsStatus('connected');
    ws.onerror = () => setWsStatus('error');
    ws.onclose = () => setWsStatus('disconnected');

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'location_update') {
          setMemberLocations((prev) => ({
            ...prev,
            [msg.userId]: {
              displayName: msg.displayName,
              latitude:    msg.latitude,
              longitude:   msg.longitude,
              deviceId:    msg.deviceId,
              battery:     msg.battery,
              signal:      msg.signal,
              timestamp:   msg.timestamp
            }
          }));
        }
      } catch { /* ignorar */ }
    };
  }, [group, getFreshToken]);

  const disconnectWs = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setWsStatus('disconnected');
  }, []);

  useEffect(() => {
    if (group && token) connectWs();
    return () => disconnectWs();
  }, [group, token]); // eslint-disable-line

  return (
    <GroupContext.Provider value={{
      group, groupLoading, groupError,
      memberLocations,
      wsStatus,
      fetchGroup, createGroup, joinGroup,
      connectWs, disconnectWs
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup debe usarse dentro de <GroupProvider>');
  return ctx;
}
