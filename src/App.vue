<script setup lang="ts">
import { computed } from 'vue';
import { getState } from './store';
import SessionList from './components/SessionList.vue';
import QueueTracker from './components/QueueTracker.vue';
import HelpPage from './components/HelpPage.vue';
import AboutPage from './components/AboutPage.vue';

const state = getState();
const view = computed(() => state.currentView);
</script>

<template>
  <SessionList v-if="view === 'sessions'" />
  <QueueTracker v-else-if="view === 'tracker'" />
  <HelpPage v-else-if="view === 'help'" />
  <AboutPage v-else-if="view === 'about'" />
</template>
