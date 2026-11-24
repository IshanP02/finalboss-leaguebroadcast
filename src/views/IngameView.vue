<script setup lang="ts">
import { computed } from 'vue';
import Scoreboard from '@/components/Scoreboard/Scoreboard.vue';
import GoldGraph from '@/components/GoldGraph/GoldGraph.vue';
import {buildLiveGold} from '@/components/GoldGraph/liveGoldData';
import PlayerScoreboard from '@/components/PlayerScoreboard/PlayerScoreboard.vue';
import ObjectiveTimer from '@/components/ObjectiveTimer/ObjectiveTimer.vue';
import { useIngameSelector } from '@/composables/useIngame';
import MinimapFrame from '@/components/Minimap/MinimapFrame.vue';
import LFrame from '@/components/LFrame/LFrame.vue';
import SkinDisplay from '@/components/SidePanel/SkinDisplay.vue';
import { Team } from '@bluebottle_gg/league-broadcast-client';
import CompactTeamfight from '@/components/Teamfight/CompactTeamfight.vue';
import SmiteReaction from '@/components/SmiteReaction/SmiteReaction.vue';
import PlayerCameras from '@/components/PlayerCameras/PlayerCameras.vue';
import KillFeed from '@/components/KillFeed/KillFeed.vue';
import DamageGraph from '@/components/DamageGraph/DamageGraph.vue';
import FbeLiveBottom from '@/components/LiveAnalysis/FbeLiveBottom.vue';
import FbeObjectiveDamage from '@/components/LiveAnalysis/FbeObjectiveDamage.vue';
import FbeStealAlert from '@/components/LiveAnalysis/FbeStealAlert.vue';
import { useFbeLiveAnalysis } from '@/composables/useFbeLiveAnalysis';
const baronTimer=useIngameSelector(s=>s.gameData.baronPitTimer);
const dragonTimer=useIngameSelector(s=>s.gameData.dragonPitTimer);
const gameTime=useIngameSelector(s=>s.gameData.gameTime);
const gold=useIngameSelector(s=>s.gameData.goldGraph);
const {bottom,compact,objective,alert,preview,active}=useFbeLiveAnalysis();
const goldActive=computed(()=>preview.value==='gold'||(!preview.value&&active.value&&buildLiveGold(gold.value?.current?.goldAtTime).length>=2));
const showGold=computed(()=>!bottom.value&&!compact.value&&goldActive.value);
const showNormal=computed(()=>!bottom.value&&!compact.value&&!showGold.value);
</script>
<template>
  <div class="overlay">
    <Scoreboard class="overlay-scoreboard"/>
    <Transition name="bottom-slide"><PlayerScoreboard v-if="showNormal" class="overlay-playerscoreboard"/></Transition>
    <Transition name="bottom-slide"><PlayerCameras v-if="!compact&&!showGold" class="overlay-playercameras"/></Transition>
    <div class="overlay-objective-timers"><ObjectiveTimer :objective-data="baronTimer" :game-time="gameTime"/><ObjectiveTimer :objective-data="dragonTimer" :game-time="gameTime"/></div>
    <MinimapFrame class="overlay-minimap"/><LFrame class="overlay-lframe"/>
    <div class="hidden-skin-display"><SkinDisplay :team="Team.Order"/><SkinDisplay :team="Team.Chaos" mirror/></div>
    <SmiteReaction class="overlay-smitereaction"/><KillFeed class="overlay-killfeed"/>
    <div v-if="showGold" class="overlay-bottom"><GoldGraph :preview="preview==='gold'"/></div>
    <div v-if="compact" class="overlay-teamfight"><CompactTeamfight/></div>
    <Transition name="analysis" mode="out-in"><div v-if="bottom" :key="bottom.kind" class="overlay-analysis"><FbeLiveBottom :model="bottom" :preview="preview"/></div></Transition>
    <Transition name="sidebar-slot" mode="out-in"><div v-if="objective" key="objective" class="overlay-damagegraph"><FbeObjectiveDamage :model="objective" :preview="preview"/></div><div v-else key="ranked" class="overlay-damagegraph"><DamageGraph :preview="preview==='sidebar'"/></div></Transition>
    <FbeStealAlert :alert="alert" :preview="preview"/>
  </div>
</template>
<style scoped>
.overlay{position:relative;width:1920px;height:1080px;overflow:hidden}.overlay-scoreboard{position:absolute;top:10px;left:50%;transform:translateX(-50%)}.overlay-bottom{position:absolute;bottom:0;left:0;width:calc(1920px - 285px);height:260px;z-index:99}.overlay-playerscoreboard,.overlay-teamfight,.overlay-analysis{position:absolute;bottom:0;left:461px;right:461px;height:260px}.overlay-teamfight,.overlay-analysis{z-index:90;pointer-events:none}.overlay-playercameras{position:absolute;bottom:0;left:285px;right:285px;height:260px}.overlay-objective-timers{position:absolute;top:10px;left:10px;display:flex;gap:4px}.overlay-damagegraph{position:absolute;left:0;top:200px;z-index:50;pointer-events:none}.overlay-minimap{position:absolute;bottom:0;right:0;width:285px;height:280px}.overlay-lframe{position:absolute;bottom:0;left:0;width:285px;height:260px}.overlay-killfeed{position:absolute;top:100px;right:0}.hidden-skin-display{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden}.bottom-slide-enter-active,.bottom-slide-leave-active,.analysis-enter-active,.analysis-leave-active{transition:transform .3s ease,opacity .3s ease}.bottom-slide-enter-from,.bottom-slide-leave-to,.analysis-enter-from,.analysis-leave-to{transform:translateY(100%);opacity:0}.sidebar-slot-enter-active,.sidebar-slot-leave-active{transition:opacity .2s ease}.sidebar-slot-enter-from,.sidebar-slot-leave-to{opacity:0}@media(prefers-reduced-motion:reduce){.bottom-slide-enter-active,.bottom-slide-leave-active,.analysis-enter-active,.analysis-leave-active,.sidebar-slot-enter-active,.sidebar-slot-leave-active{transition:none}}
</style>
