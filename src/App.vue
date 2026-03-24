<script setup lang="ts">
import { computed } from 'vue';
import { getState } from './store';
import SessionList from './components/SessionList.vue';
import QueueTracker from './components/QueueTracker.vue';

const state = getState();
const hasActiveSession = computed(() => state.activeSessionId !== null && state.sessions.some(s => s.id === state.activeSessionId));
</script>

<template>
  <SessionList v-if="!hasActiveSession" />
  <QueueTracker v-else />
</template>
