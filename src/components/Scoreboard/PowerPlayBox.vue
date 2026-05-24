<script setup lang="ts">
import { computed } from "vue";
import { getRemaining, type ingameObjectivePowerPlay } from "@bluebottle_gg/league-broadcast-client";
import { useIngameSelector } from "@/composables/useIngame";
import FadeTransition from "@/transitions/FadeTransition.vue";

const props = defineProps<{
  type: "baron" | "elder";
  powerPlay?: ingameObjectivePowerPlay;
  mirror?: boolean;
}>();

const gameTime = useIngameSelector((s) => s.gameData.gameTime);

const remaining = computed(() =>
  Math.max(0, getRemaining(props.powerPlay?.timeEnd, gameTime.value))
);

const isActive = computed(() =>
  !!props.powerPlay && gameTime.value >= props.powerPlay.timeStart && remaining.value > 0
);

const timerText = computed(() => {
  const seconds = Math.ceil(remaining.value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
});

const goldText = computed(() => {
  const gold = props.powerPlay?.gold ?? 0;
  const sign = gold > 0 ? "+" : "";
  return `${sign}${(gold / 1000).toFixed(1).replace(".0", "")}k`;
});
</script>

<template>
  <FadeTransition>
    <div
      v-if="isActive"
      class="power-play"
      :class="[type, { mirrored: mirror }]"
    >
      <div class="power-play-title">
        {{ type === "baron" ? "Baron Power Play" : "Elder Power Play" }}
      </div>

      <div class="power-play-row">
        <span>{{ timerText }}</span>
        <span>{{ goldText }}</span>
      </div>
    </div>
  </FadeTransition>
</template>

<style scoped>
.power-play {
  width: 170px;
  padding: 5px 8px;

  color: white;
  font-family: "Bebas Neue", sans-serif;
  text-transform: uppercase;

  background:
    linear-gradient(180deg, rgba(45,45,45,0.96), rgba(8,8,10,0.96));

  border: 1px solid rgba(255, 38, 63, 0.55);
  border-radius: 0 0 6px 6px;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    0 0 10px rgba(0,0,0,0.75);
}

.power-play.mirrored {
  text-align: right;
}

.power-play-title {
  font-size: 15px;
  line-height: 1;
  color: rgba(255,255,255,0.78);
}

.power-play-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-top: 2px;

  font-size: 24px;
  line-height: 1;
  letter-spacing: var(--tracking-tight);
}

.power-play.elder {
  border-color: rgba(175, 90, 255, 0.7);
}
</style>