<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import {
  getActiveSession,
  setActiveSession,
  addCall,
  updateCall,
  deleteCall as storeDeleteCall,
  markSessionDone,
} from '../store';
import { formatTime, formatDuration, formatETA, toLocalInputValue, parseInputTime } from '../format';

const session = computed(() => getActiveSession()!);
const now = ref(new Date());

const newCallNum = ref('');
const newCallTime = ref(toLocalInputValue(new Date()));
const useCustomTime = ref(false);
const newCallRef = ref<HTMLInputElement | null>(null);

const editingIdx = ref<number | null>(null);
const editNum = ref('');
const editTime = ref('');

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
    ? `~${Math.round(secPerNum)}s per number`
    : `~${Math.round(secPerNum / 60)}m per number`;

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
}

function startEdit(idx: number) {
  editingIdx.value = idx;
  const c = sortedCalls.value[idx];
  editNum.value = String(c.number);
  editTime.value = toLocalInputValue(new Date(c.timestamp));
}

function saveEdit() {
  const n = parseInt(editNum.value);
  const t = parseInputTime(editTime.value);
  if (isNaN(n) || !t) { editingIdx.value = null; return; }
  // Find the actual index in the original calls array
  const sorted = sortedCalls.value;
  const original = sorted[editingIdx.value!];
  const realIdx = session.value.calls.findIndex(
    c => c.number === original.number && c.timestamp === original.timestamp
  );
  if (realIdx !== -1) updateCall(session.value.id, realIdx, n, t);
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
    <!-- Back button -->
    <button class="back-btn" @click="goBack">&#8592; All Sessions</button>

    <!-- Header -->
    <div class="header">
      <div class="header-sub">Now Serving</div>
      <h1 class="header-title">QUEUE<br />WATCH</h1>
      <div class="header-tagline">{{ session.name }}</div>
    </div>

    <!-- Main tiles -->
    <div class="grid-2">
      <div class="tile accent">
        <div class="tile-label">Your Number</div>
        <div class="tile-value big">{{ session.myNumber }}</div>
      </div>
      <div class="tile">
        <div class="tile-label">Now Serving</div>
        <div class="tile-value big">{{ latestCall?.number ?? '—' }}</div>
      </div>
    </div>

    <!-- Prediction -->
    <div :class="['prediction-card', { done: prediction?.done }]">
      <template v-if="prediction?.done">
        <div class="done-content">
          <div class="done-emoji">&#127881;</div>
          <div class="done-title">YOUR TURN!</div>
          <div class="done-sub">Number {{ session.myNumber }} has been reached</div>
        </div>
      </template>
      <template v-else-if="prediction && 'waiting' in prediction">
        <div class="section-label">Prediction</div>
        <div class="waiting-text">
          {{ prediction.numbersLeft }} number{{ prediction.numbersLeft !== 1 ? 's' : '' }} ahead of you.
        </div>
        <div class="waiting-hint">Log one more call to start predicting.</div>
      </template>
      <template v-else-if="prediction && 'eta' in prediction">
        <div class="section-label">Prediction</div>
        <div class="prediction-main">
          <div>
            <div class="pred-label">Estimated wait</div>
            <div class="pred-wait">{{ formatDuration(prediction.msFromNow) }}</div>
          </div>
          <div class="pred-right">
            <div class="pred-label">Called around</div>
            <div class="pred-eta">{{ formatETA(prediction.eta) }}</div>
          </div>
        </div>
        <div class="pills">
          <span class="pill">{{ prediction.numbersLeft }} ahead</span>
          <span v-if="prediction.rateDisplay" class="pill">{{ prediction.rateDisplay }}</span>
          <span
            v-if="prediction.trend"
            class="pill"
            :style="{ color: prediction.trend === 'faster' ? '#4adf8a' : prediction.trend === 'slower' ? '#df7a4a' : '#b0b0b0' }"
          >
            {{ prediction.trend === 'faster' ? '⚡ speeding up' : prediction.trend === 'slower' ? '🐢 slowing down' : '→ steady pace' }}
          </span>
        </div>
      </template>
    </div>

    <!-- Stats row -->
    <div class="grid-3">
      <div class="tile small">
        <div class="tile-label">Waited</div>
        <div class="tile-value">{{ formatDuration(waitedMs) }}</div>
      </div>
      <div class="tile small">
        <div class="tile-label">Logs</div>
        <div class="tile-value">{{ sortedCalls.length }}</div>
      </div>
      <div class="tile small">
        <div class="tile-label">Joined</div>
        <div class="tile-value">{{ formatTime(new Date(session.joinedAt)) }}</div>
      </div>
    </div>

    <!-- Log new call -->
    <div class="card">
      <div class="section-label">Log a number call</div>
      <div class="log-row">
        <input
          ref="newCallRef"
          class="input num-input"
          type="number"
          :placeholder="`> ${latestCall?.number ?? '?'}`"
          v-model="newCallNum"
          @keydown.enter="handleNewCall"
        />
        <input
          class="input time-input"
          :class="{ dimmed: !useCustomTime }"
          type="datetime-local"
          v-model="newCallTime"
          @input="useCustomTime = true"
        />
        <button class="secondary-btn" @click="handleNewCall">Log</button>
      </div>
      <div class="log-hint">
        <button
          v-if="useCustomTime"
          class="link-btn"
          @click="useCustomTime = false; newCallTime = toLocalInputValue(new Date())"
        >
          &#8592; switch back to current time
        </button>
        <span v-else class="hint-text">
          Time field auto-fills to now — edit it to log a past call
        </span>
      </div>
    </div>

    <!-- Call History -->
    <div class="card history-card">
      <div class="section-label">Call history</div>
      <div class="history-hint">Click any row to edit · &#10005; to delete</div>
      <div class="history-list">
        <template v-for="(c, revI) in [...sortedCalls].reverse()" :key="revI">
          <template v-if="editingIdx === sortedCalls.length - 1 - revI">
            <div class="edit-row">
              <input
                class="input edit-num"
                type="number"
                v-model="editNum"
                @keydown.enter="saveEdit"
                autofocus
              />
              <input
                class="input edit-time"
                type="datetime-local"
                v-model="editTime"
                @keydown.enter="saveEdit"
              />
              <button class="secondary-btn save-btn" @click="saveEdit">Save</button>
              <button class="ghost-btn" @click="editingIdx = null">&#10005;</button>
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
              @click="startEdit(sortedCalls.length - 1 - revI)"
            >
              <div class="history-left">
                <span class="history-num" :class="{ accent: revI === 0 }">#{{ c.number }}</span>
                <span
                  v-if="sortedCalls.length - 1 - revI === 0"
                  class="initial-badge"
                >INITIAL</span>
                <span
                  v-else-if="sortedCalls.length - 1 - revI > 0"
                  class="delta"
                >
                  {{
                    (() => {
                      const idx = sortedCalls.length - 1 - revI;
                      const prev = sortedCalls[idx - 1];
                      const gap = Math.max(c.number - prev.number, 1);
                      return ((c.timestamp - prev.timestamp) / gap / 1000).toFixed(0) + 's/num';
                    })()
                  }}
                </span>
              </div>
              <div class="history-right">
                <span class="history-time">{{ formatTime(new Date(c.timestamp)) }}</span>
                <button
                  v-if="session.calls.length > 1"
                  class="row-delete"
                  @click.stop="handleDeleteCall(sortedCalls.length - 1 - revI)"
                >&#10005;</button>
              </div>
            </div>
          </template>
        </template>
      </div>
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

.back-btn {
  align-self: flex-start;
  background: none;
  border: none;
  cursor: pointer;
  color: #c8902a;
  font-size: 12px;
  font-family: 'Courier New', Courier, monospace;
  padding: 4px 0;
  margin-bottom: -8px;
}
.back-btn:hover {
  color: #f5c842;
}

.header {
  text-align: center;
  margin-bottom: 4px;
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
  background: rgba(255,200,80,0.05);
  border: 1px solid rgba(200,144,42,0.2);
  border-radius: 10px;
  padding: 18px 20px;
  text-align: center;
}
.tile.accent {
  border-color: rgba(245,200,66,0.4);
}
.tile.small {
  padding: 12px 14px;
}
.tile-label {
  font-size: 10px;
  letter-spacing: 3px;
  color: #7a5c2a;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.tile-value {
  font-weight: 900;
  color: #f5e6c8;
  line-height: 1;
  word-break: break-all;
  font-size: 16px;
}
.tile-value.big {
  font-size: 42px;
}
.tile.accent .tile-value {
  color: #f5c842;
}

.prediction-card {
  background: rgba(255,200,80,0.06);
  border: 1px solid rgba(200,144,42,0.35);
  border-radius: 12px;
  padding: 24px 22px;
  width: 100%;
}
.prediction-card.done {
  background: rgba(80,200,80,0.08);
  border-color: rgba(80,200,80,0.4);
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
  color: #80e880;
  letter-spacing: 2px;
}
.done-sub {
  font-size: 12px;
  color: #7a5c2a;
  margin-top: 6px;
}

.section-label {
  font-size: 11px;
  letter-spacing: 3px;
  color: #c8902a;
  margin-bottom: 16px;
  text-transform: uppercase;
}

.waiting-text {
  font-size: 14px;
  color: #a07840;
}
.waiting-hint {
  font-size: 12px;
  color: #7a5c2a;
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
  color: #7a5c2a;
  margin-bottom: 4px;
}
.pred-wait {
  font-size: 32px;
  font-weight: 900;
  color: #f5c842;
  line-height: 1;
}
.pred-right {
  text-align: right;
}
.pred-eta {
  font-size: 22px;
  font-weight: 700;
  color: #f5e6c8;
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
  background: rgba(200,144,42,0.12);
  border: 1px solid rgba(200,144,42,0.25);
  color: #c8902a;
  white-space: nowrap;
}

.card {
  background: rgba(255,200,80,0.04);
  border: 1px solid rgba(200,144,42,0.25);
  border-radius: 12px;
  padding: 24px 22px;
  width: 100%;
}
.history-card {
  padding: 20px 22px;
}

.log-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
  flex-wrap: wrap;
}

.input {
  display: block;
  background: rgba(255,200,80,0.06);
  border: 1px solid rgba(200,144,42,0.35);
  border-radius: 8px;
  padding: 12px 14px;
  color: #f5e6c8;
  font-family: 'Courier New', Courier, monospace;
  font-size: 18px;
  font-weight: 700;
  outline: none;
  color-scheme: dark;
}

.num-input {
  width: 90px;
  flex: 0 0 90px;
  font-size: 16px;
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
  background: rgba(245,200,66,0.15);
  border: 1px solid rgba(245,200,66,0.4);
  border-radius: 8px;
  color: #f5c842;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  white-space: nowrap;
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
  color: #c8902a;
  font-size: 11px;
  font-family: 'Courier New', Courier, monospace;
  text-decoration: underline;
  padding: 0;
}
.hint-text {
  font-size: 11px;
  color: #5a3a1a;
}

.history-hint {
  font-size: 11px;
  color: #5a3a1a;
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
  border-bottom: 1px solid rgba(200,144,42,0.08);
  transition: background 0.15s;
}
.history-row:last-child {
  border-bottom: none;
}
.history-row:hover {
  background: rgba(255,200,80,0.06);
}
.history-row.initial {
  opacity: 0.75;
}
.history-row.mid {
  opacity: 0.55;
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
  color: #a07840;
}
.history-num.accent {
  color: #f5c842;
}
.initial-badge {
  font-size: 10px;
  letter-spacing: 1px;
  color: #5a3a1a;
  border: 1px solid rgba(200,144,42,0.2);
  border-radius: 4px;
  padding: 1px 5px;
}
.delta {
  font-size: 11px;
  color: #6a4a1a;
}

.history-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.history-time {
  font-size: 11px;
  color: #7a5c2a;
}
.row-delete {
  background: none;
  border: none;
  cursor: pointer;
  color: #4a2a0a;
  font-size: 13px;
  padding: 0 2px;
  font-family: inherit;
}
.row-delete:hover {
  color: #df7a4a;
}

.edit-row {
  background: rgba(245,200,66,0.07);
  border: 1px solid rgba(245,200,66,0.3);
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
  background: rgba(255,100,80,0.1);
  border: 1px solid rgba(255,100,80,0.2);
  border-radius: 6px;
  color: #df7a4a;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  cursor: pointer;
}
</style>
