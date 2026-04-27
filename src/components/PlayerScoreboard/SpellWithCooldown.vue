<script setup lang="ts">
import { handleImageError, handleImageLoad } from '@/utils/imageUtils';
import { computed } from 'vue';
import FadeTransition from '../../transitions/FadeTransition.vue';


const props = withDefaults(defineProps<{
    img?: string,
    cooldown?: number,
    totalCooldown?: number,
    showTimer?: boolean,
    skilled?: boolean
}>(), {
    img: '',
    cooldown: 0,
    totalCooldown: 0,
    showTimer: true,
    skilled: false
})

const cooldownPercent = computed(() => {
    if (!props.cooldown || !props.totalCooldown) {
        return 0
    }
    return Math.min(100, Math.max(0, ((props.totalCooldown - props.cooldown) / props.totalCooldown) * 100))
})

</script>

<template>
    <div class="relative overflow-hidden">
        <div v-if="props.cooldown !== 0" class="absolute h-full w-full timer-fill"
            :style="{ '--cooldown-fill': cooldownPercent * 3.6 + `deg` }">
        </div>
        <FadeTransition>
            <p class="cooldown-text" v-if="showTimer && cooldown !== 0 && cooldown <= 10">{{
                Math.ceil(cooldown) }}</p>
        </FadeTransition>
        <img v-if="skilled" class="h-full w-full object-cover block" :src="img" @error="handleImageError"
            @load="handleImageLoad" />
    </div>
</template>

<style lang="css" scoped>
.timer-fill {
    background: conic-gradient(transparent 0deg var(--cooldown-fill), rgba(0, 0, 0, 0.7) var(--cooldown-fill) 360deg);
    transition: --cooldown-fill 0.5s linear;
}

.cooldown-text {
    position: absolute;
    height: 100%;
    width: 100%;
    text-align: center;
    color: white;
    font-family: "Bebas Neue", sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
}

@property --cooldown-fill {
    syntax: '<angle>';
    /* its type */
    inherits: false;
    initial-value: 0deg;
    /* the initial value */
}
</style>