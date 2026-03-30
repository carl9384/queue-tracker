<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getState, createSession, setActiveSession, deleteSession, completeOnboarding, navigateTo } from '../store';
import { formatDate, toLocalInputValue, parseInputTime } from '../format';
import LanguageSwitcher from './LanguageSwitcher.vue';

const { t } = useI18n();
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
  const name = nameInput.value.trim() || t('newSession.defaultName', { date: formatDate(new Date(), state.locale) });
  createSession(name, my, jAt, curr, cAt);
  showNewForm.value = false;
  if (!state.onboardingDone) completeOnboarding();
}

function resumeSession(id: string) {
  setActiveSession(id);
}

function confirmDelete(id: string) {
  if (confirm(t('sessions.deleteConfirm'))) {
    deleteSession(id);
  }
}

function sessionSummary(s: typeof state.sessions[0]) {
  const sorted = [...s.calls].sort((a, b) => a.number - b.number);
  const latest = sorted[sorted.length - 1];
  const left = s.myNumber - latest.number;
  if (left <= 0) return t('sessions.done');
  return t('sessions.ahead', { left, number: latest.number });
}

function dismissOnboarding() {
  completeOnboarding();
}
</script>

<template>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-sub">{{ t('header.nowServing') }}</div>
      <h1 class="header-title">{{ t('header.appName') }}</h1>
      <div class="header-tagline">{{ t('header.tagline') }}</div>
    </div>

    <!-- Help link + Language switcher -->
    <div class="header-actions">
      <button class="help-link" @click="navigateTo('help')">{{ t('common.help') }}</button>
      <LanguageSwitcher />
    </div>

    <!-- Onboarding -->
    <div v-if="showOnboarding" class="onboarding">
      <div class="onboarding-title">{{ t('onboarding.welcome') }}</div>
      <div class="onboarding-steps">
        <div class="step">
          <span class="step-num">1</span>
          <span class="step-text" v-html="t('onboarding.step1')"></span>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <span class="step-text" v-html="t('onboarding.step2')"></span>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <span class="step-text" v-html="t('onboarding.step3')"></span>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <span class="step-text" v-html="t('onboarding.step4')"></span>
        </div>
      </div>
      <button class="dismiss-btn" @click="dismissOnboarding">{{ t('common.gotIt') }}</button>
    </div>

    <!-- Storage warning -->
    <div class="storage-warning">
      {{ t('storageWarning') }}
    </div>

    <!-- New session form -->
    <form v-if="showNewForm" class="card" @submit.prevent="handleCreate">
      <h2 class="section-label">{{ t('newSession.title') }}</h2>

      <label class="label" for="session-name">{{ t('newSession.nameLabel') }}</label>
      <input
        id="session-name"
        class="input"
        type="text"
        :placeholder="t('newSession.namePlaceholder')"
        v-model="nameInput"
      />

      <div class="tooltip" v-if="showOnboarding">
        {{ t('newSession.nameTooltip') }}
      </div>

      <label class="label mt-20" for="my-number">{{ t('newSession.myNumberLabel') }}</label>
      <input
        id="my-number"
        class="input"
        type="number"
        :placeholder="t('newSession.myNumberPlaceholder')"
        v-model="myNumberInput"
      />

      <label class="label mt-16" for="joined-at">{{ t('newSession.joinedAtLabel') }}</label>
      <input
        id="joined-at"
        class="input"
        type="datetime-local"
        v-model="joinedAtInput"
      />

      <div class="divider" />

      <label class="label" for="current-num">{{ t('newSession.currentNumLabel') }}</label>
      <input
        id="current-num"
        class="input"
        type="number"
        :placeholder="t('newSession.currentNumPlaceholder')"
        v-model="currentNumInput"
      />

      <div class="tooltip" v-if="showOnboarding">
        {{ t('newSession.currentNumTooltip') }}
      </div>

      <label class="label mt-16" for="observed-at">{{ t('newSession.observedAtLabel') }}</label>
      <input
        id="observed-at"
        class="input"
        type="datetime-local"
        v-model="currentNumTimeInput"
      />
      <div class="hint">
        {{ t('newSession.observedAtHint') }}
      </div>

      <div class="form-actions">
        <button type="submit" class="primary-btn">{{ t('newSession.startTracking') }}</button>
        <button type="button" class="link-btn" @click="showNewForm = false">{{ t('common.cancel') }}</button>
      </div>
    </form>

    <!-- New session button -->
    <button v-if="!showNewForm" class="primary-btn full-width" @click="openNewForm">
      {{ t('sessions.newButton') }}
    </button>

    <!-- Active sessions -->
    <div v-if="activeSessions.length > 0" class="card" role="region" :aria-label="t('sessions.activeTitle')">
      <h2 class="section-label">{{ t('sessions.activeTitle') }}</h2>
      <div
        v-for="s in activeSessions"
        :key="s.id"
        class="session-row"
        role="button"
        tabindex="0"
        :aria-label="t('sessions.openSession', { name: s.name })"
        @click="resumeSession(s.id)"
        @keydown.enter="resumeSession(s.id)"
        @keydown.space.prevent="resumeSession(s.id)"
      >
        <div class="session-info">
          <h3 class="session-name">{{ s.name }}</h3>
          <div class="session-meta">
            #{{ s.myNumber }} · {{ sessionSummary(s) }}
          </div>
          <div class="session-date">{{ formatDate(new Date(s.createdAt), state.locale) }}</div>
        </div>
        <div class="session-actions">
          <button
            class="delete-btn"
            :aria-label="t('sessions.deleteSession', { name: s.name })"
            @click.stop="confirmDelete(s.id)"
          >&#10005;</button>
        </div>
      </div>
    </div>

    <!-- Past sessions -->
    <div v-if="pastSessions.length > 0" class="card" role="region" :aria-label="t('sessions.pastTitle')">
      <h2 class="section-label">{{ t('sessions.pastTitle') }}</h2>
      <div
        v-for="s in pastSessions"
        :key="s.id"
        class="session-row past"
        role="button"
        tabindex="0"
        :aria-label="t('sessions.openSession', { name: s.name })"
        @click="resumeSession(s.id)"
        @keydown.enter="resumeSession(s.id)"
        @keydown.space.prevent="resumeSession(s.id)"
      >
        <div class="session-info">
          <h3 class="session-name">{{ s.name }}</h3>
          <div class="session-meta">
            #{{ s.myNumber }} · {{ sessionSummary(s) }}
          </div>
          <div class="session-date">{{ formatDate(new Date(s.createdAt), state.locale) }}</div>
        </div>
        <div class="session-actions">
          <button
            class="delete-btn"
            :aria-label="t('sessions.deleteSession', { name: s.name })"
            @click.stop="confirmDelete(s.id)"
          >&#10005;</button>
        </div>
      </div>
    </div>

    <div v-if="state.sessions.length === 0 && !showNewForm && !showOnboarding" class="empty-state">
      {{ t('sessions.emptyState') }}
    </div>

    <button class="about-btn" @click="navigateTo('about')">{{ t('common.about') }}</button>
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
  color: var(--color-primary);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.header-title {
  margin: 0;
  font-family: 'Oswald', sans-serif;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: -1px;
  color: var(--color-primary-dark);
  line-height: 1;
}
.header-tagline {
  margin-top: 8px;
  font-size: 11px;
  letter-spacing: 4px;
  color: var(--color-text-light);
  text-transform: uppercase;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

/* Onboarding */
.onboarding {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: 10px;
  padding: 20px 22px;
  width: 100%;
}
.onboarding-title {
  font-size: 15px;
  font-weight: 900;
  color: var(--color-text);
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
  background: var(--color-primary);
  color: var(--color-surface);
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
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.dismiss-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 6px 16px;
  color: var(--color-text-muted);
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.dismiss-btn:hover {
  background: var(--color-primary-lighter);
  color: var(--color-text-secondary);
}

.tooltip {
  font-size: 12px;
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 6px;
  line-height: 1.4;
}

.storage-warning {
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-primary-light);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 14px;
  text-align: center;
  width: 100%;
  line-height: 1.5;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px 22px;
  width: 100%;
}

.section-label {
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--color-primary);
  margin-bottom: 16px;
  text-transform: uppercase;
}

.label {
  display: block;
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.mt-20 { margin-top: 20px; }
.mt-16 { margin-top: 16px; }

.input {
  display: block;
  width: 100%;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px 14px;
  color: var(--color-text);
  font-family: 'Courier New', Courier, monospace;
  font-size: 18px;
  font-weight: 700;
  outline: none;
  margin-bottom: 4px;
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}

.divider {
  border-top: 1px solid var(--color-border);
  margin: 22px 0;
}

.hint {
  font-size: 11px;
  color: var(--color-text-light);
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
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  color: var(--color-surface);
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
}
.primary-btn:hover {
  background: var(--color-primary-dark);
}

.full-width {
  width: 100%;
  max-width: 520px;
}

.link-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-primary);
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
  border-bottom: 1px solid var(--color-border-light);
  transition: background 0.15s;
}
.session-row:last-child {
  border-bottom: none;
}
.session-row:hover {
  background: var(--color-primary-light);
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
  color: var(--color-primary-dark);
}
.session-meta {
  font-size: 12px;
  color: var(--color-text-muted);
}
.session-date {
  font-size: 11px;
  color: var(--color-text-faded);
}

.session-actions {
  display: flex;
  align-items: center;
}
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-disabled);
  font-size: 14px;
  padding: 4px 8px;
  font-family: inherit;
}
.delete-btn:hover {
  color: var(--color-danger);
}

.empty-state {
  font-size: 13px;
  color: var(--color-text-light);
  text-align: center;
  padding: 40px 0;
}

.help-link {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-faded);
  font-size: 11px;
  font-family: 'Courier New', Courier, monospace;
  text-decoration: underline;
  padding: 0;
}
.help-link:hover {
  color: var(--color-text-muted);
}

.about-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-faded);
  font-size: 11px;
  font-family: 'Courier New', Courier, monospace;
  text-decoration: underline;
  padding: 0;
  margin-top: 8px;
}
.about-btn:hover {
  color: var(--color-text-muted);
}
</style>
