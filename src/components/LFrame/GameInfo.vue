<script setup lang="ts">
import { useIngameSelector } from '@/composables/useIngame';
import BBLogo from '@/assets/blue_bottle-logo-color-bright_outline.svg';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import FadeTransition from '../../transitions/FadeTransition.vue';

const patch = useIngameSelector((s) => s.gameData.patch);
const otherInfo = ["FINAL BOSS ESPORTS"];
const allInfo = computed(() => [...otherInfo, `PATCH ${patch.value}`]);

const currentInfoIndex = ref(0);
const currentInfo = computed(() => allInfo.value[currentInfoIndex.value] ?? '');
const infoRotationInterval = 15000; // Rotate info every 15 seconds
const rotationTimer = ref<number | null>(null);

onMounted(() => {
    rotationTimer.value = setInterval(() => {
        currentInfoIndex.value = (currentInfoIndex.value + 1) % allInfo.value.length;
    }, infoRotationInterval);
});

onUnmounted(() => {
    if (rotationTimer.value !== null) {
        clearInterval(rotationTimer.value);
    }
});
</script>

<template>
    <div class="flex flex-row justify-between items-center pl-2 pr-10 py-1 w-full h-full">
        <div class="info-text-slot">
            <FadeTransition mode="out-in">
                <span :key="currentInfoIndex" class="patch-text">{{ currentInfo }}</span>
            </FadeTransition>
        </div>
    </div>

</template>

<style lang="css" scoped>
.flex {
    position: relative;
    overflow: hidden;
    background:
        linear-gradient(90deg, rgba(177, 18, 38, 0.32), rgba(5, 5, 7, 0.98) 38%, #050507),
        repeating-linear-gradient(-16deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 8px);
    border: 1px solid var(--theme-border-soft);
    box-shadow:
        inset 0 0 14px rgba(255, 38, 63, 0.12),
        0 0 12px rgba(0, 0, 0, 0.65);
}

.flex::before {
    content: "";
    position: absolute;
    left: 0;
    top: 20%;
    bottom: 20%;
    width: 3px;
    background: var(--theme-red-bright);
    box-shadow: 0 0 10px rgba(255, 38, 63, 0.8);
}

:deep(svg) {
    position: relative;
    z-index: 1;
    filter:
        drop-shadow(0 0 4px rgba(0, 0, 0, 0.9))
        drop-shadow(0 0 8px rgba(255, 38, 63, 0.25));
}

.info-text-slot {
    display: grid;
    justify-items: end;
    align-items: center;
    overflow: hidden;
    position: relative;
    z-index: 1;
}

.patch-text {
    grid-area: 1 / 1;
    color: var(--theme-text);
    font-size: 24px;
    line-height: 1;
    font-family: "Bebas Neue", sans-serif;
    font-weight: bold;
    white-space: nowrap;
    letter-spacing: 0.06em;
    text-shadow:
        0 0 4px black,
        0 0 10px rgba(255, 38, 63, 0.55);
}
</style>