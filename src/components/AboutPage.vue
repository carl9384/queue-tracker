<script setup lang="ts">
import { navigateTo } from '../store';
</script>

<template>
  <div class="container">
    <button class="back-btn" @click="navigateTo('sessions')">&#8592; Back</button>

    <div class="header">
      <h1 class="header-title">QUEUE<br />WATCH</h1>
    </div>

    <div class="card">
      <div class="section-label">About</div>

      <p class="body">
        This application was conceived of while waiting in the Farmácia Alto Custo
        — Unidade Várzea do Carmo. Much love and respect for the team at Várzea do
        Carmo, SPDM in São Paulo, healthcare providers all over Brazil, and for SUS!
      </p>
    </div>

    <figure class="sus-figure">
      <img src="/eu-defendo-o-sus.jpg" alt="Eu Defendo o SUS — Sistema Único de Saúde" class="sus-img" />
      <figcaption class="sus-caption">
        Image by <a href="https://mapamovsaude.net.br/" target="_blank" rel="noopener noreferrer">Mapa de Movimentos pela Saúde</a>,
        licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
      </figcaption>
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

.back-btn {
  align-self: flex-start;
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
.sus-caption a {
  color: var(--color-primary);
}
</style>
