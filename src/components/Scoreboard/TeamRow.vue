<script setup lang="ts">
import { BestOfType, ingameScoreboardTeamData } from "@bluebottle_gg/league-broadcast-client";
import MatchScore from "./MatchScore.vue";
import { useClient } from "@/client";
import TextWithIcon from "./TextWithIcon.vue";
import Gold from "@/assets/gold.png";
import Tower from "@/assets/tower.png";
import { computed, ref, watch } from "vue";
import FadeTransition from "../../transitions/FadeTransition.vue";
import { handleImageError, handleImageLoad } from "@/utils/imageUtils";


const props = defineProps<{
    team: ingameScoreboardTeamData
    bestOf: BestOfType
    mirror?: boolean
    enemyTeamGold?: number
}>()

const client = useClient();

const formattedGold = computed(() => {
    const gold = props.team.gold;
    if (gold >= 1000) {
        return (gold / 1000).toFixed(1) + "K";
    }
    return gold.toString();
})

const goldDiff = computed(() => {
    if (props.enemyTeamGold === undefined) return null;
    const diff = props.team.gold - props.enemyTeamGold;
    return Math.floor(diff);
})

const goldDiffText = computed(() => {
    const diff = goldDiff.value;
    if (diff === null || diff <= 0) return "";
    const formattedDiff = diff >= 1000 ? (diff / 1000).toFixed(1) + "K" : diff.toString();
    return "+" + formattedDiff;
})

// Hysteresis: show above 500, hide below 300 - prevent flickering
const SHOW_THRESHOLD = 500;
const HIDE_THRESHOLD = 300;
const showGoldDiff = ref(false);

watch(goldDiff, (diff) => {
    if (diff === null || diff <= 0) {
        showGoldDiff.value = false;
    } else if (diff > SHOW_THRESHOLD) {
        showGoldDiff.value = true;
    } else if (diff < HIDE_THRESHOLD) {
        showGoldDiff.value = false;
    }
    // Between HIDE_THRESHOLD and SHOW_THRESHOLD: keep current state
}, { immediate: true })

</script>

<template>
    <div class="w-full h-full flex items-center py-1 px-1 gap-4" :class="mirror ? 'flex-row-reverse' : 'flex-row'">
        <MatchScore class="self-stretch" :best-of="bestOf"
            :fill-color="mirror ? 'var(--red-team-color)' : 'var(--blue-team-color)'" :wins="team.seriesScore.wins"
            :mirror="mirror" />
        <img v-if="team.teamIconUrl" :src="client.getCacheUrl(team.teamIconUrl)" alt="Team icon"
            class="max-h-4/5 w-auto " @error="handleImageError" @load="handleImageLoad" />
        <div class="flex flex-col" :style="{
            textAlign: mirror ? 'right' : 'left'
        }">
            <p class="font-extrabold text-xl" :style="{
                'color': mirror ? 'var(--red-team-color)' : 'var(--blue-team-color)'
            }">{{ team.teamTag }}</p>
            <p class="font-bold overflow-clip whitespace-nowrap text-ellipsis text-sm">{{ team.infoText }}</p>
        </div>
        <TextWithIcon class="-translate-y-1" :class="mirror ? ['pr-2'] : ['pl-2']" :icon-url="Tower"
            :text="team.towers.toString()" :mirror="mirror" />
        <div class="relative flex flex-col items-start">
            <TextWithIcon :class="mirror ? ['pr-2'] : ['pl-2']" :icon-url="Gold" :text="formattedGold"
                :mirror="mirror" />
            <FadeTransition name="fade" mode="out-in">
                <div id="gold-diff" v-if="showGoldDiff" class="absolute top-1 w-10 h-6 text-center" :style="{
                    'background-color': mirror ? 'var(--red-team-color)' : 'var(--blue-team-color)',
                    'left': mirror ? 'auto' : '40px',
                    color: 'white',
                }">
                    <span class="spcing text-stretch-vertical capitalize">{{
                        goldDiffText }}</span>
                </div>
            </FadeTransition>
        </div>
        <span class="text-3xl font-extrabold spcing tracking-tight text-stretch-vertical capitalize"
            :class="mirror ? 'mr-auto ml-2' : 'ml-auto mr-2 '">{{ team.kills
            }}</span>

    </div>
</template>

<style lang="css" scoped>
:deep(.text-with-icon),
:deep(span),
p {
    color: var(--theme-text);
    text-shadow: 0 0 4px black;
}

.w-full {
    position: relative;
    overflow: hidden;
    background:
        linear-gradient(
            90deg,
            rgba(177, 18, 38, 0.24),
            rgba(5, 5, 7, 0.95) 28%,
            rgba(5, 5, 7, 1) 70%,
            rgba(177, 18, 38, 0.14)
        );
    border-inline-start: 3px solid var(--theme-red);
    box-shadow:
        inset 0 0 14px rgba(255, 38, 63, 0.14),
        inset 0 -1px 0 rgba(255, 38, 63, 0.22);
}

.w-full.flex-row-reverse {
    background:
        linear-gradient(
            270deg,
            rgba(177, 18, 38, 0.24),
            rgba(5, 5, 7, 0.95) 28%,
            rgba(5, 5, 7, 1) 70%,
            rgba(177, 18, 38, 0.14)
        );
    border-inline-start: none;
    border-inline-end: 3px solid var(--theme-red-bright);
}

.w-full::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
        repeating-linear-gradient(
            -16deg,
            rgba(255, 255, 255, 0.035) 0px,
            rgba(255, 255, 255, 0.035) 1px,
            transparent 1px,
            transparent 8px
        );
    opacity: 0.55;
}

img {
    filter: drop-shadow(0 0 6px rgba(255, 38, 63, 0.35));
    z-index: 1;
}

p,
span,
:deep(*) {
    position: relative;
    z-index: 1;
}

p.font-extrabold {
    color: var(--theme-red-bright) !important;
    text-shadow:
        0 0 4px black,
        0 0 10px rgba(255, 38, 63, 0.55);
    letter-spacing: 0.04em;
}

p.font-bold {
    color: var(--theme-muted);
    letter-spacing: 0.03em;
}

.text-3xl {
    color: var(--theme-text);
    text-shadow:
        0 0 4px black,
        0 0 12px rgba(255, 38, 63, 0.65);
}

#gold-diff {
    background: linear-gradient(90deg, var(--theme-red-dark), var(--theme-red-bright)) !important;
    border: 1px solid var(--theme-border);
    box-shadow: 0 0 10px rgba(255, 38, 63, 0.45);
    clip-path: polygon(8% 0, 100% 0, 92% 100%, 0% 100%);
}

.text-stretch-vertical {
    font-family: 'Bebas Neue';
    display: inline-block;
    transform: scale(1, 1.5);
}
</style>