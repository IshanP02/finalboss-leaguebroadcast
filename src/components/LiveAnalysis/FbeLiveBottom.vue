<script setup lang="ts">
import { computed } from 'vue';
import { useClient } from '@/client';
import fbeLogo from '@/assets/72x72.png';
import { amount, compact, sideColor, COLORS, type BottomModel, type PlayerRow } from './liveAnalysisData';
const props=defineProps<{ model:BottomModel; preview?:string }>();
const client=useClient();
const image=(p?:string)=>p?client.getCacheUrl(p):undefined;
const hide=(e:Event)=>{if(e.currentTarget instanceof HTMLImageElement)e.currentTarget.style.visibility='hidden';};
const show=(e:Event)=>{if(e.currentTarget instanceof HTMLImageElement)e.currentTarget.style.visibility='visible';};
const rows=computed(()=>props.model.kind==='finish'?[]:Array.from({length:Math.max(props.model.rows[0].length,props.model.rows[1].length)},(_,i)=>({left:props.model.kind==='finish'?undefined:props.model.rows[0][i],right:props.model.kind==='finish'?undefined:props.model.rows[1][i],label:props.model.kind==='efficiency'?props.model.labels[i]:'VS'})));
function width(n:number|null, max:number){return `${Math.min(100,Math.max(0,(n??0)/max*100))}%`;}
function value(p:PlayerRow){return props.model.kind==='efficiency'?(p.value===null?'—':p.value.toFixed(2)):compact(p.value);}
function relative(n:number){const ms=Math.round(n*1000);return ms===0?'0 ms':`${ms<0?'−':'+'}${Math.abs(ms)>=1000?(Math.abs(ms)/1000).toFixed(2)+' s':Math.abs(ms)+' ms'}`;}
</script>
<template>
  <section class="live-panel" :class="model.kind" :key="model.kind">
    <header><img :src="fbeLogo" alt="FBE"/><h2>{{model.title}}</h2><span class="context">{{ model.kind==='finish'? model.objective+' · '+model.context:model.context }}</span><span v-if="preview" class="preview">DESIGN PREVIEW</span></header>
    <template v-if="model.kind==='finish'">
      <div class="sequence" :style="{gridTemplateColumns:`repeat(${model.events.length}, minmax(0,1fr))`}">
        <div v-for="e in model.events" :key="e.key" class="hit" :class="{final:e.final,separated:e.separated}" :style="{'--side':sideColor(e.side)}">
          <small>{{relative(e.relative)}}</small><div class="marker"></div>
          <img v-if="e.portrait" :src="image(e.portrait)" alt="" @error="hide" @load="show"/>
          <strong class="hit-name">{{e.name}}</strong><b :style="{color:COLORS[e.type]??COLORS[3]}">{{amount(e.damage)}}</b>
          <span class="hit-note">{{e.final?'FINAL HIT':e.smite?'SMITE':'HIT'}}</span>
        </div>
      </div>
      <footer><b :style="{color:sideColor(model.winnerSide)}">{{model.winnerSide ? model.winner + ' // FINAL HIT' : 'FINAL-HIT TEAM UNKNOWN'}}</b><span v-if="model.share!==null">{{(model.share*100).toFixed(0)}}% OF RECORDED DAMAGE</span><span v-if="model.reaction!==null">SMITE REACTION {{relative(model.reaction)}}</span></footer>
    </template>
    <template v-else>
      <div class="team-head"><b class="blue">{{model.teams[0]}} <template v-if="model.kind==='fight'">// {{compact(model.totals[0])}}</template></b><small>{{model.kind==='fight'?'CHAMPION DAMAGE':'DAMAGE / GOLD'}}</small><b class="red">{{model.teams[1]}} <template v-if="model.kind==='fight'">// {{compact(model.totals[1])}}</template></b></div>
      <div class="rows">
        <div v-for="(r,i) in rows" :key="i" class="row">
          <div v-for="(p,j) in [r.left,r.right]" :key="j" class="player" :class="{mirror:j===1,missing:!p}" :style="{'--side':sideColor(j+1),gridColumn:j===0?1:3}">
            <template v-if="p">
              <div class="portrait" :class="{dead:p.died}"><img v-if="p.champion?.squareImg" :src="image(p.champion.squareImg)" :alt="p.champion.name" @error="hide" @load="show"/><span v-else>{{p.champion?.name?.slice(0,2)||'—'}}</span></div>
              <div class="player-info"><div class="name-line"><b :title="p.name">{{p.name}}</b><strong>{{value(p)}}</strong></div><div class="track"><div class="fill" :style="{width:width(p.value,model.max)}"><template v-if="model.kind==='fight' && p.value && p.value>0"><i v-for="(v,k) in p.parts" :key="k" :style="{width:`${v/p.value*100}%`,background:COLORS[k]}"/></template></div></div></div>
            </template><span v-else>—</span>
          </div>
          <span class="slot">{{r.label}}</span>
        </div>
      </div>
      <footer v-if="model.kind==='fight'" class="legend"><span v-for="(s,i) in ['PHYSICAL','MAGIC','TRUE','UNCLASSIFIED']" :key="s"><i :style="{background:COLORS[i]}"/>{{s}}</span></footer>
      <footer v-else><span>RATIOS USE CUMULATIVE CHAMPION DAMAGE AND GOLD EARNED</span></footer>
    </template>
  </section>
</template>
<style scoped>
.live-panel{width:100%;height:260px;box-sizing:border-box;display:flex;flex-direction:column;gap:3px;overflow:hidden;color:#f5f0eb;font-family:Rajdhani,Inter,'Bebas Neue',Arial,sans-serif;font-variant-numeric:tabular-nums;background:repeating-linear-gradient(-14deg,#ffffff04 0 1px,transparent 1px 9px),linear-gradient(115deg,#21090f,#08080b 40%,#15090d);border:1px solid #ff263f55;border-top:3px solid #ff263f;box-shadow:0 -5px 20px #0008;pointer-events:none;padding:0 12px 4px;animation:appear .32s ease both}
.live-panel *{box-sizing:border-box}header{height:35px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #ff263f40;flex-shrink:0}header img{width:26px;height:26px;object-fit:contain}h2{margin:0;font:800 19px/1 Orbitron,Bahnschrift,Arial,sans-serif;letter-spacing:1px;white-space:nowrap;color:#fff}.context{margin-left:auto;font-size:13px;font-weight:800;color:#c7bfc4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.preview{color:#e2b793;font-size:11px;font-weight:900;white-space:nowrap}.team-head{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;height:22px;flex-shrink:0;font-weight:900;font-size:14px}.team-head b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.team-head b:last-child{text-align:right}.team-head small{font-size:11px;color:#a99fa2}.blue{color:#69a1ff}.red{color:#ff5064}.rows{flex:1;min-height:0;display:flex;flex-direction:column;gap:3px}.row{display:grid;grid-template-columns:minmax(0,1fr) 35px minmax(0,1fr);gap:6px;flex:1;min-height:0;align-items:stretch}.player{display:flex;align-items:center;gap:6px;background:#ffffff07;border-left:2px solid var(--side);min-width:0;padding:2px 5px}.mirror{flex-direction:row-reverse;border-left:none;border-right:2px solid var(--side)}.portrait{height:27px;width:27px;flex:0 0 27px;display:grid;place-items:center;background:#22212a;overflow:hidden;font-size:11px;color:#bcb3b8}.portrait img{height:100%;width:100%;object-fit:cover}.portrait.dead{filter:grayscale(1);opacity:.6}.player-info{min-width:0;flex:1}.name-line{display:flex;align-items:center;justify-content:space-between;gap:5px;font-size:14px;line-height:1}.name-line b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.name-line strong{color:var(--side);flex-shrink:0;font-size:16px}.mirror .name-line{flex-direction:row-reverse}.track{background:#2a2830;height:6px;margin-top:3px;display:flex;overflow:hidden}.mirror .track{justify-content:flex-end}.fill{background:var(--side);height:100%;display:flex;transition:width .25s ease}.mirror .fill{flex-direction:row-reverse}.fill i{height:100%;flex-shrink:0}.slot{grid-column:2;grid-row:1;display:grid;place-items:center;color:#9e969d;font-size:11px;font-weight:800}.missing{color:#777;justify-content:center}.sequence{display:grid;flex:1;min-height:0;gap:7px;padding:9px 0 4px}.hit{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:0;position:relative;background:#ffffff06;border:1px solid #ffffff12;border-top:3px solid var(--side);padding:5px}.hit.final{border:1px solid #e2b793;border-top:3px solid #e2b793;background:#e2b79312}.hit.separated{border-left:2px dashed #e2b793}.hit small{color:#bcb3b8;font-size:13px}.marker{width:9px;height:9px;background:var(--side);transform:rotate(45deg)}.hit img{width:38px;height:38px;object-fit:cover;border:1px solid var(--side)}.hit-name{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.hit b{font:900 24px/1.1 Rajdhani,Arial,sans-serif}.hit-note{font-size:11px;font-weight:900;color:#e2b793;letter-spacing:1px}.hit:not(.final) .hit-note{color:#a99fa2}footer{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:21px;flex-shrink:0;border-top:1px solid #ff263f35;font-size:12px;font-weight:800;color:#bcb3b8;white-space:nowrap}footer b{font-size:15px}.legend{justify-content:center;gap:20px}.legend span{display:flex;align-items:center;gap:5px}.legend i{height:8px;width:8px}.efficiency footer{justify-content:center}.efficiency .fill{background:var(--side)}@keyframes appear{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.live-panel{animation:none}.fill{transition:none}}
</style>
