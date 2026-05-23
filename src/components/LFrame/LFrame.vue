<script setup lang="ts">
import { useGameState, useIngameConnected, useIsInGame } from '@/composables/useIngame';
import GameInfo from './GameInfo.vue';
import SponsorRotation from './SponsorRotation.vue';
import { computed } from 'vue';
import { GameState } from '@bluebottle_gg/league-broadcast-client';
import FadeTransition from '../../transitions/FadeTransition.vue';

const isInGame = useIsInGame();
</script>

<template>
    <FadeTransition>
        <div v-if="isInGame" class="lframe-container">
            <div class="lframe-header">
                <GameInfo />
            </div>
            <div id="champion-info-cutout" aria-hidden="true">
                <svg class="cutout-frame" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path
                        d="M 0 0 H 100 V 100 H 0 Z M 3 0 L 90 0 L 95 12 L 95 37 L 92 37 L 92 57 L 95 57 L 95 100 L 3 100 Z"
                        fill="black" fill-rule="evenodd" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="lframe-footer">
                <SponsorRotation />
            </div>
        </div>
    </FadeTransition>
</template>

<style lang="css" scoped>
.lframe-container {
    display: grid;
    grid-template-rows: 38px 1fr 114px;
    grid-template-columns: 1fr;
    z-index: 100;
    position: relative;
    overflow: hidden;
    background:
        radial-gradient(circle at top left, rgba(177, 18, 38, 0.18), transparent 38%),
        repeating-linear-gradient(-16deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 8px),
        #050507;
    border: 1px solid var(--theme-border-soft);
    box-shadow:
        inset 0 0 22px rgba(255, 38, 63, 0.12),
        0 0 18px rgba(0, 0, 0, 0.75);
}

.lframe-container::before {
    content: "";
    position: absolute;
    left: 0;
    top: 24px;
    bottom: 24px;
    width: 4px;
    background: linear-gradient(
        180deg,
        rgba(255, 38, 63, 1),
        rgba(120, 10, 20, 1)
    );
    box-shadow: 0 0 12px rgba(255, 38, 63, 0.8);
    z-index: 2;
}

.lframe-header,
.lframe-footer {
    background:
        linear-gradient(
            90deg,
            rgba(177, 18, 38, 0.2),
            rgba(5, 5, 7, 0.95)
        );
    border-bottom: 1px solid rgba(255, 38, 63, 0.18);
    position: relative;
    z-index: 1;
}

.lframe-footer {
    border-top: 1px solid rgba(255, 38, 63, 0.18);
    border-bottom: none;
}

#champion-info-cutout {
    position: relative;
    min-height: 0;
    background:
        radial-gradient(circle at center, rgba(255, 38, 63, 0.08), transparent 60%),
        #050507;
    overflow: hidden;
}

#champion-info-cutout::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
        repeating-linear-gradient(
            -18deg,
            rgba(255,255,255,0.025) 0px,
            rgba(255,255,255,0.025) 1px,
            transparent 1px,
            transparent 9px
        );
    pointer-events: none;
    opacity: 0.5;
}

.cutout-frame {
    display: block;
    width: 100%;
    height: 100%;
    filter:
        drop-shadow(0 0 10px rgba(255, 38, 63, 0.25))
        drop-shadow(0 0 16px rgba(0, 0, 0, 0.9));
}
</style>