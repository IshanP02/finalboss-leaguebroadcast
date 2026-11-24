<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <RouterView />
</template>

<style>
@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  * {
    --blue-team-color: oklch(0.6231 0.188 259.81);
    --red-team-color: oklch(0.6231 0.188 28.31);
  }
}

html,
body,
#app {
  width: 1920px;
  height: 1080px;
  overflow: hidden;
  background: transparent;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  color: #e2e8f0;
}
</style>