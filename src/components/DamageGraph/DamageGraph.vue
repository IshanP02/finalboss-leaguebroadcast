<script setup lang="ts">
import { computed } from "vue";
import { useIngameSelector } from "@/composables/useIngame";
import { IngameSideInfoPageType } from "@bluebottle_gg/league-broadcast-client";

function formatDamage(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".0", "")}m`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(".0", "")}k`;
  }

  return Math.round(value).toString();
}

const sideInfoPage = useIngameSelector((s) => s.gameData.sideInfoPage);

const players = computed(() => {
  const rows = sideInfoPage.value?.players ?? [];

  const maxDamage = Math.max(
    ...rows.map((p) => p.displayValue ?? p.curValue ?? 0),
    1
  );

  return rows
    .map((p, index) => {
      const damage = p.displayValue ?? p.curValue ?? 0;
      const isBlue = index < 5;

      return {
        ...p,
        totalDamageDealt: damage,
        displayName: p.displayName ?? p.playerName ?? "",
        percent: Math.max((damage / maxDamage) * 100, 2),
        teamColor: isBlue
          ? "rgba(100, 160, 255, 0.95)"
          : "rgba(255, 100, 100, 0.95)",
      };
    })
    .sort((a, b) => b.totalDamageDealt - a.totalDamageDealt);
});

const panelTitle = computed(() => {
    if (sideInfoPage.value?.title == "infopage.gold.total") {
        return "Gold Graph"
    }
    else if (sideInfoPage.value?.title == "infopage.damage.total") {
        return "Damage Graph"
    }
    else if (sideInfoPage.value?.title == "infopage.experience.total") {
        return "EXP Graph"
    }
    else if (sideInfoPage.value?.title == "infopage.creepscore.total") {
        return "CS Graph"
    }
    else {
        return sideInfoPage.value?.title
    }
});
</script>

<template>
  <transition name="slide-left">
    <div v-if="players.length" class="damage-graph">
      <div class="damage-header">{{ panelTitle }}</div>

      <div class="damage-list">
        <div
        v-for="player in players"
        :key="player.displayName"
        class="damage-row"
        :style="{ borderLeftColor: player.teamColor }"
        >
          <div class="damage-row-top">
            <span class="player-name">{{ player.displayName }}</span>
            <span class="damage-number">
              {{ formatDamage(player.totalDamageDealt) }}
            </span>
          </div>

          <div class="bar-track">
            <div
            class="bar-fill"
            :style="{
                width: `${player.percent}%`,
                backgroundColor: player.teamColor,
            }"
            />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.damage-graph {
  width: 360px;
  padding: 8px;
  background: rgba(8, 11, 18, 0.92);
  border: 1px solid rgba(80, 90, 110, 0.65);
  border-left: 0;
  color: #f3f4f6;
  font-family: "Roboto Condensed", "Arial Narrow", Arial, sans-serif;
  text-transform: uppercase;
}

.damage-header {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;

  background: linear-gradient(
    90deg,
    rgba(22, 27, 38, 0.98),
    rgba(32, 38, 52, 0.98)
  );

  border: 1px solid rgba(95, 105, 125, 0.45);

  color: rgba(240, 242, 247, 0.96);

  font-size: 17px;
  font-weight: 800;
  letter-spacing: 1.2px;
}

.damage-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.damage-row {
  position: relative;

  padding: 5px 7px 6px 8px;

  background: rgba(20, 24, 34, 0.88);

  border-left: 4px solid white;

  border-top: 1px solid rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(0, 0, 0, 0.45);
}

.damage-row-top {
  display: grid;
  grid-template-columns: 1fr 54px;
  align-items: center;
  gap: 8px;

  margin-bottom: 4px;

  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.45px;
}

.player-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  color: rgba(235, 238, 245, 0.96);
}

.damage-number {
  text-align: right;
  font-variant-numeric: tabular-nums;

  color: rgba(210, 214, 224, 0.92);
}

.bar-track {
  height: 7px;

  background: rgba(0, 0, 0, 0.45);

  border-top: 1px solid rgba(255, 255, 255, 0.03);

  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  min-width: 4px;

  transition: width 0.35s ease;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.35s ease, opacity 0.35s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}


</style>