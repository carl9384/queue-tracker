<script setup lang="ts">
import { getState, setLocale } from '../store';
import type { SupportedLocale } from '../i18n';

const state = getState();

const localeLabels: Record<SupportedLocale, string> = {
  'en-US': 'English',
  'pt-BR': 'Português',
};

function onChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as SupportedLocale;
  setLocale(value);
}
</script>

<template>
  <div class="lang-switcher">
    <select
      class="lang-select"
      :value="state.locale"
      @change="onChange"
      aria-label="Language"
    >
      <option value="en-US">{{ localeLabels['en-US'] }}</option>
      <option value="pt-BR">{{ localeLabels['pt-BR'] }}</option>
    </select>
  </div>
</template>

<style scoped>
.lang-switcher {
  margin-top: 8px;
}
.lang-select {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 4px 8px;
  color: var(--color-text-muted);
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
}
.lang-select:hover {
  background: var(--color-primary-light);
  color: var(--color-text-secondary);
  border-color: var(--color-primary);
}
.lang-select:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}
</style>
