<script setup lang="ts">
import { computed } from 'vue';
import { useIngameSelector } from '@/composables/useIngame';
import { useClient } from '@/client';
import fbeLogo from '@/assets/72x72.png';
const client = useClient();
const page = useIngameSelector(s => s.gameData.sideInfoPage);
const roster = useIngameSelector(s => s.gameData.scoreboardBottom);
const scoreboard = useIngameSelector(s => s.gameData.scoreboard);
const props = defineProps<{ preview?: boolean }>();
const names = ['Gnar','Vi','Ahri','Jinx','Rakan','Garen','Diana','Swain','Kai’Sa','Nautilus'];
type Source = {name?:string;playerName?:string;displayName?:string;team?:number;champion?:{squareImg?:string;name?:string};displayValue?:number;curValue?:number};
const titles: Record<string,string> = {
  'infopage.gold.total': 'Total Gold',
  'infopage.damage.total': 'Damage Dealt',
  'infopage.experience.total': 'Total Experience',
  'infopage.creepscore.total': 'Creep Score',
  'infopage.rolequest.total': 'Role Quest',
  'infopage.towerplatings.total': 'Tower Plates',
  'infopage.towerplates.total': 'Tower Plates',
};
const title = computed(() => {
  if (props.preview) return 'Damage Dealt';
  const raw = page.value?.title?.trim() ?? '';
  const normalized = raw.toLowerCase();
  if (titles[normalized]) return titles[normalized];
  if (normalized.startsWith('infopage.')) {
    const category = normalized.split('.')[1];
    if (category === 'rolequest' || category === 'rolequests') return 'Role Quest';
    if (category === 'towerplatings' || category === 'towerplates') return 'Tower Plates';
    // Do not broadcast untranslated internal localization keys.
    return 'Player Comparison';
  }
  return raw || 'Player Comparison';
});
const players = computed(()=>{
  const source: Source[] = props.preview ? names.map((name,i)=>({playerName:`Demo ${i+1}`,champion:{name},team:i<5?1:2,displayValue:[12000,8300,23000,19100,4100,13500,9700,21000,17500,5300][i]})) : (page.value?.players??[]) as Source[];
  const rows = source.map((p,i)=>{
    const raw=p.displayValue??p.curValue;
    const value=typeof raw==='number' && Number.isFinite(raw) && raw>=0?raw:null;
    const id=p.playerName||p.name;
    const matches=(roster.value?.teams??[]).flatMap((t,j)=>t.players.filter(m=>!!id&&m.name===id).map(m=>({m,side:j+1})));
    const match=matches.length===1?matches[0]:undefined;
    // Original FBE sidebar uses the backend's 5+5 order; only use that fallback for a full list.
    const side=p.team===1||p.team===2?p.team:match?.side??(source.length===10?(i<5?1:2):0);
    const name=p.displayName?.trim()||match?.m.displayName?.trim()||id?.split('#')[0]?.trim()||p.champion?.name||match?.m.champion?.name||`Player ${i+1}`;
    const champion=p.champion??match?.m.champion;
    return {key:`${side}:${id||i}:${i}`,name,value,side,champion};
  });
  return rows.sort((a,b)=>(b.value??-1)-(a.value??-1));
});
const maximum=computed(()=>Math.max(1,...players.value.map(p=>p.value??0)));
const teamTag=(side:number)=>props.preview?(side===1?'BLUE':'RED'):scoreboard.value?.teams[side-1]?.teamTag || (side===1?'BLUE':'RED');
const format=(n:number|null)=>n===null?'—':n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(1)}K`:Math.round(n).toLocaleString('en-US');
const color=(s:number)=>s===1?'#69a1ff':s===2?'#ff5064':'#a99fa2';
function onError(e:Event){if(e.currentTarget instanceof HTMLImageElement)e.currentTarget.style.visibility='hidden';}
function onLoad(e:Event){if(e.currentTarget instanceof HTMLImageElement)e.currentTarget.style.visibility='visible';}
</script>
<template>
  <Transition name="sidebar">
    <aside v-if="players.length" class="rank-panel">
      <header><img :src="fbeLogo" alt="FBE"/><div><small>{{preview?'DESIGN PREVIEW':'LIVE // PLAYER INTEL'}}</small><h2>{{title}}</h2></div></header>
      <div class="legend"><span class="blue">{{teamTag(1)}}</span><span>RANKED BY VALUE</span><span class="red">{{teamTag(2)}}</span></div>
      <TransitionGroup tag="div" name="rank" class="rank-list">
        <div v-for="(p,i) in players" :key="p.key" class="rank-row" :class="{leader:p.value!==null&&p.value>0&&p.value===maximum}" :style="{'--side':color(p.side)}">
          <span class="rank-number">{{String(i+1).padStart(2,'0')}}</span>
          <div class="portrait"><span>{{p.champion?.name?.slice(0,2)||'—'}}</span><img v-if="p.champion?.squareImg" :src="client.getCacheUrl(p.champion.squareImg)" alt="" @error="onError" @load="onLoad"/></div>
          <div class="info"><div class="name-line"><b :title="p.name">{{p.name}}</b><strong>{{format(p.value)}}</strong></div><div class="track"><div class="fill" :style="{width:`${(p.value??0)/maximum*100}%`}"/></div></div>
        </div>
      </TransitionGroup>
      <footer><span>FBE // LIVE ANALYSIS</span><span>SHARED SCALE</span></footer>
    </aside>
  </Transition>
</template>
<style scoped>
.rank-panel{width:360px;max-height:610px;box-sizing:border-box;padding:0 10px 7px;color:#f5f0eb;font-family:Rajdhani,Inter,'Bebas Neue',Arial,sans-serif;font-variant-numeric:tabular-nums;background:repeating-linear-gradient(-14deg,#ffffff04 0 1px,transparent 1px 9px),linear-gradient(135deg,#260b13,#09090d 45%,#10090d);border:1px solid #ff263f65;border-left:0;border-top:3px solid #ff263f;box-shadow:5px 8px 22px #0008;overflow:hidden;pointer-events:none}.rank-panel *{box-sizing:border-box}header{height:61px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #ff263f40}header img{width:35px;height:35px;object-fit:contain}header div{min-width:0}header small{display:block;font-size:10px;letter-spacing:2px;font-weight:800;color:#a99fa2}h2{margin:3px 0 0;font:900 21px/1 Orbitron,Bahnschrift,Arial,sans-serif;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.legend{height:25px;display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:800;letter-spacing:1px;color:#a99fa2}.blue{color:#69a1ff}.red{color:#ff5064}.rank-list{position:relative;display:flex;flex-direction:column;gap:4px}.rank-row{height:43px;display:flex;align-items:center;gap:7px;padding:4px 6px;background:linear-gradient(90deg,color-mix(in srgb,var(--side) 13%,#141419),#141419 80%);border-left:3px solid var(--side);min-width:0}.rank-row.leader{box-shadow:inset 0 0 0 1px #e2b79399}.rank-number{color:#a99fa2;font-weight:900;font-size:13px;width:19px;flex-shrink:0;text-align:center}.leader .rank-number{color:#e2b793}.portrait{position:relative;display:grid;place-items:center;width:33px;height:33px;flex:0 0 33px;background:#24232b;border:1px solid #ffffff20;overflow:hidden;font-size:10px}.portrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.info{flex:1;min-width:0}.name-line{display:flex;align-items:center;justify-content:space-between;gap:5px;line-height:1}.name-line b{font-size:17px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.name-line strong{font-size:18px;color:var(--side);flex-shrink:0}.track{height:6px;margin-top:5px;background:#282830;overflow:hidden}.fill{height:100%;background:linear-gradient(90deg,color-mix(in srgb,var(--side) 60%,#000),var(--side));transition:width .35s ease}.rank-move{transition:transform .32s ease}.rank-enter-active,.rank-leave-active{transition:opacity .2s ease}.rank-enter-from,.rank-leave-to{opacity:0}.rank-leave-active{position:absolute;width:100%}footer{display:flex;justify-content:space-between;font-size:10px;letter-spacing:1px;font-weight:800;color:#a99fa2;padding-top:9px}.sidebar-enter-active,.sidebar-leave-active{transition:transform .3s ease,opacity .3s ease}.sidebar-enter-from,.sidebar-leave-to{transform:translateX(-100%);opacity:0}@media(prefers-reduced-motion:reduce){.rank-move,.fill,.sidebar-enter-active,.sidebar-leave-active{transition:none}}
</style>
