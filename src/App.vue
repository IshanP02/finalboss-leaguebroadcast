<script setup lang="ts">
import { ref } from "vue";
import Scoreboard from "@/components/Scoreboard/Scoreboard.vue";
import GoldGraph from "@/components/GoldGraph/GoldGraph.vue";
import ConnectionStatus from "./components/Debug/ConnectionStatus.vue";
import EventLog from "./components/Debug/EventLog.vue";
import PlayerScoreboard from "./components/PlayerScoreboard/PlayerScoreboard.vue";

const debugVisible = ref(true);
</script>

<template>
  <div class="overlay">
    <Scoreboard class="overlay-scoreboard" />
    <GoldGraph class="overlay-bottom" />
    <PlayerScoreboard class="overlay-playerscoreboard" />

    <!-- Debug panel. Hide me in production! -->
    <div class="debug-wrapper">
      <button class="debug-toggle" @click="debugVisible = !debugVisible">
        {{ debugVisible ? "<" : ">" }} </button>
          <Transition name="debug-slide">
            <div v-if="debugVisible" class="debug">
              <ConnectionStatus class="debug-connection" />
              <EventLog class="debug-eventlog" />
            </div>
          </Transition>
    </div>
  </div>
</template>

<style>
/* Broadcast overlay: transparent, full-viewport, no scrollbars */
@layer base {

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  * {
    --blue-team-color: #3b82f6;
    --red-team-color: #ef4444;
  }
}

html,
body {
  width: 1920px;
  height: 1080px;
  overflow: hidden;
  background: transparent;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  color: #e2e8f0;
}
</style>

<style scoped>
.overlay {
  position: relative;
  width: 1920px;
  height: 1080px;
}

.overlay-scoreboard {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.overlay-bottom {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
}

.overlay-playerscoreboard {
  position: absolute;
  bottom: 0px;
  left: 285px;
  right: 285px;
  height: 260px;
}

.debug-wrapper {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.debug-toggle {
  align-self: flex-start;
  padding: 4px 10px;
  font-size: 11px;
  background: rgba(15, 23, 42, 0.75);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, color 0.15s;
}

.debug-toggle:hover {
  background: rgba(30, 41, 59, 0.9);
  color: #e2e8f0;
}

.debug {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* slide-fade transition */
.debug-slide-enter-active,
.debug-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.debug-slide-enter-from,
.debug-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
