<script setup lang="ts">
import {
  computed,
  ref,
  onUnmounted,
} from "vue";

import { useClient } from "@/client";

import {
  usePostGameData,
  usePostGameOverview,
  useIsPostGameActive,
  usePostGameStatsVersion,
} from "@/composables/usePostGame";

const client = useClient();

const postgame = usePostGameData();
const overview = usePostGameOverview();
const isActive = useIsPostGameActive();
const statsVersion = usePostGameStatsVersion();

const connected = ref(client.isPostGameConnected());

const unsubscribeConnect = client.onPostGameConnect(() => {
  connected.value = true;
});

const unsubscribeDisconnect = client.onPostGameDisconnect(() => {
  connected.value = false;
});

onUnmounted(() => {
  unsubscribeConnect();
  unsubscribeDisconnect();
});

const activeComponent = computed(
  () => postgame.value.activeComponent ?? null
);

const isMocking = computed(
  () => postgame.value.isMocking === true
);

const rawData = computed(() =>
  JSON.stringify(postgame.value, null, 2)
);

const rawOverview = computed(() =>
  JSON.stringify(overview.value, null, 2)
);

const gameId = ref("");
const loading = ref(false);
const errorMessage = ref("");
const showFullState = ref(false);

async function loadPostgame() {
  loading.value = true;
  errorMessage.value = "";

  try {
    if (gameId.value.trim()) {
      const id = Number(gameId.value);

      if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Enter a valid numeric game ID.");
      }

      await client.showPostGame(id);
    } else {
      await client.showPostGame();
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : String(error);

    console.error("[FBE Postgame] Load failed:", error);
  } finally {
    loading.value = false;
  }
}

async function refreshPostgame() {
  loading.value = true;
  errorMessage.value = "";

  try {
    await client.refreshPostGame();
  } catch (error) {
    errorMessage.value = String(error);
  } finally {
    loading.value = false;
  }
}

function hidePostgame() {
  client.hidePostGame();
}
</script>

<template>
  <div class="pg-debug">
    <header class="debug-header">
      <div>
        <div class="eyebrow">FINAL BOSS ESPORTS</div>
        <h1>Postgame Diagnostics</h1>
      </div>

      <div
        class="connection"
        :class="{ connected }"
      >
        {{ connected ? "CONNECTED" : "DISCONNECTED" }}
      </div>
    </header>

    <div class="status-grid">
      <div class="status-card">
        <span>Postgame active</span>
        <strong>{{ isActive ? "YES" : "NO" }}</strong>
      </div>

      <div class="status-card">
        <span>Mocking</span>
        <strong>{{ isMocking ? "YES" : "NO" }}</strong>
      </div>

      <div class="status-card">
        <span>Overview available</span>
        <strong>{{ overview ? "YES" : "NO" }}</strong>
      </div>

      <div class="status-card">
        <span>Stats version</span>
        <strong>{{ statsVersion }}</strong>
      </div>

      <div class="status-card">
        <span>Active component</span>
        <strong>
          {{ activeComponent?.componentName ?? "None" }}
        </strong>
      </div>

      <div class="status-card">
        <span>Game ID</span>
        <strong>
          {{
            activeComponent?.gameId ??
            postgame.gameId ??
            "None"
          }}
        </strong>
      </div>

      <div class="status-card">
        <span>Player index</span>
        <strong>
          {{ activeComponent?.playerIndex ?? "None" }}
        </strong>
      </div>
    </div>

    <div class="controls">
      <input
        v-model="gameId"
        placeholder="Game ID (optional)"
      />

      <button
        :disabled="loading"
        @click="loadPostgame"
      >
        {{ loading ? "Loading..." : "Load postgame" }}
      </button>

      <button
        :disabled="loading"
        @click="refreshPostgame"
      >
        Refresh
      </button>

      <button @click="hidePostgame">
        Hide
      </button>
    </div>

    <div v-if="errorMessage" class="error">
      {{ errorMessage }}
    </div>

    <div class="json-heading">
      <h2>
        {{ showFullState ? "Full State" : "Game Overview" }}
      </h2>

      <button @click="showFullState = !showFullState">
        {{ showFullState ? "Show Overview" : "Show Full State" }}
      </button>
    </div>

    <pre class="json-output">{{
      showFullState ? rawData : rawOverview
    }}</pre>
  </div>
</template>

<style scoped>
.pg-debug {
  position: absolute;
  inset: 0;
  width: 1920px;
  height: 1080px;

  padding: 45px;

  display: flex;
  flex-direction: column;
  gap: 22px;

  background:
    radial-gradient(
      ellipse at top right,
      #3b050b,
      transparent 55%
    ),
    #08080a;

  color: #f5f0eb;
  font-family: "Inter", sans-serif;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #b11226;
  padding-bottom: 20px;
}

.eyebrow {
  color: #ff263f;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 5px;
}

h1 {
  font-size: 42px;
  font-weight: 800;
}

h2 {
  font-size: 24px;
  font-weight: 700;
}

.connection {
  padding: 14px 24px;
  background: #300c12;
  border: 1px solid #ff263f;
  color: #ff7382;
  font-size: 18px;
  font-weight: 700;
}

.connection.connected {
  background: #09251a;
  border-color: #24b879;
  color: #53e5a3;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.status-card {
  padding: 18px;
  background: #141014;
  border: 1px solid #55202a;

  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-card span {
  font-size: 15px;
  color: #aaa0a0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.status-card strong {
  font-size: 23px;
  overflow-wrap: anywhere;
}

.controls {
  display: flex;
  gap: 12px;
}

input,
button {
  padding: 12px 20px;
  font-size: 18px;
  font-weight: 600;
  border: 1px solid #772432;
  color: #f5f0eb;
}

input {
  background: #141014;
  width: 320px;
  outline: none;
}

button {
  background: #7a1020;
  cursor: pointer;
}

button:hover {
  background: #b11226;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  padding: 12px;
  color: #ff8996;
  background: #300c12;
  border: 1px solid #ff263f;
}

.json-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.json-output {
  flex: 1;
  min-height: 0;
  overflow: auto;

  padding: 20px;
  background: #030305;
  border: 1px solid #55202a;

  font-family: monospace;
  font-size: 16px;
  line-height: 1.5;
  color: #c9e3d4;

  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>