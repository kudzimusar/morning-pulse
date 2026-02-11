/**
 * System Health Service — Firestore latency polling and live events.
 * Used by System tab for real-time API latency and Critical System Events.
 */

import { Firestore, collection, query, limit, getDocs } from 'firebase/firestore';

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface HealthState {
  latencyMs: number | null;
  status: HealthStatus;
  lastChecked: number | null;
  error: string | null;
}

const LATENCY_WARNING_MS = 500;
const LATENCY_CRITICAL_MS = 2000;

let state: HealthState = {
  latencyMs: null,
  status: 'unknown',
  lastChecked: null,
  error: null,
};

let pollIntervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(s: HealthState) => void>();

export interface SystemEvent {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  time: string;
  timestamp: number;
}

const recentEvents: SystemEvent[] = [];
const MAX_EVENTS = 50;

function addEvent(type: SystemEvent['type'], message: string) {
  const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const time = 'Just now';
  const timestamp = Date.now();
  recentEvents.unshift({ id, type, message, time, timestamp });
  if (recentEvents.length > MAX_EVENTS) recentEvents.pop();
}

function formatTimeAgo(ms: number): string {
  if (ms < 60 * 1000) return 'Just now';
  if (ms < 60 * 60 * 1000) return `${Math.floor(ms / 60000)} min ago`;
  if (ms < 24 * 60 * 60 * 1000) return `${Math.floor(ms / 3600000)} hrs ago`;
  return `${Math.floor(ms / 86400000)} days ago`;
}

function notifyListeners() {
  listeners.forEach(fn => fn(state));
}

export function getHealth(): HealthState {
  return { ...state };
}

export function getRecentEvents(): SystemEvent[] {
  return recentEvents.map(ev => ({
    ...ev,
    time: ev.timestamp ? formatTimeAgo(Date.now() - ev.timestamp) : ev.time,
  }));
}

export function subscribeToHealth(callback: (s: HealthState) => void): () => void {
  listeners.add(callback);
  callback(state);
  return () => listeners.delete(callback);
}

export function subscribeToEvents(callback: (events: SystemEvent[]) => void): () => void {
  const tick = () => callback(getRecentEvents());
  const id = setInterval(tick, 5000);
  tick();
  return () => clearInterval(id);
}

async function pingFirestore(db: Firestore): Promise<{ latencyMs: number }> {
  const start = performance.now();
  const staffRef = collection(db, 'staff');
  const q = query(staffRef, limit(1));
  await getDocs(q);
  const latencyMs = Math.round(performance.now() - start);
  return { latencyMs };
}

export function startHealthPolling(db: Firestore, intervalMs: number = 45000) {
  if (pollIntervalId) return;

  const run = async () => {
    try {
      const { latencyMs } = await pingFirestore(db);
      state = {
        latencyMs,
        status: latencyMs >= LATENCY_CRITICAL_MS ? 'critical' : latencyMs >= LATENCY_WARNING_MS ? 'warning' : 'healthy',
        lastChecked: Date.now(),
        error: null,
      };
      if (state.status === 'warning') {
        addEvent('warning', `Firestore latency elevated: ${latencyMs}ms`);
      } else if (state.status === 'critical') {
        addEvent('error', `Firestore latency critical: ${latencyMs}ms`);
      }
    } catch (err: any) {
      state = {
        latencyMs: null,
        status: 'unknown',
        lastChecked: Date.now(),
        error: err?.message || 'Firestore ping failed',
      };
      addEvent('error', `Firestore error: ${state.error}`);
    }
    notifyListeners();
  };

  run();
  pollIntervalId = setInterval(run, intervalMs);
}

export function stopHealthPolling() {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
}
