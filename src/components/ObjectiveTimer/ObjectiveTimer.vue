<script setup lang="ts">
import { IngameObjectiveType, getRemaining, type iObjectiveRespawnData } from '@bluebottle_gg/league-broadcast-client';
import { computed } from 'vue';
import Baron from '@/assets/baron/baron.png';
import Herald from '@/assets/baron/herald.png';
import Grub from '@/assets/baron/grubs.png';
import Air from '@/assets/dragon/air.png';
import Chemtech from '@/assets/dragon/chemtech.png';
import Hextech from '@/assets/dragon/hextech.png';
import Earth from '@/assets/dragon/earth.png';
import Fire from '@/assets/dragon/fire.png';
import Water from '@/assets/dragon/water.png';
import Elder from '@/assets/dragon/elder.png';
import FadeTransition from '@/transitions/FadeTransition.vue';
const props=defineProps<{objectiveData?:iObjectiveRespawnData;gameTime?:number}>();
const objectiveType=computed(()=>{const t=props.objectiveData?.type;return typeof t==='string'?IngameObjectiveType[t as keyof typeof IngameObjectiveType]:t;});
const remaining=computed(()=>{if(props.objectiveData?.timeAlive===undefined||props.gameTime===undefined)return undefined;const t=getRemaining(props.objectiveData.timeAlive,props.gameTime);return Number.isFinite(t)?Math.max(0,Math.ceil(t)):undefined;});
const clock=computed(()=>{const t=remaining.value;if(t===undefined)return '—';if(t===0)return 'LIVE';return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;});
const objective=computed(()=>{
  switch(objectiveType.value){
    case IngameObjectiveType.BARON:return {name:'BARON',icon:Baron,color:'#b99af9'};
    case IngameObjectiveType.HERALD:return {name:'HERALD',icon:Herald,color:'#b99af9'};
    case IngameObjectiveType.GRUB:return {name:'GRUBS',icon:Grub,color:'#b99af9'};
    case IngameObjectiveType.DRAGON_AIR:return {name:'CLOUD',icon:Air,color:'#b9d6ed'};
    case IngameObjectiveType.DRAGON_CHEMTECH:return {name:'CHEMTECH',icon:Chemtech,color:'#a5d96c'};
    case IngameObjectiveType.DRAGON_HEXTECH:return {name:'HEXTECH',icon:Hextech,color:'#6acfe9'};
    case IngameObjectiveType.DRAGON_EARTH:return {name:'MOUNTAIN',icon:Earth,color:'#d5b38a'};
    case IngameObjectiveType.DRAGON_FIRE:return {name:'INFERNAL',icon:Fire,color:'#ff9869'};
    case IngameObjectiveType.DRAGON_WATER:return {name:'OCEAN',icon:Water,color:'#62d5ba'};
    case IngameObjectiveType.DRAGON_ELDER:return {name:'ELDER',icon:Elder,color:'#e2b793'};
    default:return undefined;
  }
});
</script>
<template>
  <FadeTransition><div v-if="objective" class="objective-timer" :class="{live:remaining===0}" :style="{'--objective':objective.color}">
    <div class="objective-icon"><img :src="objective.icon" :alt="objective.name"/></div>
    <div class="timer-info"><small>{{objective.name}}</small><strong>{{clock}}</strong></div>
  </div></FadeTransition>
</template>
<style scoped>
.objective-timer{height:50px;width:133px;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:5px 7px;background:linear-gradient(115deg,color-mix(in srgb,var(--objective) 13%,#101014),#09090d 75%);border:1px solid #ff263f45;border-left:3px solid var(--objective);box-shadow:0 3px 10px #0009;color:#f5f0eb;font-family:Rajdhani,Inter,'Bebas Neue',Arial,sans-serif;font-variant-numeric:tabular-nums;pointer-events:none}
.objective-icon{flex:0 0 33px;width:33px;height:33px;display:grid;place-items:center;background:#ffffff05;border:1px solid #ffffff15}.objective-icon img{width:100%;height:100%;padding:2px;object-fit:contain;filter:drop-shadow(0 2px 4px #0009)}.timer-info{min-width:0;display:flex;flex-direction:column;gap:2px}.timer-info small{color:var(--objective);font-size:10px;letter-spacing:.6px;line-height:1;font-weight:900;white-space:nowrap}.timer-info strong{font:900 26px/.95 'Bebas Neue',Rajdhani,Arial,sans-serif;letter-spacing:.5px;white-space:nowrap}.live .timer-info strong{color:var(--objective);font-size:22px}
</style>
