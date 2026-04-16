<script setup lang="ts">
import { useClient } from '@/client';
import { handleImageError, handleImageLoad } from '@/utils/imageUtils';
import { ingameScoreboardBottomData, teamMember, type Team } from '@bluebottle_gg/league-broadcast-client';
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{
    show: boolean
    team: Team
    scoreboard?: ingameScoreboardBottomData
}>()

const client = useClient();
const playersOnTeam = ref<teamMember[]>([]);

//rotate through players in x seconds intervals.
const currentPlayerIndex = ref(0);
const rotationInterval = 10000; // Rotate every 10 seconds
let intervalId: number | null = null;

const isCurrentPlayerDead = computed(() => {
    const player = playersOnTeam.value[currentPlayerIndex.value];
    //find the player in the scoreboard data and check if they are dead.
    const playerData = props.scoreboard?.teams[props.team - 1]

    if (!playerData) return false;
    // Find by matching the player name and tag line, as player id is not available in the scoreboard data.
    // We have to do it this way because streamer mode players exist 
    // and they aren't included in the player list we get from the client,
    // but they are included in the scoreboard data. 
    // So we can't rely on player index to match them, we have to match by name and tag line instead.
    const playerInfo = playerData.players.find(p => p.name === `${player?.alias}#${player?.tag}`);
    return playerInfo?.respawnTimeRemaining && playerInfo.respawnTimeRemaining > 0;
})
onMounted(async () => {
    const game = await client.api.game.getCurrentGame();
    const playersInGame = await client.api.game.getPlayersInGame(game.gameId);
    playersOnTeam.value = playersInGame[props.team]
    if (props.show) {
        //preload all player icons to prevent delay when rotating through them. 
        // create a list of promises that resolve when the image is loaded or fails to load, then wait for all promises to resolve before starting the rotation.
        const preloadPromises = playersOnTeam.value.map(player => {
            return new Promise<void>((resolve) => {
                if (!player.iconUri) {
                    resolve();
                    return;
                }
                const img = new Image();
                img.src = client.getCacheUrl(player.iconUri);
                img.onload = () => resolve();
                img.onerror = () => resolve();
            });
        });
        await Promise.all(preloadPromises);

        intervalId = window.setInterval(() => {
            currentPlayerIndex.value = (currentPlayerIndex.value + 1) % playersOnTeam.value.length;
        }, rotationInterval);
    } else {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
})

onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
})
</script>

<template>
    <div v-if="show" id="player-scoreboard-camera" class="bg-black/55 flex flex-col">
        <div class="relative flex-1 grow overflow-hidden">
            <img v-if="playersOnTeam[currentPlayerIndex]?.iconUri" :style="{
                filter: isCurrentPlayerDead ? 'grayscale(1)' : 'grayscale(0)',
                transition: 'filter 0.5s ease'
            }" :src="client.getCacheUrl(playersOnTeam[currentPlayerIndex]?.iconUri)" alt="Player icon"
                class="absolute top-0 left-0 w-full h-full object-cover object-top rounded-t" @error="handleImageError"
                @load="handleImageLoad" />
            <div v-else class="w-full h-full flex items-center justify-center bg-black">
            </div>
        </div>
        <span class="player-name">{{ playersOnTeam[currentPlayerIndex]?.alias }}</span>
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
</style>