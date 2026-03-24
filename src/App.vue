<script setup lang="ts">
import { computed } from 'vue';
import { getState } from './store';
import SessionList from './components/SessionList.vue';
import QueueTracker from './components/QueueTracker.vue';
import AboutPage from './components/AboutPage.vue';

const state = getState();
const view = computed(() => state.currentView);
</script>

<template>
  <SessionList v-if="view === 'sessions'" />
  <QueueTracker v-else-if="view === 'tracker'" />
  <AboutPage v-else-if="view === 'about'" />
</template>
