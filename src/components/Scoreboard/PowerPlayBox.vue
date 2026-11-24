<script setup lang="ts">
import { computed } from 'vue';
import { getRemaining, type ingameObjectivePowerPlay } from '@bluebottle_gg/league-broadcast-client';
import { useIngameSelector } from '@/composables/useIngame';
import Baron from '@/assets/baron/baron.png';
import Elder from '@/assets/dragon/elder.png';
import FadeTransition from '@/transitions/FadeTransition.vue';
const props=defineProps<{type:'baron'|'elder';powerPlay?:ingameObjectivePowerPlay;mirror?:boolean}>();
const gameTime=useIngameSelector(s=>s.gameData.gameTime);
const remaining=computed(()=>Math.max(0,getRemaining(props.powerPlay?.timeEnd,gameTime.value)));
const isActive=computed(()=>!!props.powerPlay&&gameTime.value>=props.powerPlay.timeStart&&remaining.value>0);
const timerText=computed(()=>{const s=Math.ceil(remaining.value);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;});
const goldText=computed(()=>{const gold=props.powerPlay?.gold;return typeof gold!=='number'||!Number.isFinite(gold)?'—':`${gold>0?'+':gold<0?'−':''}${Math.abs(gold)>=1000?(Math.abs(gold)/1000).toFixed(1)+'K':Math.round(Math.abs(gold))}`;});
const progress=computed(()=>{const p=props.powerPlay;const duration=p&&typeof p.timeEnd==='number'&&typeof p.timeStart==='number'?p.timeEnd-p.timeStart:0;return duration>0?Math.max(0,Math.min(100,remaining.value/duration*100)):0;});
</script>
<template>
  <FadeTransition><div v-if="isActive" class="power-play" :class="[type,{mirrored:mirror}]">
    <div class="power-head"><img :src="type==='baron'?Baron:Elder" :alt="type"/><div><small>POWER PLAY</small><b>{{type==='baron'?'BARON':'ELDER'}}</b></div></div>
    <div class="power-play-row"><div><small>TIME LEFT</small><strong>{{timerText}}</strong></div><div><small>GOLD</small><strong>{{goldText}}</strong></div></div>
    <div class="progress"><i :style="{width:`${progress}%`}"/></div>
  </div></FadeTransition>
</template>
<style scoped>
.power-play{--buff:#b99af9;box-sizing:border-box;width:100%;height:84px;overflow:hidden;padding:5px 8px 4px;color:#f5f0eb;background:linear-gradient(125deg,color-mix(in srgb,var(--buff) 19%,#111017),#0c0b10 75%);border:1px solid color-mix(in srgb,var(--buff) 50%,transparent);border-top:3px solid var(--buff);font-family:Rajdhani,Inter,'Bebas Neue',Arial,sans-serif;font-variant-numeric:tabular-nums;box-shadow:0 4px 12px #0009}.power-play.elder{--buff:#e2b793}.power-head{display:flex;align-items:center;gap:6px;height:27px}.power-head img{width:26px;height:26px;object-fit:contain}.power-head div{display:flex;flex-direction:column}.power-head small,.power-play-row small{font-size:9px;color:#bcb3b8;line-height:1;font-weight:800;letter-spacing:.8px}.power-head b{font-size:14px;line-height:1;color:var(--buff);font-weight:900;letter-spacing:1px}.power-play-row{display:flex;justify-content:space-between;gap:5px;margin-top:3px}.power-play-row>div{display:flex;flex-direction:column;gap:1px}.power-play-row strong{font:900 23px/.95 'Bebas Neue',Rajdhani,Arial,sans-serif;white-space:nowrap}.power-play-row>div:last-child{text-align:right;color:var(--buff)}.progress{height:3px;margin-top:4px;background:#ffffff15}.progress i{display:block;height:100%;background:var(--buff);transition:width .35s linear}.mirrored .power-head{flex-direction:row-reverse;text-align:right}.mirrored .power-play-row{flex-direction:row-reverse}.mirrored .power-play-row>div:first-child{text-align:right}.mirrored .power-play-row>div:last-child{text-align:left}.mirrored .progress{display:flex;justify-content:flex-end}
</style>
