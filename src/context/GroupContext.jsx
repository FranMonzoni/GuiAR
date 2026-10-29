import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { groupApi, getToken, WS_URL } from '../services/api';

const GroupContext = createContext(null);

// Códigos de cierre del backend que indican que ya no hay grupo (no reconectar)
const NO_GROUP_CODES = new Set([4003, 4004, 4005]);

/**
 * Estado del grupo del usuario + conexión en tiempo real.
 *  - group:      { id, name, inviteCode, encryptionKey, ownerId, members[] } | null
 *  - locations:  { [userId]: última ubicación }
 *  - online:     Set de userIds conectados ahora
 *  - wsStatus:   'idle' | 'connecting' | 'connected' | 'reconnecting'
 */
export function GroupProvider({ children }) {
  const { user, refreshUser } = useAuth();

  const [group, setGroup] = useState(null);
  const [groupLoadingState, setGroupLoading] = useState(true);
  const groupLoading = user ? groupLoadingState : false;
  const [groupError, setGroupError] = useState(null);
  const [locations, setLocations] = useState({});
  const [online, setOnline] = useState(new Set());
  const [wsStatus, setWsStatus] = useState('idle');
  const [notice, setNotice] = useState(null); // aviso cuando te sacan del grupo, etc.

  const groupId = group?.id ?? null;

  // ── Carga del grupo ─────────────────────────────────────────────────────────
  const fetchGroup = useCallback(async () => {
    setGroupError(null);
    try {
      const data = await groupApi.getMine();
      setGroup(data.group);
      return data.group;
    } catch (err) {
      if (err.code === 'NO_GROUP') setGroup(null);
      else setGroupError(err.message);
      return null;
    } finally {
      setGroupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchGroup();
  }, [user?.id, user?.groupId, fetchGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ubicaciones iniciales por REST (por si el WebSocket tarda o falla)
  useEffect(() => {
    if (!groupId) return;
    groupApi.locations().then((data) => {
      setLocations((prev) => ({ ...Object.fromEntries(data.locations.map((l) => [l.userId, l])), ...prev }));
      setOnline(new Set(data.locations.filter((l) => l.online).map((l) => l.userId)));
    }).catch(() => {});
  }, [groupId]);

  const clearGroup = useCallback(() => {
    setGroup(null);
    setLocations({});
    setOnline(new Set());
  }, []);

  const leftGroup = useCallback((message) => {
    clearGroup();
    setNotice(message || null);
    refreshUser();
  }, [refreshUser, clearGroup]);

  // ── WebSocket con reconexión automática ─────────────────────────────────────
  const handlersRef = useRef({});
  useLayoutEffect(() => {
    handlersRef.current = {
      snapshot(msg) {
        setLocations(Object.fromEntries(msg.locations.map((l) => [l.userId, l])));
        setOnline(new Set(msg.group.members.filter((m) => m.online).map((m) => m.id)));
      },
      location_update({ location }) {
        setLocations((prev) => ({ ...prev, [location.userId]: location }));
      },
      presence({ userId, online: isOnline }) {
        setOnline((prev) => {
          const next = new Set(prev);
          if (isOnline) next.add(userId);
          else next.delete(userId);
          return next;
        });
      },
      member_joined: () => fetchGroup(),
      member_left({ userId }) {
        setLocations(({ [userId]: _removed, ...rest }) => rest);
        fetchGroup();
      },
      group_renamed: ({ name }) => setGroup((g) => (g ? { ...g, name } : g)),
      group_left: ({ reason }) => leftGroup(reason),
      group_deleted: ({ reason }) => leftGroup(reason)
    };
  });

  useEffect(() => {
    if (!groupId) return undefined;

    let ws = null;
    let retry = 0;
    let timer = null;
    let stopped = false;

    async function connect() {
      setWsStatus(retry ? 'reconnecting' : 'connecting');
      const token = await getToken();
      if (stopped || !token) return;

      ws = new WebSocket(`${WS_URL}/ws/${groupId}?token=${encodeURIComponent(token)}`);
      ws.onopen = () => { retry = 0; setWsStatus('connected'); };
      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        handlersRef.current[msg.type]?.(msg);
      };
      ws.onclose = (event) => {
        if (stopped) return;
        if (NO_GROUP_CODES.has(event.code)) {
          setWsStatus('idle');
          fetchGroup().then((g) => { if (!g) leftGroup(event.reason); });
          return;
        }
        // 1 s, 2 s, 4 s… hasta 30 s
        const delay = Math.min(30_000, 1000 * 2 ** retry++);
        setWsStatus('reconnecting');
        timer = setTimeout(connect, delay);
      };
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      ws?.close(1000, 'unmount');
      setWsStatus('idle');
    };
  }, [groupId, fetchGroup, leftGroup]);

  // ── Acciones ────────────────────────────────────────────────────────────────
  const run = useCallback(async (fn) => {
    const data = await fn();
    if (data?.group !== undefined) setGroup(data.group);
    return data;
  }, []);

  const createGroup = (name) => run(() => groupApi.create(name)).then(() => { setNotice(null); refreshUser(); });
  const joinGroup = (code) => run(() => groupApi.join(code)).then(() => { setNotice(null); refreshUser(); });
  const renameGroup = (name) => run(() => groupApi.rename(name));
  const regenerateCode = () => run(() => groupApi.regenerateCode());
  const kickMember = (userId) => run(() => groupApi.kick(userId));
  const leaveGroup = async () => {
    await groupApi.leave();
    clearGroup();
    await refreshUser();
  };

  return (
    <GroupContext.Provider
      value={{
        group,
        groupLoading,
        groupError,
        locations,
        online,
        wsStatus,
        notice,
        dismissNotice: () => setNotice(null),
        isOwner: !!group && group.ownerId === user?.id,
        fetchGroup,
        createGroup,
        joinGroup,
        renameGroup,
        regenerateCode,
        kickMember,
        leaveGroup
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components
export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup debe usarse dentro de <GroupProvider>');
  return ctx;
}
