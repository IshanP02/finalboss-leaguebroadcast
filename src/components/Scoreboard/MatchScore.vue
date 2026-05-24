<script setup lang="ts">
import { computed } from "vue";
import { BestOfType } from "@bluebottle_gg/league-broadcast-client";

const props = defineProps<{
  bestOf: BestOfType;
  wins: number;
  fillColor: string;
  mirror?: boolean;
}>();

const winsNeeded = computed(() => Math.ceil(props.bestOf / 2));
</script>

<template>
  <div class="flex gap-1" :class="mirror ? 'flex-row-reverse' : 'flex-row'">
    <div id="color-display" class="flex w-2 border border-white/55 rounded-xs p-px">
      <div class="grow" :style="{ backgroundColor: fillColor }"></div>
    </div>

    <div
      id="scores"
      class="match-score"
      v-if="bestOf !== BestOfType.BestOf1"
    >
      <div
        class="score-box"
        :class="{ won: i <= wins }"
        v-for="i in winsNeeded"
        :key="i"
      >
        <div
          class="score-fill"
          :style="{ backgroundColor: i <= wins ? fillColor : 'transparent' }"
        />
      </div>
    </div>

    <div v-else class="w-2"></div>
  </div>
</template>

<style scoped>
.match-score {
  width: 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.score-box {
  height: 10px;
  display: flex;
  padding: 1px;

  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 2px;

  background: rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}

.score-fill {
  flex: 1;
  border-radius: 1px;
}

.score-box.won {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    0 0 4px rgba(255, 255, 255, 0.18);
}
</style>