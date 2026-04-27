<script setup lang="ts">
import { useIngameSelector } from '@/composables/useIngame';
import { Team } from '@bluebottle_gg/league-broadcast-client';
import PlayerCamera from './PlayerCamera.vue';

const scoreboard = useIngameSelector((s) => s.gameData.scoreboardBottom);
const teamfight = useIngameSelector((s) => s.gameData.teamfightDamageOverview);
</script>


<template>
    <Transition name="slide-down">

        <div v-if="scoreboard || teamfight" class="camera-container">
            <PlayerCamera show :team="Team.Order" :scoreboard="scoreboard" :teamfight="teamfight"
                class="border rounded-t-sm border-r-0.5 border-b-0 border-white/55" />
            <div></div>
            <PlayerCamera show :team="Team.Order" :scoreboard="scoreboard" :teamfight="teamfight"
                class="border rounded-t-sm border-r-0.5 border-b-0 border-white/55" />
        </div>
    </Transition>
</template>



<style lang="css" scoped>
.camera-container {
    display: grid;
    grid-template-columns: 178px 1fr 178px;
    grid-template-rows: 1fr;
}

.slide-down-enter-active,
.slide-down-leave-active {
    transition: transform 0.5s ease
}

.slide-down-enter-from,
.slide-down-leave-to {
    transform: translateY(100%);
}
</style>