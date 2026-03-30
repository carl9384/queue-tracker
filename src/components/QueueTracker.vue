<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  getState,
  getActiveSession,
  setActiveSession,
  addCall,
  updateCall,
  deleteCall as storeDeleteCall,
  markSessionDone,
  toggleTimeFormat,
  navigateTo,
} from '../store';
import { formatTime, formatDuration, formatETA, toLocalInputValue, parseInputTime } from '../format';
import LanguageSwitcher from './LanguageSwitcher.vue';

const { t } = useI18n();
const state = getState();
const session = computed(() => getActiveSession()!);
const use24Hour = computed(() => state.use24Hour);
const locale = computed(() => state.locale);
const now = ref(new Date());

const newCallNum = ref('');
const newCallTime = ref(toLocalInputValue(new Date()));
const useCustomTime = ref(false);
const newCallRef = ref<HTMLInputElement | null>(null);

const editingIdx = ref<number | null>(null);
const editNum = ref('');
const editTime = ref('');

const showLogTooltip = ref(true);

let timer: ReturnType<typeof setInterval>;

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
    if (!useCustomTime.value) newCallTime.value = toLocalInputValue(new Date());
  }, 1000);
  nextTick(() => newCallRef.value?.focus());
});

onUnmounted(() => clearInterval(timer));

const sortedCalls = computed(() =>
  [...session.value.calls].sort((a, b) => a.timestamp - b.timestamp)
);

const latestCall = computed(() => {
  const s = sortedCalls.value;
  return s[s.length - 1] ?? null;
});

const prediction = computed(() => {
  const s = session.value;
  const sorted = sortedCalls.value;
  if (sorted.length < 1 || !s.myNumber) return null;

  const latest = sorted[sorted.length - 1];
  const numbersLeft = s.myNumber - latest.number;

  if (numbersLeft <= 0) {
    if (!s.done) markSessionDone(s.id);
    return { done: true } as const;
  }

  if (sorted.length < 2) {
    return { waiting: true, numbersLeft } as const;
  }

  const first = sorted[0];
  const elapsedMs = latest.timestamp - first.timestamp;
  const totalNums = latest.number - first.number;
  if (totalNums <= 0 || elapsedMs <= 0) return { waiting: true, numbersLeft } as const;

  const overallRate = totalNums / elapsedMs;

  let recentRate = overallRate;
  if (sorted.length >= 3) {
    const prev = sorted[sorted.length - 2];
    const recentMs = latest.timestamp - prev.timestamp;
    const recentNums = latest.number - prev.number;
    if (recentNums > 0 && recentMs > 0) {
      recentRate = recentNums / recentMs;
    }
  }

  const msLeft = numbersLeft / overallRate;
  const eta = new Date(latest.timestamp + msLeft);
  const msFromNow = eta.getTime() - now.value.getTime();

  let trend: 'faster' | 'slower' | 'steady' | null = null;
  if (sorted.length >= 3) {
    const ratio = recentRate / overallRate;
    if (ratio > 1.25) trend = 'faster';
    else if (ratio < 0.75) trend = 'slower';
    else trend = 'steady';
  }

  const secPerNum = 1 / (overallRate * 1000);
  const rateDisplay = secPerNum < 60
    ? t('tracker.rateSeconds', { n: Math.round(secPerNum) })
    : t('tracker.rateMinutes', { n: Math.round(secPerNum / 60) });

  return { eta, msFromNow, numbersLeft, trend, rateDisplay } as const;
});

const waitedMs = computed(() => now.value.getTime() - session.value.joinedAt);

function handleNewCall() {
  const n = parseInt(newCallNum.value);
  if (isNaN(n) || !latestCall.value) return;
  const sortedByNum = [...session.value.calls].sort((a, b) => a.number - b.number);
  const last = sortedByNum[sortedByNum.length - 1];
  if (n <= last.number) return;
  const ts = useCustomTime.value ? (parseInputTime(newCallTime.value) ?? Date.now()) : Date.now();
  addCall(session.value.id, n, ts);
  newCallNum.value = '';
  if (!useCustomTime.value) newCallTime.value = toLocalInputValue(new Date());
  newCallRef.value?.focus();
  showLogTooltip.value = false;
}

function startEdit(idx: number) {
  editingIdx.value = idx;
  const c = sortedCalls.value[idx];
  editNum.value = String(c.number);
  editTime.value = toLocalInputValue(new Date(c.timestamp));
}

function saveEdit() {
  const n = parseInt(editNum.value);
  const ts = parseInputTime(editTime.value);
  if (isNaN(n) || !ts) { editingIdx.value = null; return; }
  const sorted = sortedCalls.value;
  const original = sorted[editingIdx.value!];
  const realIdx = session.value.calls.findIndex(
    c => c.number === original.number && c.timestamp === original.timestamp
  );
  if (realIdx !== -1) updateCall(session.value.id, realIdx, n, ts);
  editingIdx.value = null;
}

function handleDeleteCall(idx: number) {
  if (session.value.calls.length <= 1) return;
  const sorted = sortedCalls.value;
  const original = sorted[idx];
  const realIdx = session.value.calls.findIndex(
    c => c.number === original.number && c.timestamp === original.timestamp
  );
  if (realIdx !== -1) storeDeleteCall(session.value.id, realIdx);
}

function goBack() {
  setActiveSession(null);
}
</script>

<template>
  <div class="container">
    <!-- Top bar -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">&#8592; {{ t('tracker.allSessions') }}</button>
      <div class="time-toggle-group">
        <span class="time-toggle-label">{{ t('tracker.toggleTimeFormat') }}</span>
        <button class="time-toggle" @click="toggleTimeFormat">
          {{ use24Hour ? '24H' : '12H' }}
        </button>
      </div>
    </div>

    <!-- Header -->
    <div class="header">
      <div class="header-sub">{{ t('header.nowServing') }}</div>
      <h1 class="header-title">{{ t('header.appName') }}</h1>
      <div class="header-tagline">{{ session.name }}</div>
    </div>

    <!-- Main tiles -->
    <div class="grid-2">
      <div class="tile accent">
        <div class="tile-label">{{ t('tracker.yourNumber') }}</div>
        <div class="tile-value big">{{ session.myNumber }}</div>
      </div>
      <div class="tile">
        <div class="tile-label">{{ t('tracker.nowServing') }}</div>
        <div class="tile-value big">{{ latestCall?.number ?? '—' }}</div>
      </div>
    </div>

    <!-- Prediction -->
    <div :class="['prediction-card', { done: prediction?.done }]">
      <template v-if="prediction?.done">
        <div class="done-content">
          <div class="done-emoji" aria-hidden="true">&#127881;</div>
          <div class="done-title">{{ t('tracker.yourTurn') }}</div>
          <div class="done-sub">{{ t('tracker.numberReached', { n: session.myNumber }) }}</div>
        </div>
      </template>
      <template v-else-if="prediction && 'waiting' in prediction">
        <h2 class="section-label">{{ t('tracker.prediction') }}</h2>
        <div class="waiting-text">
          {{ t('tracker.numbersAhead', prediction.numbersLeft) }}
        </div>
        <div class="waiting-hint">{{ t('tracker.waitingHint') }}</div>
      </template>
      <template v-else-if="prediction && 'eta' in prediction">
        <h2 class="section-label">{{ t('tracker.prediction') }}</h2>
        <div class="prediction-main">
          <div>
            <div class="pred-label">{{ t('tracker.estimatedWait') }}</div>
            <div class="pred-wait">{{ formatDuration(prediction.msFromNow) }}</div>
          </div>
          <div class="pred-right">
            <div class="pred-label">{{ t('tracker.calledAround') }}</div>
            <div class="pred-eta">{{ formatETA(prediction.eta, use24Hour, locale) }}</div>
          </div>
        </div>
        <div class="pills">
          <span class="pill">{{ t('tracker.ahead', { n: prediction.numbersLeft }) }}</span>
          <span v-if="prediction.rateDisplay" class="pill">{{ prediction.rateDisplay }}</span>
          <span
            v-if="prediction.trend"
            class="pill"
            :class="prediction.trend"
          >
            {{ prediction.trend === 'faster' ? t('tracker.speedingUp') : prediction.trend === 'slower' ? t('tracker.slowingDown') : t('tracker.steadyPace') }}
          </span>
        </div>
      </template>
    </div>

    <!-- Stats row -->
    <div class="grid-3">
      <div class="tile small">
        <div class="tile-label">{{ t('tracker.waited') }}</div>
        <div class="tile-value">{{ formatDuration(waitedMs) }}</div>
      </div>
      <div class="tile small">
        <div class="tile-label">{{ t('tracker.logs') }}</div>
        <div class="tile-value">{{ sortedCalls.length }}</div>
      </div>
      <div class="tile small">
        <div class="tile-label">{{ t('tracker.joined') }}</div>
        <div class="tile-value">{{ formatTime(new Date(session.joinedAt), use24Hour, locale) }}</div>
      </div>
    </div>

    <!-- Log new call -->
    <div class="card">
      <h2 class="section-label">{{ t('callLog.title') }}</h2>
      <div v-if="showLogTooltip && sortedCalls.length <= 1" class="tooltip">
        {{ t('callLog.tooltip') }}
      </div>
      <div class="log-row">
        <input
          ref="newCallRef"
          class="input num-input"
          :class="{ glow: !prediction?.done }"
          type="number"
          :aria-label="t('callLog.numberLabel')"
          :placeholder="`> ${latestCall?.number ?? '?'}`"
          v-model="newCallNum"
          @keydown.enter="handleNewCall"
        />
        <input
          class="input time-input"
          :class="{ dimmed: !useCustomTime }"
          type="datetime-local"
          :aria-label="t('callLog.timeLabel')"
          v-model="newCallTime"
          @input="useCustomTime = true"
        />
        <button class="secondary-btn" @click="handleNewCall">{{ t('common.log') }}</button>
      </div>
      <div class="log-hint">
        <button
          v-if="useCustomTime"
          class="link-btn"
          @click="useCustomTime = false; newCallTime = toLocalInputValue(new Date())"
        >
          &#8592; {{ t('callLog.switchBackToNow') }}
        </button>
        <span v-else class="hint-text">
          {{ t('callLog.timeAutoFill') }}
        </span>
      </div>
    </div>

    <!-- Call History -->
    <div class="card history-card">
      <h2 class="section-label">{{ t('callLog.historyTitle') }}</h2>
      <div class="history-hint">{{ t('callLog.historyHint') }}</div>
      <div class="history-list">
        <template v-for="(c, revI) in [...sortedCalls].reverse()" :key="revI">
          <template v-if="editingIdx === sortedCalls.length - 1 - revI">
            <div class="edit-row">
              <input
                class="input edit-num"
                type="number"
                :aria-label="t('callLog.editNumber')"
                v-model="editNum"
                @keydown.enter="saveEdit"
                autofocus
              />
              <input
                class="input edit-time"
                type="datetime-local"
                :aria-label="t('callLog.editTime')"
                v-model="editTime"
                @keydown.enter="saveEdit"
              />
              <button class="secondary-btn save-btn" @click="saveEdit">{{ t('common.save') }}</button>
              <button class="ghost-btn" :aria-label="t('callLog.cancelEditing')" @click="editingIdx = null">&#10005;</button>
            </div>
          </template>
          <template v-else>
            <div
              class="history-row"
              :class="{
                latest: revI === 0,
                initial: sortedCalls.length - 1 - revI === 0,
                mid: revI !== 0 && sortedCalls.length - 1 - revI !== 0,
              }"
              role="button"
              tabindex="0"
              :aria-label="t('callLog.editCallNumber', { n: c.number })"
              @click="startEdit(sortedCalls.length - 1 - revI)"
              @keydown.enter="startEdit(sortedCalls.length - 1 - revI)"
              @keydown.space.prevent="startEdit(sortedCalls.length - 1 - revI)"
            >
              <div class="history-left">
                <span class="history-num" :class="{ accent: revI === 0 }">#{{ c.number }}</span>
                <span
                  v-if="sortedCalls.length - 1 - revI === 0"
                  class="initial-badge"
                >{{ t('callLog.initial') }}</span>
                <span
                  v-else-if="sortedCalls.length - 1 - revI > 0"
                  class="delta"
                >
                  {{
                    (() => {
                      const idx = sortedCalls.length - 1 - revI;
                      const prev = sortedCalls[idx - 1];
                      const gap = Math.max(c.number - prev.number, 1);
                      return t('tracker.sPerNum', { n: ((c.timestamp - prev.timestamp) / gap / 1000).toFixed(0) });
                    })()
                  }}
                </span>
              </div>
              <div class="history-right">
                <span class="history-time">{{ formatTime(new Date(c.timestamp), use24Hour, locale) }}</span>
                <button
                  v-if="session.calls.length > 1"
                  class="row-delete"
                  :aria-label="t('callLog.deleteCallNumber', { n: c.number })"
                  @click.stop="handleDeleteCall(sortedCalls.length - 1 - revI)"
                >&#10005;</button>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>

    <button class="about-btn" @click="navigateTo('about')">{{ t('common.about') }}</button>
    <LanguageSwitcher />
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

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: -8px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-primary);
  font-size: 12px;
  font-family: 'Courier New', Courier, monospace;
  padding: 4px 0;
}
.back-btn:hover {
  color: var(--color-primary-darker);
}

.time-toggle-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.time-toggle-label {
  font-size: 11px;
  color: var(--color-text-light);
}
.time-toggle {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 4px 10px;
  color: var(--color-text-muted);
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
}
.time-toggle:hover {
  background: var(--color-primary-light);
  color: var(--color-text-secondary);
  border-color: var(--color-primary);
}

.header {
  text-align: center;
  margin-bottom: 4px;
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

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  width: 100%;
}

.tile {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 18px 20px;
  text-align: center;
}
.tile.accent {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
.tile.small {
  padding: 12px 14px;
}
.tile-label {
  font-size: 10px;
  letter-spacing: 3px;
  color: var(--color-text-light);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.tile-value {
  font-weight: 900;
  color: var(--color-text);
  line-height: 1;
  word-break: break-all;
  font-size: 16px;
}
.tile-value.big {
  font-size: 42px;
}
.tile.accent .tile-value {
  color: var(--color-primary-dark);
}

.prediction-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px 22px;
  width: 100%;
}
.prediction-card.done {
  background: var(--color-success-bg);
  border-color: var(--color-success-border);
}

.done-content {
  text-align: center;
}
.done-emoji {
  font-size: 36px;
  margin-bottom: 8px;
}
.done-title {
  font-size: 22px;
  font-weight: 900;
  color: var(--color-success);
  letter-spacing: 2px;
}
.done-sub {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 6px;
}

.section-label {
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--color-primary);
  margin-bottom: 16px;
  text-transform: uppercase;
}

.waiting-text {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.waiting-hint {
  font-size: 12px;
  color: var(--color-text-light);
  margin-top: 6px;
}

.prediction-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}
.pred-label {
  font-size: 11px;
  color: var(--color-text-light);
  margin-bottom: 4px;
}
.pred-wait {
  font-size: 32px;
  font-weight: 900;
  color: var(--color-primary-dark);
  line-height: 1;
}
.pred-right {
  text-align: right;
}
.pred-eta {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
}

.pills {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.pill {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--color-primary-light);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  white-space: nowrap;
}
.pill.faster {
  color: var(--color-success-light);
  background: var(--color-success-bg);
  border-color: var(--color-success-border-light);
}
.pill.slower {
  color: var(--color-danger-text);
  background: var(--color-danger-bg);
  border-color: var(--color-danger-border);
}
.pill.steady {
  color: var(--color-neutral);
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px 22px;
  width: 100%;
}
.history-card {
  padding: 20px 22px;
}

.tooltip {
  font-size: 12px;
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  line-height: 1.4;
}

.log-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
  flex-wrap: wrap;
}

.input {
  display: block;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px 14px;
  color: var(--color-text);
  font-family: 'Courier New', Courier, monospace;
  font-size: 18px;
  font-weight: 700;
  outline: none;
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}

.num-input {
  width: 90px;
  flex: 0 0 90px;
  font-size: 16px;
}
.num-input.glow {
  animation: subtle-glow 2s ease-in-out infinite;
  border-color: var(--color-primary);
}
@keyframes subtle-glow {
  0%, 100% {
    box-shadow: 0 0 4px 1px rgba(58, 32, 16, 0.12);
  }
  50% {
    box-shadow: 0 0 14px 4px rgba(58, 32, 16, 0.28);
  }
}
.time-input {
  flex: 1;
  min-width: 160px;
  font-size: 13px;
  transition: opacity 0.2s;
}
.time-input.dimmed {
  opacity: 0.4;
}

.secondary-btn {
  padding: 12px 18px;
  background: var(--color-primary-light);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-primary-dark);
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  white-space: nowrap;
}
.secondary-btn:hover {
  background: var(--color-primary-lighter);
  border-color: var(--color-primary);
}

.log-hint {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.link-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-primary);
  font-size: 11px;
  font-family: 'Courier New', Courier, monospace;
  text-decoration: underline;
  padding: 0;
}
.hint-text {
  font-size: 11px;
  color: var(--color-text-faded);
}

.history-hint {
  font-size: 11px;
  color: var(--color-text-faded);
  margin-bottom: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 8px;
  border-radius: 6px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-light);
  transition: background 0.15s;
}
.history-row:last-child {
  border-bottom: none;
}
.history-row:hover {
  background: var(--color-primary-light);
}
.history-row.initial {
  opacity: 0.65;
}
.history-row.mid {
  opacity: 0.5;
}

.history-left {
  display: flex;
  gap: 12px;
  align-items: center;
}
.history-num {
  font-size: 17px;
  font-weight: 900;
  min-width: 34px;
  color: var(--color-text-muted);
}
.history-num.accent {
  color: var(--color-primary-dark);
}
.initial-badge {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--color-text-faded);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 1px 5px;
}
.delta {
  font-size: 11px;
  color: var(--color-text-faded);
}

.history-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.history-time {
  font-size: 11px;
  color: var(--color-text-light);
}
.row-delete {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-disabled);
  font-size: 13px;
  padding: 0 2px;
  font-family: inherit;
}
.row-delete:hover {
  color: var(--color-danger);
}

.edit-row {
  background: var(--color-primary-light);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.edit-num {
  width: 80px;
  flex: 0 0 80px;
  font-size: 15px;
  padding: 7px 10px;
}
.edit-time {
  flex: 1;
  min-width: 160px;
  font-size: 12px;
  padding: 7px 10px;
}
.save-btn {
  padding: 8px 14px;
  font-size: 12px;
}
.ghost-btn {
  padding: 7px 10px;
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  border-radius: 6px;
  color: var(--color-danger);
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  cursor: pointer;
}
.ghost-btn:hover {
  background: var(--color-danger-bg-hover);
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
