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
  position: relative;
  width: 360px;
  padding: 6px;
  color: #fff;
  font-family: "Bebas Neue", "Roboto Condensed", Arial, sans-serif;
  text-transform: uppercase;

  background:
    linear-gradient(
      180deg,
      rgba(40, 40, 40, 0.96) 0%,
      rgba(15, 15, 15, 0.96) 100%
    );

  border: 1px solid rgba(255, 70, 70, 0.55);
  border-left: 0;
  border-radius: 0 8px 8px 0;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.6),
    0 0 10px rgba(255, 40, 40, 0.12);

  box-sizing: border-box;
  overflow: hidden;
}

.damage-graph::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;

  background:
    linear-gradient(
      90deg,
      rgba(255, 60, 60, 0.08) 0%,
      transparent 18%,
      transparent 82%,
      rgba(255, 60, 60, 0.08) 100%
    );
}

.damage-header {
  position: relative;

  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 6px;

  color: #fff;
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
  letter-spacing: var(--tracking-tight);

  background:
    linear-gradient(
      180deg,
      rgba(150, 20, 20, 0.95) 0%,
      rgba(90, 10, 10, 0.95) 100%
    );

  border:
    1px solid rgba(255,255,255,0.08);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.12),
    inset 0 -1px 0 rgba(0,0,0,0.45);

  border-radius: 6px;

  text-shadow:
    0 1px 2px rgba(0,0,0,0.8);

  transform: scale(1, 1.25);
}

.damage-header::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;

  background: rgba(255,255,255,0.18);
}

.damage-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.damage-row {
  position: relative;
  padding: 6px 8px;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  border: 1px solid #ffffff22;
  border-left: 6px solid white;
  box-sizing: border-box;
  overflow: hidden;
}

.damage-row-top {
  display: grid;
  grid-template-columns: 1fr 58px;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  letter-spacing: var(--tracking-tight);
}

.player-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.damage-number {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.bar-track {
  height: 8px;
  background-color: rgba(0, 0, 0, 0.65);
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  min-width: 4px;
  border-radius: 999px;
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