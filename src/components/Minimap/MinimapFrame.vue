<script setup lang="ts">
import { useIsInGame } from '@/composables/useIngame';
import FadeTransition from '../../transitions/FadeTransition.vue';

const isInGame = useIsInGame();
</script>


<template>
    <FadeTransition>
        <div v-if="isInGame" class="minimap-frame" />
    </FadeTransition>
</template>

<style scoped>
.minimap-frame {
    pointer-events: none;
    position: relative;

    /* Main border texture */
    background:
        linear-gradient(
            135deg,
            rgba(70, 125, 255, 0.9) 0%,
            rgba(5, 5, 7, 1) 35%,
            rgba(5, 5, 7, 1) 65%,
            rgba(255, 38, 63, 0.9) 100%
        ),
        repeating-linear-gradient(
            -16deg,
            rgba(255,255,255,0.04) 0px,
            rgba(255,255,255,0.04) 1px,
            transparent 1px,
            transparent 8px
        );

    /*
     * Border-only mask
     */
    --border-width: 10px;

    mask-image:
        linear-gradient(#fff 0 0),
        linear-gradient(#fff 0 0);

    mask-size:
        100% 100%,
        calc(100% - var(--border-width) * 2)
        calc(100% - var(--border-width) * 2);

    mask-position:
        center,
        center;

    mask-repeat: no-repeat, no-repeat;
    mask-composite: exclude;

    -webkit-mask-image:
        linear-gradient(#fff 0 0),
        linear-gradient(#fff 0 0);

    -webkit-mask-size:
        100% 100%,
        calc(100% - var(--border-width) * 2)
        calc(100% - var(--border-width) * 2);

    -webkit-mask-position: center, center;
    -webkit-mask-repeat: no-repeat, no-repeat;
    -webkit-mask-composite: xor;

    border: 2px solid rgba(0, 0, 0, 1);

    filter:
        drop-shadow(0 0 12px rgba(255, 38, 63, 0.22))
        drop-shadow(0 0 12px rgba(70, 125, 255, 0.18))
        drop-shadow(0 0 24px rgba(0, 0, 0, 0.85));
}

/* Inner grime overlay */
.minimap-frame::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;

    background:
        radial-gradient(
            circle at top left,
            rgba(255, 38, 63, 0.16),
            transparent 30%
        ),
        radial-gradient(
            circle at bottom right,
            rgba(70, 125, 255, 0.14),
            transparent 30%
        );

    opacity: 0.9;
}

/* Metallic highlight edge */
.minimap-frame::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;

    border:
        1px solid rgba(255,255,255,0.08);

    box-shadow:
        inset 0 0 12px rgba(255,255,255,0.04),
        inset 0 0 20px rgba(255, 38, 63, 0.08);
}
</style>