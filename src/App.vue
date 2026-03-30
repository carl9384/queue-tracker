<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { getState } from './store';
import SessionList from './components/SessionList.vue';
import QueueTracker from './components/QueueTracker.vue';
import HelpPage from './components/HelpPage.vue';
import AboutPage from './components/AboutPage.vue';

const { t } = useI18n();
const state = getState();
const view = computed(() => state.currentView);

watchEffect(() => {
  document.title = t('header.pageTitle');
});
</script>

<template>
  <SessionList v-if="view === 'sessions'" />
  <QueueTracker v-else-if="view === 'tracker'" />
  <HelpPage v-else-if="view === 'help'" />
  <AboutPage v-else-if="view === 'about'" />
</template>
