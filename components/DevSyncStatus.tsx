import { useEffect, useState } from 'react';
import { subscribe as bcSubscribe } from '../src/services/broadcast';

type EventLog = { ts: number; type: string };

export default function DevSyncStatus() {
  const [polling] = useState<string>(() => String((import.meta as any).env?.VITE_POLL_SAG || ''));
  const [events, setEvents] = useState<EventLog[]>([]);

  useEffect(() => {
    const off = bcSubscribe((evt) => {
      setEvents((prev) => [{ ts: Date.now(), type: evt.type }, ...prev].slice(0, 5));
    });
    return () => { try { off(); } catch {} };
  }, []);

  const last = events[0];

  const badge = {
    position: 'fixed' as const,
    right: 8,
    bottom: 8,
    zIndex: 9999,
    background: 'rgba(17, 24, 39, 0.9)', // slate-900/90
    color: 'white',
    padding: '8px 10px',
    borderRadius: 8,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 12,
    lineHeight: 1.2,
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    pointerEvents: 'none' as const,
    opacity: 0.9,
  };

  const pill = (text: string, on = true) => (
    <span style={{
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: 999,
      background: on ? '#10B981' : '#6B7280', // green-500 / gray-500
      marginRight: 6,
      fontWeight: 600,
    }}>{text}</span>
  );

  const fmt = (ms: number) => new Date(ms).toLocaleTimeString();

  return (
    <div style={badge}>
      <div style={{ marginBottom: 4, fontWeight: 700 }}>
        Dev Sync Status
      </div>
      <div style={{ marginBottom: 4 }}>
        {pill('Broadcast', !!last)}
        {pill(`Polling ${String(polling).toLowerCase() === 'true' ? 'On' : 'Off'}`, String(polling).toLowerCase() === 'true')}
      </div>
      <div>
        <div style={{ opacity: 0.7 }}>Last events:</div>
        {events.length === 0 ? (
          <div style={{ opacity: 0.6 }}>— none yet —</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {events.map((e, i) => (
              <li key={i}>{fmt(e.ts)} — {e.type}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
