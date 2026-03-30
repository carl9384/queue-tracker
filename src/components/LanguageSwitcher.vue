<script setup lang="ts">
import { computed } from 'vue';
import { getState, setLocale } from '../store';

const state = getState();
const isEn = computed(() => state.locale === 'en-US');

function toggle() {
  setLocale(isEn.value ? 'pt-BR' : 'en-US');
}
</script>

<template>
  <button class="lang-toggle" @click="toggle" :aria-label="isEn ? 'Mudar para Português' : 'Switch to English'">
    {{ isEn ? 'PT' : 'EN' }}
  </button>
</template>

<style scoped>
.lang-toggle {
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
.lang-toggle:hover {
  background: var(--color-primary-light);
  color: var(--color-text-secondary);
  border-color: var(--color-primary);
}
</style>
