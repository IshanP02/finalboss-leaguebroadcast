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
let disposed = false;

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
    return skinTeamData.value.players[currentPlayerIndex.value];
});

const currentSplashUrl = computed(() => {
    return currentSkinPlayer.value?.splashCenteredUrl
        || currentSkinPlayer.value?.splashUrl
        || currentScoreboardPlayer.value?.champion?.splashCenteredImg
        || currentScoreboardPlayer.value?.champion?.splashImg
        || currentScoreboardPlayer.value?.champion?.squareImg;
});

const sideColor = computed(() => props.team === 1 ? '#69a1ff' : '#ff5064');
const clean = (value?: string | null) => value?.split('#')[0]?.trim() || '';
const playerName = computed(() => clean(currentSkinPlayer.value?.playerName)
    || clean(currentScoreboardPlayer.value?.displayName)
    || clean(currentScoreboardPlayer.value?.name)
    || clean(playersOnTeam.value[currentPlayerIndex.value]?.alias));
const skinName = computed(() => currentSkinPlayer.value?.skinName
    || currentScoreboardPlayer.value?.champion?.name
    || currentScoreboardPlayer.value?.champion?.alias || '');
const cardKey = computed(() => `${currentPlayerIndex.value}:${currentSplashUrl.value ?? ''}`);
const normalize = (value?: string | null) => clean(value).toLowerCase();

const isCurrentPlayerDead = computed(() => {
    const selectedName = normalize(playerName.value);
    const scoreboardTeam = props.scoreboard?.teams[props.team - 1];
    if (scoreboardTeam) {
        const matchingPlayer = selectedName ? scoreboardTeam.players.find(p =>
            normalize(p.name) === selectedName || normalize(p.displayName) === selectedName) : undefined;
        // When a skin record has a name but cannot be matched, do not guess its death state.
        const player = matchingPlayer ?? (!currentSkinPlayer.value?.playerName ? currentScoreboardPlayer.value : undefined);
        return isPlayerDead(player, gameTime.value);
    }
    const rosterPlayer = playersOnTeam.value[currentPlayerIndex.value];
    const rosterName = rosterPlayer ? `${rosterPlayer.alias}#${rosterPlayer.tag}` : '';
    const teamfightEntry = props.teamfight?.damageDealt.find(e => e.team === props.team &&
        ((selectedName && normalize(e.name) === selectedName) || (!selectedName && rosterName && e.name === rosterName)));
    return getRemaining(teamfightEntry?.respawnAt, gameTime.value) > 0;
});

onMounted(async () => {
    // Rotate even when the optional game/roster endpoint is unavailable.
    intervalId = window.setInterval(() => {
        currentPlayerIndex.value = (currentPlayerIndex.value + 1) % 5;
        skinRotationIndex.value = currentPlayerIndex.value;
    }, rotationInterval);
    try {
        const game = await client.api.game.getCurrentGame();
        if (!game || disposed) return;
        const playersInGame = await client.api.game.getPlayersInGame(game.gameId);
        if (!disposed) playersOnTeam.value = playersInGame[props.team] ?? [];
    } catch {
        // Scoreboard and skin data remain usable without a registered roster.
    }
});

onUnmounted(() => {
    disposed = true;
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
});
</script>

<template>
    <div v-if="show" id="player-scoreboard-camera" class="skin-card" :class="{ 'red-side': team !== 1 }" :style="{ '--side': sideColor }">
        <Transition name="skin-fade">
            <div :key="cardKey" class="skin-card-content" :class="{ dead: isCurrentPlayerDead }">
                <img v-if="currentSplashUrl" :src="client.getCacheUrl(currentSplashUrl)" alt="" class="skin-art"
                    @error="handleImageError" @load="handleImageLoad" />
                <div class="skin-shade" />
                <div class="skin-nameplate">
                    <span class="player-name">{{ playerName || skinName || sideLabel }}</span>
                    <span v-if="skinName && playerName" class="skin-name">{{ skinName }}</span>
                </div>
            </div>
        </Transition>
        <div class="skin-side-label">{{ sideLabel }}</div>
        <div class="skin-accent" />
    </div>
</template>

<style lang="css" scoped>
#player-scoreboard-camera.skin-card {
    position: relative; isolation: isolate; overflow: hidden; min-width: 0; min-height: 0;
    border: 1px solid color-mix(in srgb,var(--side) 60%,#2b2229); border-top: 3px solid var(--side);
    border-bottom: 0; border-radius: 0;
    background: radial-gradient(ellipse at 50% 25%,color-mix(in srgb,var(--side) 17%,#151019),#08080c 80%);
    box-shadow: inset 0 0 18px #0008; font-family: "Rajdhani", "Chakra Petch", "Inter", sans-serif;
}
.skin-card-content { position: absolute; inset: 0; overflow: hidden; }
.skin-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 20%; transition: filter .35s ease; }
.dead .skin-art { filter: grayscale(1) brightness(.68); }
.skin-shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(0deg,#08080dfc 0%,#08080def 14%,#08080d7a 30%,transparent 58%),linear-gradient(180deg,#08080d66,transparent 22%); }
.skin-side-label { position: absolute; top: 9px; left: 8px; z-index: 3; background: #08080dd9; border-left: 2px solid var(--side); padding: 3px 6px; color: var(--side); font-size: 10px; line-height: 1.2; font-weight: 800; letter-spacing: 1px; }
.red-side .skin-side-label { left: auto; right: 8px; border-left: 0; border-right: 2px solid var(--side); }
.skin-nameplate { position: absolute; left: 0; right: 0; bottom: 0; height: 53px; padding: 7px 9px 8px; display: flex; flex-direction: column; justify-content: center; gap: 3px; border-top: 1px solid color-mix(in srgb,var(--side) 60%,transparent); background: linear-gradient(100deg,color-mix(in srgb,var(--side) 15%,#100d14),#0b0a0e 90%); text-align: left; }
.red-side .skin-nameplate { text-align: right; background: linear-gradient(260deg,color-mix(in srgb,var(--side) 15%,#100d14),#0b0a0e 90%); }
.player-name { display: block; color: #f5f0eb; font: 800 19px/1.05 "Rajdhani", "Chakra Petch", "Inter", sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.skin-name { display: block; color: var(--side); font-size: 11px; line-height: 1.1; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.skin-accent { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--side); pointer-events: none; z-index: 3; }
.skin-fade-enter-active,.skin-fade-leave-active { transition: opacity .6s ease; }
.skin-fade-enter-active { z-index: 2; }
.skin-fade-enter-from,.skin-fade-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .skin-fade-enter-active,.skin-fade-leave-active,.skin-art { transition: none; } }
</style>
