<script setup lang="ts">
import { ref, computed } from 'vue';
import { getState, createSession, setActiveSession, deleteSession, completeOnboarding, navigateTo } from '../store';
import { formatDate, toLocalInputValue, parseInputTime } from '../format';

const state = getState();

const showNewForm = ref(false);
const nameInput = ref('');
const myNumberInput = ref('');
const currentNumInput = ref('');
const joinedAtInput = ref(toLocalInputValue(new Date()));
const currentNumTimeInput = ref(toLocalInputValue(new Date()));

const showOnboarding = computed(() => !state.onboardingDone);

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
  if (!state.onboardingDone) completeOnboarding();
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

function dismissOnboarding() {
  completeOnboarding();
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

    <!-- Onboarding -->
    <div v-if="showOnboarding" class="onboarding">
      <div class="onboarding-title">Welcome to Queue Watch!</div>
      <div class="onboarding-steps">
        <div class="step">
          <span class="step-num">1</span>
          <span class="step-text">Take a ticket and note your <strong>ticket number</strong></span>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <span class="step-text">Check what number is currently <strong>being served</strong></span>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <span class="step-text">Tap <strong>"+ New Queue Session"</strong> and enter both numbers</span>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <span class="step-text">Each time a new number is called, <strong>log it</strong> — the app will predict your wait</span>
        </div>
      </div>
      <button class="dismiss-btn" @click="dismissOnboarding">Got it</button>
    </div>

    <!-- Storage warning -->
    <div class="storage-warning">
      Your sessions are stored in this browser only. Clearing your site data or browser storage will erase all sessions.
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

      <div class="tooltip" v-if="showOnboarding">
        Give your session a name so you can find it later.
      </div>

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

      <div class="tooltip" v-if="showOnboarding">
        Look at the display board or ask — what number are they serving right now?
      </div>

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

    <div v-if="state.sessions.length === 0 && !showNewForm && !showOnboarding" class="empty-state">
      No sessions yet. Start a new one to begin tracking your place in line.
    </div>

    <!-- About link -->
    <button class="about-link" @click="navigateTo('about')">About this app</button>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px 48px;
  min-height: 100vh;
  max-width: 520px;
  margin: 0 auto;
  gap: 16px;
}

.header {
  text-align: center;
  margin-bottom: 12px;
}
.header-sub {
  font-size: 11px;
  letter-spacing: 6px;
  color: #b8860b;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.header-title {
  margin: 0;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: -1px;
  color: #a0740a;
  line-height: 1;
}
.header-tagline {
  margin-top: 8px;
  font-size: 11px;
  letter-spacing: 4px;
  color: #9a8a6a;
  text-transform: uppercase;
}

/* Onboarding */
.onboarding {
  background: #fff;
  border: 1px solid #e0d6c2;
  border-left: 4px solid #b8860b;
  border-radius: 10px;
  padding: 20px 22px;
  width: 100%;
}
.onboarding-title {
  font-size: 15px;
  font-weight: 900;
  color: #3a2e1e;
  margin-bottom: 14px;
}
.onboarding-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.step-num {
  flex: 0 0 22px;
  height: 22px;
  background: #b8860b;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}
.step-text {
  font-size: 13px;
  color: #5a4a30;
  line-height: 1.5;
}
.dismiss-btn {
  background: none;
  border: 1px solid #d0c4a8;
  border-radius: 6px;
  padding: 6px 16px;
  color: #8a7a5a;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.dismiss-btn:hover {
  background: #f5f0e6;
  color: #5a4a30;
}

.tooltip {
  font-size: 12px;
  color: #8a7540;
  background: #fdf8ee;
  border: 1px solid #e8dfc8;
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 6px;
  line-height: 1.4;
}

.storage-warning {
  font-size: 11px;
  color: #8a7a5a;
  background: #fdf8ee;
  border: 1px solid #e8dfc8;
  border-radius: 8px;
  padding: 10px 14px;
  text-align: center;
  width: 100%;
  line-height: 1.5;
}

.card {
  background: #fff;
  border: 1px solid #e0d6c2;
  border-radius: 12px;
  padding: 24px 22px;
  width: 100%;
}

.section-label {
  font-size: 11px;
  letter-spacing: 3px;
  color: #b8860b;
  margin-bottom: 16px;
  text-transform: uppercase;
}

.label {
  display: block;
  font-size: 11px;
  letter-spacing: 2px;
  color: #8a7a5a;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.mt-20 { margin-top: 20px; }
.mt-16 { margin-top: 16px; }

.input {
  display: block;
  width: 100%;
  background: #faf8f5;
  border: 1px solid #d0c4a8;
  border-radius: 8px;
  padding: 12px 14px;
  color: #3a2e1e;
  font-family: 'Courier New', Courier, monospace;
  font-size: 18px;
  font-weight: 700;
  outline: none;
  margin-bottom: 4px;
}
.input:focus {
  border-color: #b8860b;
  box-shadow: 0 0 0 2px rgba(184,134,11,0.12);
}

.divider {
  border-top: 1px solid #e8dfc8;
  margin: 22px 0;
}

.hint {
  font-size: 11px;
  color: #9a8a6a;
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
  background: #b8860b;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
}
.primary-btn:hover {
  background: #a07508;
}

.full-width {
  width: 100%;
  max-width: 520px;
}

.link-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #b8860b;
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
  border-bottom: 1px solid #f0ebe0;
  transition: background 0.15s;
}
.session-row:last-child {
  border-bottom: none;
}
.session-row:hover {
  background: #fdf8ee;
}
.session-row.past {
  opacity: 0.55;
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
  color: #a0740a;
}
.session-meta {
  font-size: 12px;
  color: #8a7a5a;
}
.session-date {
  font-size: 11px;
  color: #b0a080;
}

.session-actions {
  display: flex;
  align-items: center;
}
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #c0b090;
  font-size: 14px;
  padding: 4px 8px;
  font-family: inherit;
}
.delete-btn:hover {
  color: #c05040;
}

.empty-state {
  font-size: 13px;
  color: #9a8a6a;
  text-align: center;
  padding: 40px 0;
}

.about-link {
  background: none;
  border: none;
  cursor: pointer;
  color: #b0a080;
  font-size: 11px;
  font-family: 'Courier New', Courier, monospace;
  text-decoration: underline;
  padding: 0;
  margin-top: 8px;
}
.about-link:hover {
  color: #8a7a5a;
}
</style>
