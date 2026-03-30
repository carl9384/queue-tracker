<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { navigateTo } from '../store';
import LanguageSwitcher from './LanguageSwitcher.vue';

const { t } = useI18n();
</script>

<template>
  <div class="container">
    <div class="top-bar">
      <button class="back-btn" @click="navigateTo('sessions')">&#8592; {{ t('common.back') }}</button>
      <LanguageSwitcher />
    </div>

    <div class="header">
      <h1 class="header-title">{{ t('header.appName') }}</h1>
    </div>

    <div class="card">
      <h2 class="section-label">{{ t('about.title') }}</h2>

      <p class="body">{{ t('about.body') }}</p>
    </div>

    <figure class="sus-figure">
      <img src="/eu-defendo-o-sus.jpg" :alt="t('about.imageAlt')" class="sus-img" />
      <figcaption class="sus-caption" v-html="t('about.imageCaption')"></figcaption>
    </figure>
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

.header {
  text-align: center;
  margin-bottom: 4px;
}
.header-title {
  margin: 0;
  font-family: 'Oswald', sans-serif;
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -1px;
  color: var(--color-primary-dark);
  line-height: 1;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 28px 24px;
  width: 100%;
}

.section-label {
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--color-primary);
  margin-bottom: 18px;
  text-transform: uppercase;
}

.body {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.65;
  margin-bottom: 4px;
}

.sus-figure {
  width: 100%;
  text-align: center;
}
.sus-img {
  max-width: 280px;
  width: 100%;
  border-radius: 8px;
}
.sus-caption {
  font-size: 10px;
  color: var(--color-text-faded);
  margin-top: 8px;
  line-height: 1.5;
}
.sus-caption :deep(a) {
  color: var(--color-primary);
}
</style>
