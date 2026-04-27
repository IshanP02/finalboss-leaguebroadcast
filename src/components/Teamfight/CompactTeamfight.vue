<script setup lang="ts">
import { useIngameSelector } from '@/composables/useIngame';
import { Team } from '@bluebottle_gg/league-broadcast-client';
import { computed } from 'vue';
import BlueBottleGGLogo from '@/assets/blue_bottle-logo-color-bright_outline.svg';
import TeamfightPlayerEntry from './TeamfightPlayerEntry.vue';

const teamfight = useIngameSelector((state) => state.gameData.teamfightDamageOverview);


const blueEntries = computed(() => teamfight?.value?.damageDealt.filter((entry) => entry.team === Team.Order) || []);
const redEntries = computed(() => teamfight?.value?.damageDealt.filter((entry) => entry.team === Team.Chaos) || []);
</script>


<template>
    <Transition name="slide-down">
        <div v-if="teamfight" class="teamfight-container">
            <div class="team-container">
                <TransitionGroup appear>
                    <TeamfightPlayerEntry class="team-entry" v-for="(entry, index) in blueEntries" :key="index"
                        :data="entry">

                    </TeamfightPlayerEntry>
                </TransitionGroup>
            </div>
            <BlueBottleGGLogo class="teamfight-logo" />

            <div class="team-container">
                <TransitionGroup appear>
                    <TeamfightPlayerEntry class="team-entry " v-for="(entry, index) in redEntries" :key="index"
                        :data="entry" mirror>

                    </TeamfightPlayerEntry>
                </TransitionGroup>
            </div>
        </div>
    </Transition>
</template>


<style lang="css" scoped>
.teamfight-container {
    display: grid;
    grid-template-columns: 1fr 100px 1fr;
    grid-template-rows: auto;
    align-items: center;

}

.team-container {
    display: flex;
    flex-direction: row;
    gap: 4px;
    padding: 8px;
    height: 100%;
    align-items: flex-end;
}

.team-container.mirror {
    flex-direction: row-reverse;
}

.team-entry {
    flex: 1;
    width: 100%;
}

.teamfight-logo {
    margin-top: auto;
    height: 100px;
}

.slide-down-enter-active {
    transition: transform 0.5s ease 0.5s;
}

.slide-down-leave-active {
    transition: transform 0.5s ease
}

.slide-down-enter-from,
.slide-down-leave-to {
    transform: translateY(100%);
}
</style>