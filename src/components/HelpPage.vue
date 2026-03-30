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
      <h2 class="section-label">{{ t('help.title') }}</h2>

      <p class="body">{{ t('help.intro') }}</p>

      <h3 class="sub-heading">{{ t('help.howItWorksTitle') }}</h3>
      <ol class="steps">
        <li v-html="t('help.step1')"></li>
        <li v-html="t('help.step2')"></li>
        <li v-html="t('help.step3')"></li>
        <li v-html="t('help.step4')"></li>
      </ol>

      <h3 class="sub-heading">{{ t('help.tipsTitle') }}</h3>
      <ul class="tips">
        <li>{{ t('help.tip1') }}</li>
        <li>{{ t('help.tip2') }}</li>
        <li>{{ t('help.tip3') }}</li>
        <li v-html="t('help.tip4')"></li>
      </ul>

      <h3 class="sub-heading">{{ t('help.predictionsTitle') }}</h3>
      <p class="body">{{ t('help.predictionsBody') }}</p>

      <h3 class="sub-heading">{{ t('help.privacyTitle') }}</h3>
      <p class="body" v-html="t('help.privacyBody')"></p>
      <p class="body warning">{{ t('help.privacyWarning') }}</p>

      <h3 class="sub-heading">{{ t('help.multipleTitle') }}</h3>
      <p class="body">{{ t('help.multipleBody') }}</p>

    </div>

    <button class="about-btn" @click="navigateTo('about')">{{ t('common.about') }}</button>

    <div class="footer">
      {{ t('help.footer') }}
    </div>
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

.sub-heading {
  font-size: 13px;
  font-weight: 900;
  color: var(--color-text);
  margin-top: 22px;
  margin-bottom: 8px;
}

.body {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.65;
  margin-bottom: 4px;
}

.body.warning {
  color: var(--color-warning-text);
  background: var(--color-primary-light);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px 12px;
  margin-top: 8px;
}

.steps, .tips {
  padding-left: 20px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.steps li, .tips li {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.55;
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

.footer {
  font-size: 11px;
  color: var(--color-text-faded);
  margin-top: 8px;
}
</style>
