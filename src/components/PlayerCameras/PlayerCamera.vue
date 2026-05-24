<script setup lang="ts">
import { useClient } from '@/client';
import { handleImageError, handleImageLoad } from '@/utils/imageUtils';
import {
    ingameDamageGraphData,
    ingameScoreboardBottomData,
    teamMember,
    type Team,
    isPlayerDead,
    getRemaining
} from '@bluebottle_gg/league-broadcast-client';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useIngameSelector } from '@/composables/useIngame';
import { skinRotationIndex } from '@/composables/useSkinRotation';

const props = defineProps<{
    show: boolean
    team: Team
    scoreboard?: ingameScoreboardBottomData
    teamfight?: ingameDamageGraphData
}>()

const client = useClient();
const gameTime = useIngameSelector((s) => s.gameData.gameTime);
const playersOnTeam = ref<teamMember[]>([]);

// Use the same rotation index as SkinDisplay.vue
const currentPlayerIndex = ref(0);

const rotationInterval = 7500;
let intervalId: number | null = null;

const currentScoreboardPlayer = computed(() => {
    return props.scoreboard?.teams[props.team - 1]?.players[currentPlayerIndex.value];
});

const skinData = useIngameSelector((s) => s.gameData.skinDisplay);

const skinTeamData = computed(() => {
    if (!skinData.value?.teams) return null;
    return skinData.value.teams[props.team - 1];
});

const currentSkinPlayer = computed(() => {
    if (!skinTeamData.value?.players?.length) return null;
    return skinTeamData.value.players[currentPlayerIndex.value % skinTeamData.value.players.length];
});

const currentSplashUrl = computed(() => {
    return currentSkinPlayer.value?.splashCenteredUrl
        || currentSkinPlayer.value?.splashUrl
        || currentScoreboardPlayer.value?.champion?.splashCenteredImg
        || currentScoreboardPlayer.value?.champion?.splashImg
        || currentScoreboardPlayer.value?.champion?.squareImg;
});

const isCurrentPlayerDead = computed(() => {
    const player = playersOnTeam.value[currentPlayerIndex.value];
    if (!player) return false;

    const playerName = `${player.alias}#${player.tag}`;

    const scoreboardTeam = props.scoreboard?.teams[props.team - 1];
    if (scoreboardTeam) {
        const playerInfo = scoreboardTeam.players.find(p => p.name === playerName);
        return isPlayerDead(playerInfo, gameTime.value);
    }

    const teamfightEntry = props.teamfight?.damageDealt.find(
        e => e.team === props.team && e.name === playerName
    );
    return getRemaining(teamfightEntry?.respawnAt, gameTime.value) > 0;
});

onMounted(async () => {
    try {
        const game = await client.api.game.getCurrentGame();
        if (!game) return;

        const playersInGame = await client.api.game.getPlayersInGame(game.gameId);
        playersOnTeam.value = playersInGame[props.team] ?? [];
        intervalId = window.setInterval(() => {
            currentPlayerIndex.value = (currentPlayerIndex.value + 1) % 5;
            skinRotationIndex.value = currentPlayerIndex.value; // Sync with SkinDisplay.vue
        }, rotationInterval);
    } catch (error) {
        // Ignore
    }
});

onUnmounted(() => {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
});
</script>

<template>
    <div v-if="show" id="player-scoreboard-camera" class="bg-black/55 flex flex-col">
        <div class="relative flex-1 grow overflow-hidden">
            <Transition name="skin-fade" mode="out-in">
                <img
                    v-if="currentSplashUrl"
                    :key="currentPlayerIndex.valueOf()"
                    :style="{
                        filter: isCurrentPlayerDead ? 'grayscale(1)' : 'grayscale(0)'
                    }"
                    :src="client.getCacheUrl(currentSplashUrl)"
                    alt="Champion splash"
                    class="absolute top-0 left-0 w-full h-full object-cover object-top rounded-t"
                    @error="handleImageError"
                    @load="handleImageLoad"
                />
            <div v-else key="empty" class="w-full h-full flex items-center justify-center bg-black"></div>
            </Transition>
        </div>

        <span class="player-name">
            {{ currentSkinPlayer?.playerName ?? playersOnTeam[currentPlayerIndex]?.alias }}
        </span>
    </div>
</template>

<style lang="css" scoped>
.player-name {
    display: flex;
    align-items: center;
    justify-content: center;
    justify-self: center;
    height: 40px;
    width: 100%;
    background-color: rgba(0, 0, 0, 1);
    color: white;
    font-size: 22px;
    line-height: 22px;
    text-align: center;
    font-weight: bolder;
    font-family: "Bebas Neue", sans-serif;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
#player-scoreboard-camera {
    background:
      linear-gradient(180deg, rgba(177, 18, 38, 0.22), rgba(0, 0, 0, 0.9)),
      #050507;
    border-color: var(--theme-border);
    box-shadow: inset 0 0 20px rgba(255, 38, 63, 0.18);
    position: relative;
    overflow: hidden;
    
}

#player-scoreboard-camera::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      repeating-linear-gradient(
        -18deg,
        rgba(255,255,255,0.04) 0px,
        rgba(255,255,255,0.04) 1px,
        transparent 1px,
        transparent 8px
      );
    z-index: 2;
}

.player-name {
    background: linear-gradient(90deg, #220308, #7d0b19 50%, #220308);
    color: var(--theme-text);
    border-top: 1px solid rgba(255, 38, 63, 0.55);
    text-shadow: 0 0 6px black, 0 0 10px rgba(255, 38, 63, 0.6);
}
.skin-fade-enter-active,
.skin-fade-leave-active {
    transition: opacity 0.8s ease, transform 0.8s ease;
}

.skin-fade-enter-from,
.skin-fade-leave-to {
    opacity: 0;
    transform: scale(1.08);
}

.skin-fade-enter-to,
.skin-fade-leave-from {
    opacity: 1;
    transform: scale(1);
}
</style>