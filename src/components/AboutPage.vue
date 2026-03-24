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
      <div class="section-label">About This App</div>

      <p class="body">
        Queue Watch helps you estimate how long you'll wait in a numbered queue.
        Enter your ticket number, note which number is currently being served,
        and log each new number as it's called. The app calculates the average
        service rate and predicts when your number will be reached.
      </p>

      <div class="sub-heading">How it works</div>
      <ol class="steps">
        <li>Create a <strong>session</strong> — give it a name (like "DMV" or "Bakery") and enter your ticket number along with the current number being served.</li>
        <li>Each time a new number is called, open the session and <strong>log the number</strong>. The timestamp is recorded automatically.</li>
        <li>After two or more logs, Queue Watch computes the <strong>average rate</strong> (seconds per number) and estimates your remaining wait time and ETA.</li>
        <li>A <strong>trend indicator</strong> shows whether the queue is speeding up, slowing down, or holding steady compared to the overall average.</li>
      </ol>

      <div class="sub-heading">Tips</div>
      <ul class="tips">
        <li>The more data points you log, the more accurate the prediction becomes.</li>
        <li>If you missed a call, you can edit the time field when logging to backdate it.</li>
        <li>Click any row in the call history to correct a mistake.</li>
        <li>Use the <strong>24h / 12h</strong> toggle (top-right of the tracker) to switch time format.</li>
      </ul>

      <div class="sub-heading">Data &amp; privacy</div>
      <p class="body">
        All your data is stored <strong>locally in your browser</strong> using
        localStorage. Nothing is sent to any server. No account is needed.
      </p>
      <p class="body warning">
        Clearing your browser's site data or storage will permanently erase all
        your saved sessions. There is no way to recover them.
      </p>

      <div class="sub-heading">Multiple sessions</div>
      <p class="body">
        You can track multiple queues at once — for example, if you're waiting
        at two different counters. Each session is independent and can be
        resumed at any time from the home screen.
      </p>
    </div>

    <div class="footer">
      Built with Vue + TypeScript
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

.back-btn {
  align-self: flex-start;
  background: none;
  border: none;
  cursor: pointer;
  color: #b8860b;
  font-size: 12px;
  font-family: 'Courier New', Courier, monospace;
  padding: 4px 0;
}
.back-btn:hover {
  color: #8a6508;
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
  color: #a0740a;
  line-height: 1;
}

.card {
  background: #fff;
  border: 1px solid #e0d6c2;
  border-radius: 12px;
  padding: 28px 24px;
  width: 100%;
}

.section-label {
  font-size: 11px;
  letter-spacing: 3px;
  color: #b8860b;
  margin-bottom: 18px;
  text-transform: uppercase;
}

.sub-heading {
  font-size: 13px;
  font-weight: 900;
  color: #3a2e1e;
  margin-top: 22px;
  margin-bottom: 8px;
}

.body {
  font-size: 13px;
  color: #5a4a30;
  line-height: 1.65;
  margin-bottom: 4px;
}

.body.warning {
  color: #9a6030;
  background: #fdf8ee;
  border: 1px solid #e8dfc8;
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
  color: #5a4a30;
  line-height: 1.55;
}

.footer {
  font-size: 11px;
  color: #b0a080;
  margin-top: 8px;
}
</style>
