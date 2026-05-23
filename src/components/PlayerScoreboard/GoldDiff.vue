<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    orderGold: number
    chaosGold: number
}>()

const diff = computed(() => props.orderGold - props.chaosGold)

const formattedDiff = computed(() => {
    const d = Math.abs(diff.value)
    if (d >= 1000) return (d / 1000).toFixed(1) + 'K'
    return Math.floor(d).toString()
})

const leadingTeam = computed(() => {
    if (diff.value > 0) return 'order'
    if (diff.value < 0) return 'chaos'
    return null
})
</script>

<template>
    <div class="gold-diff">
        <div
            v-if="leadingTeam === 'order'"
            class="lead-arrow lead-arrow-order"
        />

        <span class="gold-value">{{ formattedDiff }}</span>

        <div
            v-if="leadingTeam === 'chaos'"
            class="lead-arrow lead-arrow-chaos"
        />
    </div>
</template>

<style lang="css" scoped>
.gold-diff {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    border-left: 1px solid rgba(255, 255, 255, 0.12);
    border-right: 1px solid rgba(255, 255, 255, 0.12);

    overflow: visible;

    background:
        linear-gradient(
            180deg,
            rgba(255,255,255,0.02),
            rgba(0,0,0,0.08)
        );
}

.gold-value {
    font-family: "Bebas Neue", sans-serif;
    font-size: 24px;
    line-height: 24px;
    color: white;

    text-shadow:
        0 0 4px black,
        0 0 8px rgba(255,255,255,0.08);

    z-index: 2;
}

.lead-arrow {
    position: absolute;

    top: 50%;

    width: 8px;
    height: 18px;

    transform: translateY(-50%);

    z-index: 3;

    opacity: 0.95;
}

/* Blue side lead */
.lead-arrow-order {
    left: 4px;

    background:
        linear-gradient(
            180deg,
            rgba(120,170,255,1),
            rgba(70,125,255,1)
        );

    clip-path: polygon(
        100% 0,
        0 50%,
        100% 100%
    );

    box-shadow:
        0 0 6px rgba(70,125,255,0.55);
}

/* Red side lead */
.lead-arrow-chaos {
    right: 4px;

    background:
        linear-gradient(
            180deg,
            rgba(255,90,110,1),
            rgba(255,38,63,1)
        );

    clip-path: polygon(
        0 0,
        100% 50%,
        0 100%
    );

    box-shadow:
        0 0 6px rgba(255,38,63,0.55);
}
</style>