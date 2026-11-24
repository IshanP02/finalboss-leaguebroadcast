<script setup lang="ts">
import FbeGameResults from "./FbeGameResults.vue";
import FbeDamageBreakdown from "./FbeDamageBreakdown.vue";
import FbeGoldBreakdown from "./FbeGoldBreakdown.vue";

import {
  computed,
  ref,
  watch,
} from "vue";

import { useClient } from "@/client";

import {
  usePostGameSelector,
  usePostGameOverview,
} from "@/composables/usePostGame";

const client = useClient();

const SCREEN_NAMES = {
  "postgame-game": "Game Results",
  "postgame-game-stats": "Game Statistics",
  "postgame-game-damage": "Damage Breakdown",
  "postgame-game-gold": "Gold Difference",
  "postgame-player": "Player Spotlight",
  "postgame-player-stats": "Player Statistics",
} as const;

type ScreenName = keyof typeof SCREEN_NAMES;

const activeComponent = usePostGameSelector(
  (state) => state.postGameData.activeComponent ?? null
);

const isMocking = usePostGameSelector(
  (state) => state.postGameData.isMocking === true
);

const overview = usePostGameOverview();

const componentName = computed<ScreenName | null>(() => {
  const name = activeComponent.value?.componentName;

  if (
    name &&
    Object.prototype.hasOwnProperty.call(SCREEN_NAMES, name)
  ) {
    return name as ScreenName;
  }

  return null;
});

const gameId = computed(
  () => activeComponent.value?.gameId
);

const playerIndex = computed(
  () => activeComponent.value?.playerIndex ?? 0
);

const screenTitle = computed(() => {
  if (!componentName.value) return "";

  return SCREEN_NAMES[componentName.value];
});

const screenKey = computed(() => {
  return [
    componentName.value ?? "none",
    gameId.value ?? "current",
    playerIndex.value,
  ].join("-");
});

const loading = ref(false);
const loadError = ref("");
const requestedGameKey = ref<string | null>(null);
const loadedGameKey = ref<string | null>(null);

const selectedGameKey = computed(() => {
  return [
    gameId.value ?? "current",
    isMocking.value ? "mock" : "live",
  ].join("-");
});

const resultsOverview = computed(() => {
  if (
    loading.value ||
    loadedGameKey.value !== selectedGameKey.value
  ) {
    return null;
  }

  return overview.value;
});

const overviewScreens = new Set<ScreenName>([
  "postgame-game",
  "postgame-game-stats",
  "postgame-game-damage",
  "postgame-game-gold",
]);

let pendingLoad = false;

async function loadSelectedGame() {
  pendingLoad = true;

  // Keep requests sequential when the caster rapidly
  // changes games or screens.
  if (loading.value) return;

  loading.value = true;

  try {
    while (pendingLoad) {
      pendingLoad = false;

      const screen = componentName.value;

      if (!screen || !overviewScreens.has(screen)) {
        continue;
      }

      const selectedGameId = gameId.value;

      const key = [
        selectedGameId ?? "current",
        isMocking.value ? "mock" : "live",
      ].join("-");

      if (
        loadedGameKey.value === key &&
        overview.value
      ) {
        continue;
      }

      requestedGameKey.value = key;
      loadError.value = "";

      try {
        await client.showPostGame(selectedGameId);

        loadedGameKey.value = key;

        console.info(
          "[FBE Postgame] Game loaded:",
          selectedGameId ?? "current"
        );
      } catch (error) {
        loadedGameKey.value = null;

        loadError.value =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          "[FBE Postgame] Game load failed:",
          error
        );
      }
    }
  } finally {
    loading.value = false;
  }
}

watch(
  [componentName, gameId, isMocking],
  () => {
    if (!componentName.value) {
      requestedGameKey.value = null;
      loadedGameKey.value = null;
      loadError.value = "";
      return;
    }

    void loadSelectedGame();
  },
  { immediate: true }
);

// The upstream backend can retain the last selected
// mock component after mocking is disabled.
watch(isMocking, (mocking, wasMocking) => {
  if (wasMocking && !mocking) {
    requestedGameKey.value = null;
    loadedGameKey.value = null;

    client.hidePostGame();
  }
});

watch(activeComponent, (component) => {
  console.info(
    "[FBE Postgame] Active component:",
    component
  );
});
</script>

<template>
  <div class="pg-combined">
    <Transition name="pg-screen" mode="out-in">

    <!-- Phase 3: Game Results -->
    <FbeGameResults
        v-if="
        componentName === 'postgame-game' ||
        componentName === 'postgame-game-stats'
        "
        :key="'results-' + screenKey"
        :overview="resultsOverview"
        :game-id="gameId"
        :is-mocking="isMocking"
        :loading="loading"
        :error="loadError"
    />

    <!-- Phase 4: Damage Breakdown -->
    <FbeDamageBreakdown
        v-else-if="componentName === 'postgame-game-damage'"
        :key="'damage-' + screenKey"
        :overview="resultsOverview"
        :loading="loading"
        :error="loadError"
    />

    <!-- Phase 4: Gold Advantage -->
    <FbeGoldBreakdown
        v-else-if="componentName === 'postgame-game-gold'"
        :key="'gold-' + screenKey"
        :overview="resultsOverview"
        :loading="loading"
        :error="loadError"
    />

    <!-- Temporary placeholders for remaining phases -->
    <section
        v-else-if="componentName"
        :key="'placeholder-' + screenKey"
        class="pg-placeholder"
    >
        <div class="pg-header">
          <div class="pg-brand">
            FINAL BOSS ESPORTS
          </div>

          <div class="pg-label">
            POSTGAME
          </div>
        </div>

        <main class="pg-content">
          <div class="accent-line"></div>

          <h1>{{ screenTitle }}</h1>

          <p class="subtitle">
            Postgame architecture test
          </p>

          <div class="pg-information">
            <div>
              <span>COMPONENT</span>
              <strong>{{ componentName }}</strong>
            </div>

            <div>
              <span>GAME ID</span>
              <strong>{{ gameId ?? "Current" }}</strong>
            </div>

            <div>
              <span>PLAYER INDEX</span>
              <strong>{{ playerIndex }}</strong>
            </div>

            <div>
              <span>OVERVIEW DATA</span>
              <strong>
                {{
                  loading
                    ? "Loading"
                    : overview &&
                      requestedGameKey === loadedGameKey
                      ? "Available"
                      : "Unavailable"
                }}
              </strong>
            </div>
          </div>

          <div v-if="loadError" class="pg-error">
            {{ loadError }}
          </div>

          <div class="development-label">
            DEVELOPMENT PLACEHOLDER
          </div>
        </main>

        <footer class="pg-footer">
          FINALBOSSESPORTS.NET
        </footer>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.pg-combined {
  position: absolute;
  inset: 0;
  width: 1920px;
  height: 1080px;
}

.pg-placeholder {
  position: absolute;
  inset: 0;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 55px 75px;

  background:
    radial-gradient(
      ellipse at bottom center,
      rgba(177, 18, 38, 0.24),
      transparent 60%
    ),
    repeating-linear-gradient(
      -12deg,
      rgba(255, 255, 255, 0.018) 0px 1px,
      transparent 1px 8px
    ),
    #050507;

  color: var(--theme-text, #f5f0eb);
}

.pg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  border-bottom: 2px solid #b11226;
  padding-bottom: 25px;
}

.pg-brand {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 6px;
}

.pg-label {
  padding: 12px 22px;
  background: #b11226;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 3px;
}

.pg-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

  text-align: center;
}

.accent-line {
  width: 130px;
  height: 5px;
  background: #ff263f;
  box-shadow: 0 0 25px #b11226;
}

h1 {
  font-size: 86px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 3px;
}

.subtitle {
  font-size: 26px;
  color: #9b8f8f;
}

.pg-information {
  display: flex;
  justify-content: center;
  gap: 50px;
  margin-top: 30px;
}

.pg-information > div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pg-information span {
  color: #ff7182;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
}

.pg-information strong {
  font-size: 24px;
}

.pg-error {
  color: #ff7182;
  font-size: 20px;
}

.development-label {
  margin-top: 30px;
  padding: 12px 24px;
  border: 1px solid #77303c;
  color: #bc8991;
  font-size: 16px;
  letter-spacing: 4px;
}

.pg-footer {
  border-top: 1px solid #55202a;
  padding-top: 25px;

  text-align: center;
  color: #9b8f8f;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 5px;
}

.pg-screen-enter-active,
.pg-screen-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.pg-screen-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.pg-screen-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}
</style>