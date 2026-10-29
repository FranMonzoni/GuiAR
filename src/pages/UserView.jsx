import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import AppHeader from '../components/AppHeader';
import GroupMap from '../components/GroupMap';
import GroupSetup from '../components/GroupSetup';
import GroupSettings from '../components/GroupSettings';
import StatusBadge from '../components/StatusBadge';
import { colorFor, distanceMeters, formatDistance, initials, isStale, timeAgo } from '../utils/format';
import './UserView.css';

const WS_BADGE = { connected: 'connected', connecting: 'searching', reconnecting: 'searching', idle: 'disconnected' };
const WS_LABEL = { connected: 'En vivo', connecting: 'Conectando…', reconnecting: 'Reconectando…', idle: 'Sin conexión' };

/** Re-render periódico para que "hace X s" se mantenga actualizado. */
function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function MemberRow({ member, loc, isMe, distance, now, onFocus }) {
  const color = colorFor(member.id);
  // "En vivo" = la ESP reportó hace menos de 2 min (aunque haya llegado por REST)
  const live = !!loc && !isStale(loc.timestamp, now);
  const status = !loc
    ? 'Sin ubicación todavía'
    : `${live ? 'En vivo' : 'Última vez'} · ${timeAgo(loc.timestamp, now)}`;

  return (
    <li>
      <button className={`member ${!loc ? 'is-empty' : ''}`} onClick={() => loc && onFocus(loc)} disabled={!loc}>
        <span className={`avatar ${live ? 'is-live' : ''}`} style={{ '--c': color }}>
          {initials(member.displayName)}
        </span>
        <span className="member__body">
          <span className="member__name">
            {member.displayName}
            {isMe && <span className="muted"> (vos)</span>}
          </span>
          <span className="member__status">{status}</span>
        </span>
        <span className="member__meta">
          {distance != null && <span className="member__dist">{formatDistance(distance)}</span>}
          {loc?.battery != null && <span className="member__bat">{Math.round(loc.battery)}%</span>}
        </span>
      </button>
    </li>
  );
}

export default function UserView() {
  const { user, syncError, refreshUser } = useAuth();
  const { group, groupLoading, groupError, locations, wsStatus, notice, dismissNotice } = useGroup();
  const [panel, setPanel] = useState('members'); // 'members' | 'settings'
  const [focus, setFocus] = useState(null);
  const [fitKey, setFitKey] = useState(0);
  const now = useNow();

  const locList = useMemo(
    () => Object.values(locations).filter((l) => group?.members.some((m) => m.id === l.userId)),
    [locations, group]
  );
  const myLoc = user ? locations[user.id] : null;

  // Yo primero, después los que tienen ubicación más reciente
  const members = useMemo(() => {
    if (!group) return [];
    return [...group.members].sort((a, b) => {
      if (a.id === user?.id) return -1;
      if (b.id === user?.id) return 1;
      const ta = locations[a.id] ? new Date(locations[a.id].timestamp).getTime() : 0;
      const tb = locations[b.id] ? new Date(locations[b.id].timestamp).getTime() : 0;
      return tb - ta;
    });
  }, [group, locations, user?.id]);

  const header = (
    <AppHeader subtitle={group?.name}>
      {group && <StatusBadge status={WS_BADGE[wsStatus]} label={WS_LABEL[wsStatus]} />}
    </AppHeader>
  );

  if (groupLoading) {
    return (
      <div className="page">
        {header}
        <div className="app-loading"><span className="spinner" aria-hidden="true" />Cargando grupo…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        {header}
        <div className="center-block stack">
          <p className="alert alert-error">No se pudo conectar con el servidor{syncError ? `: ${syncError}` : '.'}</p>
          <button className="btn btn-primary" onClick={refreshUser}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="page">
        {header}
        {notice && (
          <div className="banner">
            <span>{notice}</span>
            <button className="btn btn-link small" onClick={dismissNotice}>Cerrar</button>
          </div>
        )}
        {groupError ? <p className="alert alert-error center-block">{groupError}</p> : <GroupSetup />}
      </div>
    );
  }

  return (
    <div className="page page--map">
      {header}
      <div className="map-layout">
        <aside className="sidebar">
          <div className="segmented segmented--full">
            <button className={panel === 'members' ? 'is-active' : ''} onClick={() => setPanel('members')}>
              Miembros <span className="count">{group.members.length}</span>
            </button>
            <button className={panel === 'settings' ? 'is-active' : ''} onClick={() => setPanel('settings')}>
              Grupo
            </button>
          </div>

          {panel === 'members' ? (
            <>
              <ul className="member-list">
                {members.map((m) => {
                  const loc = locations[m.id];
                  const distance = m.id !== user?.id && loc && myLoc ? distanceMeters(myLoc, loc) : null;
                  return (
                    <MemberRow
                      key={m.id}
                      member={m}
                      loc={loc}
                      isMe={m.id === user?.id}
                      distance={distance}
                      now={now}
                      onFocus={setFocus}
                    />
                  );
                })}
              </ul>
              {group.members.length === 1 && (
                <div className="hint-card">
                  <strong>Invitá a tu gente</strong>
                  <p>Compartí el código <code>{group.inviteCode}</code> para que se unan.</p>
                </div>
              )}
              {locList.length === 0 && (
                <p className="muted small sidebar-note">
                  Las ubicaciones llegan desde la app móvil conectada a cada GuiAR. Todavía nadie envió datos.
                </p>
              )}
            </>
          ) : (
            <GroupSettings />
          )}
        </aside>

        <section className="map-wrap">
          <GroupMap locations={locList} meId={user?.id} focus={focus} fitKey={fitKey} now={now} />
          {locList.length > 1 && (
            <button className="btn btn-floating" onClick={() => { setFocus(null); setFitKey((k) => k + 1); }}>
              Ver a todos
            </button>
          )}
          {locList.length === 0 && <div className="map-empty">Esperando ubicaciones…</div>}
        </section>
      </div>
    </div>
  );
}
