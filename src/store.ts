import { reactive, watch } from 'vue';
import type { AppState, QueueSession, ViewName } from './types';

const STORAGE_KEY = 'queue-tracker-state';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadState(): AppState {
  const defaults: AppState = {
    sessions: [],
    activeSessionId: null,
    use24Hour: true,
    onboardingDone: false,
    currentView: 'sessions',
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.sessions && Array.isArray(parsed.sessions)) {
        return { ...defaults, ...parsed };
      }
    }
  } catch {
    // corrupted data
  }
  return defaults;
}

function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable
  }
}

const state = reactive<AppState>(loadState());

// Restore view based on active session
if (state.activeSessionId && state.sessions.some(s => s.id === state.activeSessionId)) {
  state.currentView = 'tracker';
} else {
  state.activeSessionId = null;
  if (state.currentView === 'tracker') state.currentView = 'sessions';
}

watch(state, (val) => saveState(val), { deep: true });

export function getState() {
  return state;
}

export function getActiveSession(): QueueSession | null {
  if (!state.activeSessionId) return null;
  return state.sessions.find(s => s.id === state.activeSessionId) ?? null;
}

export function setActiveSession(id: string | null): void {
  state.activeSessionId = id;
  state.currentView = id ? 'tracker' : 'sessions';
}

export function navigateTo(view: ViewName): void {
  state.currentView = view;
}

export function createSession(name: string, myNumber: number, joinedAt: number, currentNumber: number, observedAt: number): QueueSession {
  const session: QueueSession = {
    id: generateId(),
    name,
    myNumber,
    joinedAt,
    calls: [{ number: currentNumber, timestamp: observedAt }],
    createdAt: Date.now(),
    done: false,
  };
  state.sessions.push(session);
  state.activeSessionId = session.id;
  state.currentView = 'tracker';
  return session;
}

export function addCall(sessionId: string, number: number, timestamp: number): void {
  const session = state.sessions.find(s => s.id === sessionId);
  if (!session) return;
  session.calls.push({ number, timestamp });
}

export function updateCall(sessionId: string, index: number, number: number, timestamp: number): void {
  const session = state.sessions.find(s => s.id === sessionId);
  if (!session || index < 0 || index >= session.calls.length) return;
  session.calls[index] = { number, timestamp };
  session.calls.sort((a, b) => a.timestamp - b.timestamp);
}

export function deleteCall(sessionId: string, index: number): void {
  const session = state.sessions.find(s => s.id === sessionId);
  if (!session || session.calls.length <= 1) return;
  session.calls.splice(index, 1);
}

export function deleteSession(sessionId: string): void {
  const idx = state.sessions.findIndex(s => s.id === sessionId);
  if (idx === -1) return;
  state.sessions.splice(idx, 1);
  if (state.activeSessionId === sessionId) {
    state.activeSessionId = null;
    state.currentView = 'sessions';
  }
}

export function markSessionDone(sessionId: string): void {
  const session = state.sessions.find(s => s.id === sessionId);
  if (session) session.done = true;
}

export function toggleTimeFormat(): void {
  state.use24Hour = !state.use24Hour;
}

export function completeOnboarding(): void {
  state.onboardingDone = true;
}
