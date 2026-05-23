<script setup lang="ts">
import { computed } from 'vue'
import { Team } from '@bluebottle_gg/league-broadcast-client'
import { useClient } from '@/client'
import { useIngameSelector } from '@/composables/useIngame'
import { skinRotationIndex } from '@/composables/useSkinRotation'

const props = defineProps<{
  team: Team
  mirror?: boolean
}>()

const client = useClient()
const skinData = useIngameSelector((s) => s.gameData.skinDisplay)

const teamData = computed(() => {
  if (!skinData.value?.teams) return null
  return skinData.value.teams[props.team - 1]
})

const currentPlayer = computed(() => {
  if (!teamData.value?.players?.length) return null
  return teamData.value.players[skinRotationIndex.value % teamData.value.players.length]
})
</script>

<template>
  <div class="scoreboard-skin-box" :class="{ mirror }">
    <img
      v-if="currentPlayer"
      :src="client.getCacheUrl(currentPlayer.splashCenteredUrl || currentPlayer.splashUrl)"
      class="scoreboard-skin-img"
      :class="{ mirror }"
    />

    <div class="scoreboard-skin-name">
      {{ currentPlayer?.playerName }}
    </div>
  </div>
</template>

<style scoped>
.scoreboard-skin-box {
  position: relative;
  width: 176px;
  height: 100%;
  overflow: hidden;
  background: black;
  border-top: 1px solid rgba(255, 255, 255, 0.55);
}

.scoreboard-skin-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
}

.scoreboard-skin-img.mirror {
  transform: scaleX(-1);
}

.scoreboard-skin-name {
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: "Bebas Neue", sans-serif;
  color: white;
  font-size: 18px;
  text-shadow: 0 0 4px black;
  background: rgba(0, 0, 0, 0.55);
}
</style>