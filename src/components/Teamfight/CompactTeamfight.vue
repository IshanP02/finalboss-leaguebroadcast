<script setup lang="ts">
import { useIngameSelector } from '@/composables/useIngame';
import { Team } from '@bluebottle_gg/league-broadcast-client';
import { computed } from 'vue';
import fbeLogo from '@/assets/72x72.png';
import TeamfightPlayerEntry from './TeamfightPlayerEntry.vue';
const teamfight=useIngameSelector(s=>s.gameData.teamfightDamageOverview);
const scoreboard=useIngameSelector(s=>s.gameData.scoreboard);
const blueEntries=computed(()=>teamfight.value?.damageDealt.filter(entry=>entry.team===Team.Order)??[]);
const redEntries=computed(()=>teamfight.value?.damageDealt.filter(entry=>entry.team===Team.Chaos)??[]);
const blueTag=computed(()=>scoreboard.value?.teams[0]?.teamTag||'BLUE');
const redTag=computed(()=>scoreboard.value?.teams[1]?.teamTag||'RED');
</script>
<template>
  <Transition name="slide-down">
    <div v-if="teamfight" class="teamfight-container">
      <header><span class="blue">{{blueTag}}</span><div><img :src="fbeLogo" alt="FBE"/><strong>TEAMFIGHT // LIVE</strong></div><span class="red">{{redTag}}</span></header>
      <div class="fight-body">
        <div class="team-container order"><TransitionGroup name="fighter" appear><TeamfightPlayerEntry v-for="(entry,index) in blueEntries" :key="index" class="team-entry" :data="entry" :style="{'--delay':`${(blueEntries.length-1-index)*70}ms`}"/></TransitionGroup></div>
        <div class="fight-center"><span>VS</span></div>
        <div class="team-container chaos"><TransitionGroup name="fighter" appear><TeamfightPlayerEntry v-for="(entry,index) in redEntries" :key="index" class="team-entry" :data="entry" mirror :style="{'--delay':`${index*70}ms`}"/></TransitionGroup></div>
      </div>
    </div>
  </Transition>
</template>
<style scoped>
.teamfight-container{width:100%;height:100%;min-height:0;box-sizing:border-box;display:grid;grid-template-rows:34px minmax(0,1fr);background:linear-gradient(135deg,#260b13,#09090d 45%,#10090d);border:1px solid #ff263f60;border-top:3px solid #ff263f;box-shadow:0 -5px 18px #0009;color:#f5f0eb;font-family:Rajdhani,Inter,'Bebas Neue',Arial,sans-serif;pointer-events:none;overflow:hidden}
header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 12px;border-bottom:1px solid #ff263f35;font-size:15px;font-weight:900;letter-spacing:1px}header div{display:flex;align-items:center;gap:7px}header img{height:22px;width:22px;object-fit:contain}header strong{font:900 14px/1 Orbitron,Bahnschrift,Arial,sans-serif}header .blue{color:#69a1ff}header .red{color:#ff5064;text-align:right}
.fight-body{display:grid;grid-template-columns:minmax(0,1fr) 38px minmax(0,1fr);min-height:0;overflow:hidden}.team-container{display:flex;gap:4px;align-items:flex-end;min-width:0;min-height:0;padding:3px 6px 4px;box-sizing:border-box}.team-container.order{border-left:3px solid #69a1ff;background:linear-gradient(90deg,#69a1ff12,transparent 80%)}.team-container.chaos{border-right:3px solid #ff5064;background:linear-gradient(270deg,#ff506412,transparent 80%)}.team-entry{flex:1;min-width:0;width:100%;max-height:100%}.team-entry :deep(.area-items){min-height:0}.team-entry :deep(.area-items .item-slot){min-height:0;flex-shrink:1;max-height:28px}.fight-center{display:grid;place-items:center;background:#ffffff04;border-inline:1px solid #ff263f25}.fight-center span{font:900 14px/1 Orbitron,Bahnschrift,Arial,sans-serif;color:#a99fa2}
.slide-down-enter-active,.slide-down-leave-active{transition:transform .3s ease,opacity .3s ease}.slide-down-enter-from,.slide-down-leave-to{transform:translateY(100%);opacity:0}.fighter-enter-active{transition:opacity .3s ease var(--delay,0ms),transform .3s ease var(--delay,0ms)}.fighter-enter-from{opacity:0;transform:translateY(25px)}@media(prefers-reduced-motion:reduce){.slide-down-enter-active,.slide-down-leave-active,.fighter-enter-active{transition:none}}
</style>
