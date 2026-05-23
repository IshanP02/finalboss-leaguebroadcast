<script setup lang="ts">
import { BestOfType } from "@bluebottle_gg/league-broadcast-client";

defineProps<{
  bestOf: BestOfType;
  wins: number;
  fillColor: string;
  mirror?: boolean;
}>();
</script>

<template>
  <div class="match-score" :class="mirror ? 'flex-row-reverse' : 'flex-row'">
    <div class="color-display">
      <div class="score-fill always-filled" :style="{ backgroundColor: fillColor }" />
    </div>

    <div class="scores" v-if="bestOf !== BestOfType.BestOf1">
      <div class="score-box" v-for="i in bestOf" :key="i">
        <div
          class="score-fill"
          :class="{ filled: i <= wins }"
          :style="{ backgroundColor: i <= wins ? fillColor : 'transparent' }"
        />
      </div>
    </div>

    <div v-else class="empty-score-space"></div>
  </div>
</template>

<style scoped>
.match-score {
  display: flex;
  gap: 0.25rem;
  height: 100%;
}

.color-display,
.score-box {
  width: 0.5rem;
  display: flex;
  flex: 1 1 0;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 2px;
  padding: 1px;
}

.scores {
  width: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.score-fill {
  width: 100%;
  height: 100%;
  min-height: 1px;
}

.empty-score-space {
  width: 0.5rem;
}
</style>