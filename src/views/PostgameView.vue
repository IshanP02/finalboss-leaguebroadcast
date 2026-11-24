<script setup lang="ts">
import {
  computed,
  ref,
  shallowRef,
  watch,
} from "vue";

import { useRoute } from "vue-router";

import type {
  postGameOverview,
} from "@bluebottle_gg/league-broadcast-client";

import { useClient } from "@/client";

import PostGameCombined from
  "@/components/PostGame/PostGameCombined.vue";

import PostGameDebug from
  "@/components/PostGame/PostGameDebug.vue";

import FbeGameResults from
  "@/components/PostGame/FbeGameResults.vue";

import FbeDamageBreakdown from
  "@/components/PostGame/FbeDamageBreakdown.vue";

import FbeGoldBreakdown from
  "@/components/PostGame/FbeGoldBreakdown.vue";

import FbePlayerSpotlight from
  "@/components/PostGame/FbePlayerSpotlight.vue";

import {
  usePostGameSelector,
} from "@/composables/usePostGame";

const route = useRoute();
const client = useClient();

const isMocking = usePostGameSelector(
  (state) => state.postGameData.isMocking,
);

// --------------------------------------------------
// Display mode
// --------------------------------------------------

const showDebug = computed(
  () => route.query.debug === "true",
);

const playerPreviewMode = computed(() => {
  if (showDebug.value) return null;

  const requested =
    route.query.pgload !== undefined ||
    route.query.pggame !== undefined;

  if (!requested) return null;

  switch (route.query.pgscreen) {
    case "mvp":
      return "mvp";

    case "spotlight":
      return "spotlight";

    case "performance":
      return "performance";

    default:
      return null;
  }
});

const previewPlayerIndex = computed(() => {
  const raw = route.query.pgplayer;

  if (raw === undefined) return 0;

  if (
    typeof raw !== "string" ||
    !/^[0-9]+$/.test(raw)
  ) {
    return -1;
  }

  const index = Number(raw);

  return index >= 0 && index <= 9
    ? index
    : -1;
});

const activePreviewGameId = usePostGameSelector(
  (state) =>
    state.postGameData.activeComponent?.gameId ??
    state.postGameData.gameId
);

const playerPreviewGameId = computed(() => {
  const raw = route.query.pggame;

  if (raw === undefined) {
    return activePreviewGameId.value;
  }

  if (
    typeof raw !== "string" ||
    !/^[0-9]+$/.test(raw)
  ) {
    return undefined;
  }

  const id = Number(raw);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : undefined;
});

const showPreview = computed(() => {
  return (
    !showDebug.value &&
    !playerPreviewMode.value &&
    (
      route.query.pgload !== undefined ||
      route.query.pggame !== undefined
    ) &&
    route.query.pgscreen !== "combined"
  );
});

const previewScreen = computed(() => {
  const screen = route.query.pgscreen;

  switch (screen) {
    case "damage":
      return "damage";

    case "gold":
      return "gold";

    default:
      return "results";
  }
});

// --------------------------------------------------
// Preview state
// --------------------------------------------------

const previewOverview =
  shallowRef<postGameOverview | null>(null);

const previewGameId = ref<number | undefined>();

const previewLoading = ref(false);
const previewError = ref("");

// --------------------------------------------------
// Preview data loading
// --------------------------------------------------

watch(
  [
    showPreview,
    () => route.query.pggame,
    isMocking,
  ],

  async ([enabled, rawId, mocking], _, onCleanup) => {
    let cancelled = false;

    onCleanup(() => {
      cancelled = true;
    });

    previewOverview.value = null;
    previewGameId.value = undefined;
    previewError.value = "";
    previewLoading.value = false;

    if (!enabled) return;

    previewLoading.value = true;

    // Wait for the backend's mocking state
    // to become available.
    if (mocking === undefined) {
      return;
    }

    try {
      let selectedId: number | undefined;

      if (rawId !== undefined) {
        if (
          typeof rawId !== "string" ||
          !rawId.trim()
        ) {
          throw new Error("Invalid game ID.");
        }

        selectedId = Number(rawId);

        if (
          !Number.isSafeInteger(selectedId) ||
          selectedId <= 0
        ) {
          throw new Error("Invalid game ID.");
        }
      }

        const postgameState = client.getPostGameData();

        if (selectedId === undefined && !mocking) {
        selectedId =
            postgameState.activeComponent?.gameId ??
            postgameState.gameId;
        }

        const result = await client.showPostGame(
        selectedId,
        );

      if (cancelled) return;

      // Use the response from this request rather
      // than relying on whatever game happens to
      // be in the reactive store.
      previewOverview.value = result ?? null;

      const storedId =
        client.getPostGameData().gameId;

      previewGameId.value =
        selectedId ??
        (
          typeof storedId === "number"
            ? storedId
            : undefined
        );

      if (!previewOverview.value) {
        previewError.value =
          "No postgame overview was returned.";
      }
    } catch (error) {
      if (cancelled) return;

      previewError.value =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        "[FBE Postgame] Preview failed:",
        error,
      );
    } finally {
      if (!cancelled) {
        previewLoading.value = false;
      }
    }
  },

  { immediate: true },
);
</script>

<template>
  <div class="postgame-view">

    <!-- Development diagnostics -->
    <PostGameDebug
      v-if="showDebug"
    />

    <!-- Phase 5: Player previews -->
    <FbePlayerSpotlight
    v-else-if="playerPreviewMode"
        :key="
            'player-preview-' +
            playerPreviewMode + '-' +
            playerPreviewGameId + '-' +
            previewPlayerIndex
        "
        :game-id="playerPreviewGameId"
        :player-index="previewPlayerIndex"
        :is-mocking="isMocking"
        :mode="
            playerPreviewMode === 'performance'
            ? 'performance'
            : 'spotlight'
        "
        :award="playerPreviewMode === 'mvp'"
    />

    <!-- Damage preview -->
    <FbeDamageBreakdown
      v-else-if="
        showPreview &&
        previewScreen === 'damage'
      "
      :key="'damage-preview'"
      :overview="previewOverview"
      :loading="previewLoading"
      :error="previewError"
    />

    <!-- Gold preview -->
    <FbeGoldBreakdown
      v-else-if="
        showPreview &&
        previewScreen === 'gold'
      "
      :key="'gold-preview'"
      :overview="previewOverview"
      :loading="previewLoading"
      :error="previewError"
    />

    <!-- Game Results preview -->
    <FbeGameResults
      v-else-if="showPreview"
      :key="'results-preview'"
      :overview="previewOverview"
      :game-id="previewGameId"
      :is-mocking="isMocking === true"
      :loading="previewLoading"
      :error="previewError"
    />

    <!-- Caster-controlled broadcast -->
    <PostGameCombined
      v-else
    />

  </div>
</template>

<style scoped>
.postgame-view {
  position: relative;

  width: 1920px;
  height: 1080px;

  overflow: hidden;
  background: transparent;
}
</style>