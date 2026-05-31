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

const scoreboardBottom = useIngameSelector((s) => s.gameData.scoreboardBottom);

function getPlayerDisplayName(player: any) {
  return player?.displayName ?? player?.name ?? player?.champion?.alias ?? "";
}

const bluePlayerNames = computed(() =>
  scoreboardBottom.value?.teams[0]?.players
    ?.map(getPlayerDisplayName)
    .filter(Boolean)
    .join(" • ") ?? ""
);

const redPlayerNames = computed(() =>
  scoreboardBottom.value?.teams[1]?.players
    ?.map(getPlayerDisplayName)
    .filter(Boolean)
    .join(" • ") ?? ""
);

const blueTeamName = computed(() => getTeamName(blueTeam.value, "Blue Team"));
const redTeamName = computed(() => getTeamName(redTeam.value, "Red Team"));

function playIntro() {
  visible.value = false;
  window.clearTimeout(hideTimer);

  requestAnimationFrame(() => {
    visible.value = true;

    hideTimer = window.setTimeout(() => {
      visible.value = false;
    }, 10000);
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
                <div v-if="bluePlayerNames" class="players">{{ bluePlayerNames }}</div>
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
                <div v-if="redPlayerNames" class="players">{{ redPlayerNames }}</div>
            </div>
            </section>
        </Transition>
    </div>
</template>

<style scoped>
.intro-layer {
  position: absolute;
  inset: 0;
  width: 1920px;
  height: 1080px;
  pointer-events: none;
}

.intro-bar {
  position: absolute;
  left: 110px;
  right: 110px;
  top: 448px;
  min-height: 176px;

  display: grid;
  grid-template-columns: 1fr 300px 1fr;
  align-items: center;
  gap: 28px;
  padding: 26px 42px;

  font-family: "Chakra Petch", sans-serif;
  color: white;
  text-transform: uppercase;
  overflow: hidden;

  background:
    linear-gradient(135deg, rgba(177, 18, 38, 0.16), transparent 35%),
    repeating-linear-gradient(
      -12deg,
      rgba(255, 255, 255, 0.035) 0px,
      rgba(255, 255, 255, 0.035) 1px,
      transparent 1px,
      transparent 7px
    ),
    var(--theme-bg);

  border: 1px solid var(--theme-border);

  box-shadow:
    inset 0 0 18px rgba(255, 38, 63, 0.12),
    0 0 18px rgba(0, 0, 0, 0.65);
}

.intro-bar::before,
.intro-bar::after {
  content: "";
  position: absolute;
  top: 0;
  width: 5px;
  height: 100%;
  pointer-events: none;
}

.intro-bar::before {
  left: 0;
  background: linear-gradient(to bottom, transparent, var(--blue-team-color));
}

.intro-bar::after {
  right: 0;
  background: linear-gradient(to bottom, transparent, var(--red-team-color));
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
  font-size: 14px;
  font-weight: 800;
  letter-spacing: var(--tracking-wide);
  color: #e2b793;
  text-shadow: 0 0 2px rgba(0, 0, 0, 1);
}

.team-blue .team-label {
  color: var(--blue-team-color);
}

.team-red .team-label {
  color: var(--red-team-color);
}

.team-name {
  margin-top: 8px;
  font-size: 46px;
  font-weight: 900;
  line-height: 1;
  color: white;
  letter-spacing: var(--tracking-wide);
  text-shadow: 0 0 2px rgba(0, 0, 0, 1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.players {
  margin-top: 14px;
  font-size: 18px;
  font-weight: 600;
  color: #e2b793;
  letter-spacing: var(--tracking-wide);
  text-shadow: 0 0 2px rgba(0, 0, 0, 1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.center {
  text-align: center;
  padding: 12px 18px;
  border-left: 1px solid rgba(255, 38, 63, 0.28);
  border-right: 1px solid rgba(255, 38, 63, 0.28);
}

.series-score {
  margin: 8px 0;
  font-size: 56px;
  font-weight: 950;
  line-height: 1;
  color: white;
  text-shadow: 0 0 2px rgba(0, 0, 0, 1);
}

.intro-enter-active,
.intro-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.intro-enter-from,
.intro-leave-to {
  opacity: 0;
  transform: translateY(28px);
}
</style>