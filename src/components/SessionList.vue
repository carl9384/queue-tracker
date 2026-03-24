<script setup lang="ts">
import { ref, computed } from 'vue';
import { getState, createSession, setActiveSession, deleteSession } from '../store';
import { formatDate, toLocalInputValue, parseInputTime } from '../format';

const state = getState();

const showNewForm = ref(false);
const nameInput = ref('');
const myNumberInput = ref('');
const currentNumInput = ref('');
const joinedAtInput = ref(toLocalInputValue(new Date()));
const currentNumTimeInput = ref(toLocalInputValue(new Date()));

const activeSessions = computed(() =>
  state.sessions.filter(s => !s.done).sort((a, b) => b.createdAt - a.createdAt)
);
const pastSessions = computed(() =>
  state.sessions.filter(s => s.done).sort((a, b) => b.createdAt - a.createdAt)
);

function openNewForm() {
  showNewForm.value = true;
  nameInput.value = '';
  myNumberInput.value = '';
  currentNumInput.value = '';
  joinedAtInput.value = toLocalInputValue(new Date());
  currentNumTimeInput.value = toLocalInputValue(new Date());
}

function handleCreate() {
  const my = parseInt(myNumberInput.value);
  const curr = parseInt(currentNumInput.value);
  if (isNaN(my) || isNaN(curr)) return;
  const jAt = parseInputTime(joinedAtInput.value) ?? Date.now();
  const cAt = parseInputTime(currentNumTimeInput.value) ?? Date.now();
  const name = nameInput.value.trim() || `Queue ${formatDate(new Date())}`;
  createSession(name, my, jAt, curr, cAt);
  showNewForm.value = false;
}

function resumeSession(id: string) {
  setActiveSession(id);
}

function confirmDelete(id: string) {
  if (confirm('Delete this session? This cannot be undone.')) {
    deleteSession(id);
  }
}

function sessionSummary(s: typeof state.sessions[0]) {
  const sorted = [...s.calls].sort((a, b) => a.number - b.number);
  const latest = sorted[sorted.length - 1];
  const left = s.myNumber - latest.number;
  if (left <= 0) return 'Done!';
  return `${left} ahead · now serving #${latest.number}`;
}
</script>

<template>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-sub">Now Serving</div>
      <h1 class="header-title">QUEUE<br />WATCH</h1>
      <div class="header-tagline">line tracker &amp; predictor</div>
    </div>

    <!-- Storage warning -->
    <div class="storage-warning">
      Your sessions are stored in this browser's local storage. Clearing your site data or browser storage will erase all queue-waiting sessions.
    </div>

    <!-- New session form -->
    <div v-if="showNewForm" class="card">
      <div class="section-label">New Session</div>

      <label class="label">Name / Location</label>
      <input
        class="input"
        type="text"
        placeholder="e.g. DMV, Post Office, Bakery..."
        v-model="nameInput"
        @keydown.enter="handleCreate"
      />

      <label class="label mt-20">Your ticket number</label>
      <input
        class="input"
        type="number"
        placeholder="e.g. 47"
        v-model="myNumberInput"
        @keydown.enter="handleCreate"
      />

      <label class="label mt-16">You joined the line at</label>
      <input
        class="input"
        type="datetime-local"
        v-model="joinedAtInput"
      />

      <div class="divider" />

      <label class="label">Current number being served</label>
      <input
        class="input"
        type="number"
        placeholder="e.g. 31"
        v-model="currentNumInput"
        @keydown.enter="handleCreate"
      />

      <label class="label mt-16">Observed at</label>
      <input
        class="input"
        type="datetime-local"
        v-model="currentNumTimeInput"
      />
      <div class="hint">
        Change this if you noted the number earlier but are entering it now.
      </div>

      <div class="form-actions">
        <button class="primary-btn" @click="handleCreate">Start Tracking</button>
        <button class="link-btn" @click="showNewForm = false">Cancel</button>
      </div>
    </div>

    <!-- New session button -->
    <button v-if="!showNewForm" class="primary-btn full-width" @click="openNewForm">
      + New Queue Session
    </button>

    <!-- Active sessions -->
    <div v-if="activeSessions.length > 0" class="card">
      <div class="section-label">Active Sessions</div>
      <div
        v-for="s in activeSessions"
        :key="s.id"
        class="session-row"
        @click="resumeSession(s.id)"
      >
        <div class="session-info">
          <div class="session-name">{{ s.name }}</div>
          <div class="session-meta">
            #{{ s.myNumber }} · {{ sessionSummary(s) }}
          </div>
          <div class="session-date">{{ formatDate(new Date(s.createdAt)) }}</div>
        </div>
        <div class="session-actions">
          <button
            class="delete-btn"
            @click.stop="confirmDelete(s.id)"
            title="Delete session"
          >&#10005;</button>
        </div>
      </div>
    </div>

    <!-- Past sessions -->
    <div v-if="pastSessions.length > 0" class="card">
      <div class="section-label">Past Sessions</div>
      <div
        v-for="s in pastSessions"
        :key="s.id"
        class="session-row past"
        @click="resumeSession(s.id)"
      >
        <div class="session-info">
          <div class="session-name">{{ s.name }}</div>
          <div class="session-meta">
            #{{ s.myNumber }} · {{ sessionSummary(s) }}
          </div>
          <div class="session-date">{{ formatDate(new Date(s.createdAt)) }}</div>
        </div>
        <div class="session-actions">
          <button
            class="delete-btn"
            @click.stop="confirmDelete(s.id)"
            title="Delete session"
          >&#10005;</button>
        </div>
      </div>
    </div>

    <div v-if="state.sessions.length === 0 && !showNewForm" class="empty-state">
      No sessions yet. Start a new one to begin tracking your place in line.
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  min-height: 100vh;
  max-width: 520px;
  margin: 0 auto;
  gap: 16px;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}
.header-sub {
  font-size: 11px;
  letter-spacing: 6px;
  color: #c8902a;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.header-title {
  margin: 0;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: -1px;
  color: #f5c842;
  text-shadow: 0 0 40px rgba(245,200,66,0.3);
  line-height: 1;
}
.header-tagline {
  margin-top: 8px;
  font-size: 11px;
  letter-spacing: 4px;
  color: #7a5c2a;
  text-transform: uppercase;
}

.storage-warning {
  font-size: 11px;
  color: #a07840;
  background: rgba(200,144,42,0.08);
  border: 1px solid rgba(200,144,42,0.2);
  border-radius: 8px;
  padding: 10px 14px;
  text-align: center;
  width: 100%;
  line-height: 1.5;
}

.card {
  background: rgba(255,200,80,0.04);
  border: 1px solid rgba(200,144,42,0.25);
  border-radius: 12px;
  padding: 24px 22px;
  width: 100%;
}

.section-label {
  font-size: 11px;
  letter-spacing: 3px;
  color: #c8902a;
  margin-bottom: 16px;
  text-transform: uppercase;
}

.label {
  display: block;
  font-size: 11px;
  letter-spacing: 2px;
  color: #7a5c2a;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.mt-20 { margin-top: 20px; }
.mt-16 { margin-top: 16px; }

.input {
  display: block;
  width: 100%;
  background: rgba(255,200,80,0.06);
  border: 1px solid rgba(200,144,42,0.35);
  border-radius: 8px;
  padding: 12px 14px;
  color: #f5e6c8;
  font-family: 'Courier New', Courier, monospace;
  font-size: 18px;
  font-weight: 700;
  outline: none;
  margin-bottom: 4px;
  color-scheme: dark;
}

.divider {
  border-top: 1px solid rgba(200,144,42,0.15);
  margin: 22px 0;
}

.hint {
  font-size: 11px;
  color: #7a5c2a;
  margin-top: 6px;
}

.form-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.primary-btn {
  width: 100%;
  padding: 14px;
  background: #f5c842;
  border: none;
  border-radius: 8px;
  color: #1a0f00;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
}
.primary-btn:hover {
  background: #ffd95c;
}

.full-width {
  width: 100%;
  max-width: 520px;
}

.link-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #c8902a;
  font-size: 12px;
  font-family: 'Courier New', Courier, monospace;
  text-decoration: underline;
  padding: 0;
}

.session-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 10px;
  border-radius: 8px;
  cursor: pointer;
  border-bottom: 1px solid rgba(200,144,42,0.08);
  transition: background 0.15s;
}
.session-row:last-child {
  border-bottom: none;
}
.session-row:hover {
  background: rgba(255,200,80,0.06);
}
.session-row.past {
  opacity: 0.6;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}
.session-name {
  font-size: 15px;
  font-weight: 900;
  color: #f5c842;
}
.session-meta {
  font-size: 12px;
  color: #a07840;
}
.session-date {
  font-size: 11px;
  color: #5a3a1a;
}

.session-actions {
  display: flex;
  align-items: center;
}
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #4a2a0a;
  font-size: 14px;
  padding: 4px 8px;
  font-family: inherit;
}
.delete-btn:hover {
  color: #df7a4a;
}

.empty-state {
  font-size: 13px;
  color: #7a5c2a;
  text-align: center;
  padding: 40px 0;
}
</style>
