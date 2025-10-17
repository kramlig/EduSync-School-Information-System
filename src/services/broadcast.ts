
type WriteFlushedPayload = {
  collection: string;
  ids?: string[];
};

export type BroadcastEvent =
  | { type: 'writeFlushed'; payload: WriteFlushedPayload };

type Handler = (event: BroadcastEvent) => void;

const CHANNEL_NAME = 'edusync-bus';

let ch: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    ch = new BroadcastChannel(CHANNEL_NAME);
    try { console.log('[Broadcast] channel initialized:', CHANNEL_NAME); } catch {}
  }
} catch {}

const subscribers = new Set<Handler>();

function storageKey() { return `__bc:${CHANNEL_NAME}`; }

export function publish(event: BroadcastEvent) {
  try {
    if (ch) { try { ch.postMessage(event); } catch {}
      try { console.log('[Broadcast] publish via BroadcastChannel:', event); } catch {}
    }
  } catch {}
  try {
    // storage event fallback for older browsers / blocked BroadcastChannel
    const payload = JSON.stringify({ event, ts: Date.now() });
    localStorage.setItem(storageKey(), payload);
    try { console.log('[Broadcast] publish via storage:', event); } catch {}
    // cleanup shortly after to ensure storage event is dispatched
    setTimeout(() => {
      try { localStorage.removeItem(storageKey()); } catch {}
    }, 250);
  } catch {}
}

export function subscribe(handler: Handler): () => void {
  subscribers.add(handler);
  const onMessage = (e: MessageEvent) => {
    try { console.log('[Broadcast] recv BroadcastChannel:', e.data); } catch {}
    try { handler(e.data as BroadcastEvent); } catch {}
  };
  try { if (ch) ch.addEventListener('message', onMessage); } catch {}

  const onStorage = (e: StorageEvent) => {
    if (e.key !== storageKey() || !e.newValue) return;
    try {
      const { event } = JSON.parse(e.newValue);
      try { console.log('[Broadcast] recv storage:', event); } catch {}
      handler(event as BroadcastEvent);
    } catch {}
  };
  try { window.addEventListener('storage', onStorage); } catch {}

  return () => {
    subscribers.delete(handler);
    try { if (ch) ch.removeEventListener('message', onMessage); } catch {}
    try { window.removeEventListener('storage', onStorage); } catch {}
  };
}

export function close() {
  try { ch && ch.close(); } catch {}
  ch = null;
}
