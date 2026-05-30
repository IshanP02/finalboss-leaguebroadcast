<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useIngameData, useIngameSelector } from "@/composables/useIngame";

const gameData = useIngameData();

const emit = defineEmits<{
  visibleChange: [visible: boolean];
}>();

const visible = ref(false);

watch(visible, (value) => {
  emit("visibleChange", value);
});
let hideTimer: number | undefined;

const damageFlowVisible = useIngameSelector(
  (state) => state.gameData.damageFlow
);

const scoreboard = useIngameSelector((s) => s.gameData.scoreboard);

const blueScoreboardTeam = computed(() => scoreboard.value?.teams[0]);
const redScoreboardTeam = computed(() => scoreboard.value?.teams[1]);

const blueSeriesScore = computed(() => blueScoreboardTeam.value?.seriesScore?.wins ?? 0);
const redSeriesScore = computed(() => redScoreboardTeam.value?.seriesScore?.wins ?? 0);

const teams = computed(() => gameData.value?.teams ?? []);
const blueTeam = computed(() => teams.value[0]);
const redTeam = computed(() => teams.value[1]);

function getTeamName(team: unknown, fallback: string) {
  const t = team as any;
  return t?.name ?? t?.teamName ?? t?.displayName ?? fallback;
}

const blueTeamName = computed(() => getTeamName(blueTeam.value, "Blue Team"));
const redTeamName = computed(() => getTeamName(redTeam.value, "Red Team"));

function playIntro() {
  visible.value = false;
  window.clearTimeout(hideTimer);

  requestAnimationFrame(() => {
    visible.value = true;

    hideTimer = window.setTimeout(() => {
      visible.value = false;
    }, 9000);
  });
}

watch(
  damageFlowVisible,
  (newValue, oldValue) => {
    if (newValue && !oldValue) {
      playIntro();
    }
  },
  { immediate: false }
);
</script>

<template>
    <div class="intro-layer">
        <Transition name="intro">
            <section v-if="visible" class="intro-bar">
            <div class="team team-blue">
                <div class="team-label">BLUE SIDE</div>
                <div class="team-name">{{ blueTeamName }}</div>
            </div>

            <div class="center">
                <div class="event-label">CURRENT SERIES</div>
                <div class="series-score">
                    {{ blueSeriesScore }} - {{ redSeriesScore }}
                </div>
                <div class="series-label">FINALBOSS</div>
            </div>

            <div class="team team-red">
                <div class="team-label">RED SIDE</div>
                <div class="team-name">{{ redTeamName }}</div>
            </div>
            </section>
        </Transition>
    </div>
</template>

<style scoped>
.intro-bar {
  position: absolute;
  left: 0;
  right: 0;
  top: 467px;
  height: 145px;

  display: grid;
  grid-template-columns: 1fr 260px 1fr;
  align-items: center;
  padding: 22px 64px;

  background:
    linear-gradient(
      90deg,
      rgba(37, 99, 235, 0.24),
      transparent 30%,
      transparent 70%,
      rgba(220, 38, 38, 0.24)
    ),
    rgba(15, 23, 42, 0.94);

  border-top: 1px solid rgba(148, 163, 184, 0.28);
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);

  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);

  color: #e2e8f0;
  overflow: hidden;
  text-transform: uppercase;
}

.intro-layer {
  position: absolute;
  inset: 0;
  width: 1920px;
  height: 1080px;
  pointer-events: none;
}

.intro-bar::before,
.intro-bar::after {
  content: "";
  position: absolute;
  top: 0;
  width: 6px;
  height: 100%;
}

.intro-bar::before {
  left: 0;
  background: var(--blue-team-color);
}

.intro-bar::after {
  right: 0;
  background: var(--red-team-color);
}

.series-score {
  margin: 6px 0;
  font-size: 52px;
  font-weight: 950;
  line-height: 1;
  color: #f8fafc;
}

.team {
  min-width: 0;
}

.team-red {
  text-align: right;
}

.team-label,
.event-label,
.series-label {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.22em;
  color: #94a3b8;
}

.team-blue .team-label {
  color: var(--blue-team-color);
}

.team-red .team-label {
  color: var(--red-team-color);
}

.team-name {
  margin-top: 8px;
  font-size: 48px;
  font-weight: 900;
  line-height: 1;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.players {
  margin-top: 14px;
  font-size: 18px;
  font-weight: 600;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.center {
  text-align: center;
}

.versus {
  margin: 8px 0;
  font-size: 56px;
  font-weight: 950;
  line-height: 1;
  color: #f8fafc;
}

.intro-enter-active,
.intro-leave-active {
  transition:
    opacity 0.45s ease,
    scale 0.45s ease;
}

.intro-enter-from,
.intro-leave-to {
  opacity: 0;
  scale: 0.96;
}
</style>