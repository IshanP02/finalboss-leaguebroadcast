<script setup lang="ts">
import {
  computed,
  ref,
  watch,
} from "vue";

import { useRoute } from "vue-router";
import { useClient } from "@/client";

import PostGameCombined from
  "@/components/PostGame/PostGameCombined.vue";

import PostGameDebug from
  "@/components/PostGame/PostGameDebug.vue";

import {
  usePostGameOverview,
  useIsPostGameActive,
  usePostGameSelector,
} from "@/composables/usePostGame";

const route = useRoute();
const client = useClient();

const overview = usePostGameOverview();
const isActive = useIsPostGameActive();

const isMocking = usePostGameSelector(
  (state) => state.postGameData.isMocking
);

const showDebug = computed(
  () => route.query.debug === "true"
);

const previewRequested = computed(
  () =>
    route.query.pgload !== undefined ||
    route.query.pggame !== undefined
);

const showPreview = computed(
  () =>
    previewRequested.value &&
    route.query.pgscreen !== "combined"
);

const previewError = ref("");
const previewLoading = ref(false);

let lastRequest: string | null = null;

async function loadPreview() {
  if (!previewRequested.value) {
    lastRequest = null;
    return;
  }

  const game = route.query.pggame;
  const requestKey = String(game ?? "current");

  if (lastRequest === requestKey) return;

  let selectedId: number | undefined;

  if (game !== undefined) {
    if (typeof game !== "string") {
      previewError.value = "Invalid game ID.";
      return;
    }

    selectedId = Number(game);

    if (
      !Number.isSafeInteger(selectedId) ||
      selectedId <= 0
    ) {
      previewError.value = "Invalid game ID.";
      return;
    }
  }

  lastRequest = requestKey;

  previewLoading.value = true;
  previewError.value = "";

  try {
    await client.showPostGame(selectedId);
  } catch (error) {
    lastRequest = null;
    previewError.value = String(error);

    console.error(
      "[FBE Postgame] Preview failed:",
      error
    );
  } finally {
    previewLoading.value = false;
  }
}

watch(
  [
    () => route.query.pggame,
    () => route.query.pgload,
    isMocking,
  ],
  () => {
    if (
      isMocking.value === undefined ||
      previewLoading.value
    ) {
      return;
    }

    void loadPreview();
  },
  { immediate: true }
);
</script>

<template>
  <div class="postgame-view">

    <!-- Development diagnostics -->
    <PostGameDebug v-if="showDebug" />

    <!-- Historical game / current game preview -->
    <div
      v-else-if="showPreview"
      class="postgame-preview"
    >
      <h1>FBE Postgame Preview</h1>

      <p v-if="previewLoading">
        Loading game data...
      </p>

      <p v-else-if="previewError" class="preview-error">
        {{ previewError }}
      </p>

      <template v-else>
        <p>
          Postgame active:
          {{ isActive ? "Yes" : "No" }}
        </p>

        <p>
          Overview available:
          {{ overview ? "Yes" : "No" }}
        </p>

        <pre>{{ JSON.stringify(overview, null, 2) }}</pre>
      </template>
    </div>

    <!-- Normal caster-controlled broadcast -->
    <PostGameCombined v-else />

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

.postgame-preview {
  position: absolute;
  inset: 0;

  display: flex;
  flex-direction: column;
  gap: 20px;

  padding: 45px;

  background: #08080a;
  color: #f5f0eb;
}

.postgame-preview h1 {
  font-size: 42px;
  font-weight: 800;
  color: #ff263f;
}

.postgame-preview p {
  font-size: 20px;
}

.postgame-preview pre {
  flex: 1;
  min-height: 0;
  overflow: auto;
  white-space: pre-wrap;
  padding: 20px;

  background: #030305;
  border: 1px solid #55202a;

  font-family: monospace;
  font-size: 16px;
}

.preview-error {
  color: #ff7182;
}
</style>