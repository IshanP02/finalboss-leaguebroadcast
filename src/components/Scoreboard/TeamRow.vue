<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { BestOfType, ingameScoreboardTeamData } from '@bluebottle_gg/league-broadcast-client';
import { useClient } from '@/client';
import MatchScore from './MatchScore.vue';
import Gold from '@/assets/gold.png';
import Tower from '@/assets/tower.png';
import { handleImageError, handleImageLoad } from '@/utils/imageUtils';
const props=defineProps<{team:ingameScoreboardTeamData;bestOf:BestOfType;mirror?:boolean;enemyTeamGold?:number}>();
const client=useClient();
const formattedGold=computed(()=>props.team.gold>=1000?`${(props.team.gold/1000).toFixed(1)}K`:String(Math.floor(props.team.gold)));
const goldDiff=computed(()=>props.enemyTeamGold===undefined?null:Math.floor(props.team.gold-props.enemyTeamGold));
const goldDiffText=computed(()=>{const diff=goldDiff.value;return diff===null||diff<=0?'':`+${diff>=1000?(diff/1000).toFixed(1)+'K':diff}`;});
const showGoldDiff=ref(false);
watch(goldDiff,diff=>{if(diff===null||diff<300)showGoldDiff.value=false;else if(diff>500)showGoldDiff.value=true;},{immediate:true});
const sideColor=computed(()=>props.mirror?'#ff5064':'#69a1ff');
</script>
<template>
  <div class="team-row" :class="{mirror}" :style="{'--side':sideColor}">
    <MatchScore class="series" :best-of="bestOf" :fill-color="sideColor" :wins="team.seriesScore?.wins??0" :mirror="mirror"/>
    <div class="team-logo"><span>{{team.teamTag}}</span><img v-if="team.teamIconUrl" :key="team.teamIconUrl" :src="client.getCacheUrl(team.teamIconUrl)" :alt="team.teamTag" @error="handleImageError" @load="handleImageLoad"/></div>
    <div class="identity"><strong>{{team.teamTag}}</strong><small>{{team.infoText}}</small></div>
    <div class="tower stat"><img :src="Tower" alt="Towers"/><b>{{team.towers}}</b></div>
    <div class="economy"><div class="stat gold"><img :src="Gold" alt="Gold"/><b>{{formattedGold}}</b></div><div class="lead"><span v-if="showGoldDiff">{{goldDiffText}}</span></div></div>
    <div class="kills"><strong>{{team.kills}}</strong><small>KILLS</small></div>
  </div>
</template>
<style scoped>
.team-row{display:flex;align-items:center;gap:6px;padding:6px;min-width:0;height:100%;box-sizing:border-box;overflow:hidden;background:repeating-linear-gradient(-14deg,#ffffff04 0 1px,transparent 1px 9px),linear-gradient(100deg,color-mix(in srgb,var(--side) 17%,#0c0c11),#0c0c11 78%);border-left:3px solid var(--side);color:#f5f0eb}
.team-row.mirror{flex-direction:row-reverse;text-align:right;border-left:0;border-right:3px solid var(--side);background:repeating-linear-gradient(14deg,#ffffff04 0 1px,transparent 1px 9px),linear-gradient(260deg,color-mix(in srgb,var(--side) 17%,#0c0c11),#0c0c11 78%)}
.series{flex:0 0 25px;height:100%;align-self:stretch}.team-logo{position:relative;display:grid;place-items:center;flex:0 0 49px;height:49px;color:var(--side);font-size:14px;font-weight:900;overflow:hidden;text-align:center}.team-logo img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 3px 5px #0008)}.team-logo:has(img:not([style*="hidden"]):not([style*="display: none"])) span{visibility:hidden}
.identity{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.identity strong{color:var(--side);font:900 22px/1 Rajdhani,Inter,Arial,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.identity small{font-size:11px;line-height:1.1;color:#a99fa2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}
.stat{display:flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap;font-weight:900}.stat img{width:19px;height:19px;object-fit:contain}.stat b{font:900 23px/1 'Bebas Neue',Rajdhani,Arial,sans-serif}.tower{flex:0 0 39px}.economy{flex:0 0 74px;display:flex;flex-direction:column;align-items:center;gap:2px}.gold b{color:#f2d5a7}.lead{height:16px;display:flex;align-items:center;justify-content:center}.lead span{font-size:12px;line-height:14px;padding:0 5px;font-weight:900;white-space:nowrap;color:var(--side);border:1px solid color-mix(in srgb,var(--side) 45%,transparent);background:color-mix(in srgb,var(--side) 12%,#101014)}
.kills{display:flex;flex-direction:column;justify-content:center;align-items:center;flex:0 0 47px;height:100%;background:#ffffff06;border-inline-start:1px solid #ffffff14}.mirror .kills{border-inline-start:0;border-inline-end:1px solid #ffffff14}.kills strong{font:900 40px/.95 'Bebas Neue',Rajdhani,Arial,sans-serif}.kills small{color:#a99fa2;font-size:9px;font-weight:800;letter-spacing:1.2px}.mirror .stat{flex-direction:row-reverse}
</style>
