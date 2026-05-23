<script setup lang="ts">
import { useClient } from '@/client';
import { type killFeedEvent } from '@bluebottle_gg/league-broadcast-client';
import { handleImageError, handleImageLoad } from '@/utils/imageUtils';

defineProps<{
    event: killFeedEvent;
}>();

const client = useClient();
</script>


<template>
    <div class="kill-entry" :class="event.ingameTeamId === 1 ? 'order' : 'chaos'">
        <!-- Assisters -->
        <div class="assisters">
            <img v-for="assister in event.assisters" :key="assister.alias" :src="client.getCacheUrl(assister.squareImg)"
                class="champ-icon assister-icon" :alt="assister.name" @error="handleImageError"
                @load="handleImageLoad" />
        </div>

        <!-- Killer -->
        <img v-if="event.killer" :src="client.getCacheUrl(event.killer.squareImg)" class="champ-icon"
            :alt="event.killer.name" @error="handleImageError" @load="handleImageLoad" />
        <div v-else class="champ-icon placeholder" />

        <!-- Kill separator -->
        <div class="kill-icon-wrapper">
            <div class="kill-icon" aria-hidden="true">⚔</div>
        </div>

        <!-- Victim -->
        <img :src="client.getCacheUrl(event.victim.squareImg)" class="champ-icon victim-icon" :alt="event.victim.name"
            @error="handleImageError" @load="handleImageLoad" />
    </div>
</template>


<style lang="css" scoped>
.kill-entry {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: flex-end;
    gap: 4px;
    padding: 4px 8px 4px 6px;
    width: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 2px;
    backdrop-filter: blur(4px);
    background:
        repeating-linear-gradient(-16deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 8px),
        #050507;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.55);
}

.kill-entry.order {
    border-right: 3px solid var(--blue-team-color);
    background:
        linear-gradient(to left, rgba(70, 125, 255, 0.45), rgba(5, 5, 7, 0.95) 120px),
        repeating-linear-gradient(-16deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 8px),
        #050507;
    box-shadow:
        inset 0 0 0px rgba(70, 125, 255, 0.12),
        0 0 0px rgba(70, 125, 255, 0.18);
}

.kill-entry.chaos {
    border-right: 3px solid var(--red-team-color);
    background:
        linear-gradient(to left, rgba(255, 38, 63, 0.45), rgba(5, 5, 7, 0.95) 120px),
        repeating-linear-gradient(-16deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 8px),
        #050507;
    box-shadow:
        inset 0 0 0px rgba(255, 38, 63, 0.12),
        0 0 0px rgba(255, 38, 63, 0.18);
}

.assisters {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 2px;
    min-width: 0;
}

.champ-icon {
    width: 44px;
    height: 44px;
    object-fit: cover;
    border-radius: 2px;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.85);
}

.assister-icon {
    width: 32px;
    height: 32px;
    opacity: 0.9;
}

.placeholder {
    background-color: rgba(255, 255, 255, 0.08);
}

.kill-icon-wrapper {
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: center;
}

.kill-icon {
    color: var(--theme-text);
    font-size: 24px;
    padding: 0 2px;
    flex-shrink: 0;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8));
}

.kill-entry.order .kill-icon {
    color: #8fb3ff;
    text-shadow: 0 0 8px rgba(70, 125, 255, 0.8);
}

.kill-entry.chaos .kill-icon {
    color: var(--theme-red-bright);
    text-shadow: 0 0 8px rgba(255, 38, 63, 0.8);
}

.victim-icon {
    filter: grayscale(0.55) brightness(0.8);
}
</style>