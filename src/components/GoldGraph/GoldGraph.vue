<script setup lang="ts">
import { computed, useId } from 'vue';
import { useIngameSelector } from '@/composables/useIngame';
import { useClient } from '@/client';
import fbeLogo from '@/assets/72x72.png';
import SlideTransition from '@/transitions/SlideTransition.vue';
import {buildLiveGold,previewGold} from './liveGoldData';
const props=defineProps<{preview?:boolean}>();
const client=useClient();
const gold=useIngameSelector(s=>s.gameData.goldGraph);
const scoreboard=useIngameSelector(s=>s.gameData.scoreboard);
const blue=computed(()=>scoreboard.value?.teams[0]);
const red=computed(()=>scoreboard.value?.teams[1]);
const tags=computed(()=>props.preview?['BLUE','RED']:[blue.value?.teamTag||'BLUE',red.value?.teamTag||'RED']);
const teams = computed(() => [blue.value, red.value].map((team, i) => ({
  tag: tags.value[i] ?? (i === 0 ? 'BLUE' : 'RED'),
  logo: team?.teamIconUrl ? client.getCacheUrl(team.teamIconUrl) : undefined,
  side: i === 0 ? 'blue' : 'red',
})));
const samples=computed(()=>props.preview?previewGold():buildLiveGold(gold.value?.current?.goldAtTime));
const visible=computed(()=>samples.value.length>=2);
const last=computed(()=>samples.value.at(-1));
const high=computed(()=>Math.max(0,...samples.value.map(p=>p.diff)));
const low=computed(()=>Math.min(0,...samples.value.map(p=>p.diff)));
const changes=computed(()=>{let prev=0,n=0;for(const p of samples.value){const s=Math.sign(p.diff);if(s){if(prev&&prev!==s)n++;prev=s;}}return n;});
const range=computed(()=>{const target=Math.max(1000,high.value,-low.value)/2;const mag=10**Math.floor(Math.log10(target));return 2*([1,2,2.5,5,10].find(n=>n*mag>=target)??10)*mag});
const end=computed(()=>Math.max(1,last.value?.time??0));
const L=70,R=1135,T=12,B=166,M=(T+B)/2;
const x=(t:number)=>L+t/end.value*(R-L);const y=(d:number)=>M-d/range.value*(B-T)/2;
const line=computed(()=>samples.value.map((p,i)=>`${i?'L':'M'}${x(p.time).toFixed(2)},${y(p.diff).toFixed(2)}`).join(' '));
const area=computed(()=>{const f=samples.value[0],l=last.value;return f&&l?`${line.value} L${x(l.time)},${M} L${x(f.time)},${M} Z`:''});
const timeTicks=computed(()=>{const step=Math.max(1,Math.ceil(end.value/300/7))*300;const t=[0];for(let v=step;v<end.value-step*.25;v+=step)t.push(v);t.push(end.value);return t;});
const format=(n:number)=>Math.abs(n)>=1000?`${(Math.abs(n)/1000).toFixed(1)}K`:Math.round(Math.abs(n)).toLocaleString('en-US');
const signed=(n:number)=>n===0?'0':`${n>0?'+':'−'}${format(n)}`;
const time=(n:number)=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
const leader=computed(()=>!last.value||last.value.diff===0?'TIED':last.value.diff>0?tags.value[0]:tags.value[1]);
const id=useId().replace(/[^a-zA-Z0-9_-]/g,'');const blueClip=`${id}-b`,redClip=`${id}-r`;
function hide(e:Event){if(e.currentTarget instanceof HTMLImageElement)e.currentTarget.style.visibility='hidden';}function show(e:Event){if(e.currentTarget instanceof HTMLImageElement)e.currentTarget.style.visibility='visible';}
</script>
<template>
  <SlideTransition>
    <section v-if="visible" class="gold-panel">
      <div class="summary"><header><img :src="fbeLogo" alt="FBE"/><div><small>{{preview?'DESIGN PREVIEW':'LIVE // ECONOMY'}}</small><h2>GOLD ADVANTAGE</h2></div></header><div class="latest" :class="{blue:(last?.diff??0)>0,red:(last?.diff??0)<0}"><small>{{leader}} {{last?.diff?'AHEAD':'GOLD'}}</small><strong>{{last?.diff?'+'+format(last.diff):'EVEN'}}</strong><span>LAST SAMPLE · {{time(last?.time??0)}}</span></div><div class="changes"><span>LEAD CHANGES</span><b>{{changes}}</b></div></div>
      <div class="peaks">
        <div v-for="(team,i) in teams" :key="team.side" :class="team.side" class="team-peak">
          <div class="team-emblem">
            <span>{{team.tag}}</span>
            <img v-if="team.logo" :key="team.logo" :src="team.logo" :alt="team.tag+' logo'" @error="hide" @load="show"/>
          </div>
          <div class="peak-info"><b>{{team.tag}}</b><strong>{{(i===0?high:-low)>0?'+'+format(i===0?high:-low):'—'}}</strong><small>PEAK LEAD</small></div>
        </div>
      </div>
      <div class="chart-wrap"><div class="chart-heading"><b>GOLD DIFFERENCE OVER TIME</b><span><i class="blue-dot"/>{{tags[0]}} AHEAD <i class="red-dot"/>{{tags[1]}} AHEAD</span></div><svg viewBox="0 0 1160 196" class="chart" role="img" aria-label="Live gold difference over time"><defs><clipPath :id="blueClip"><rect :x="L" :y="T" :width="R-L" :height="M-T"/></clipPath><clipPath :id="redClip"><rect :x="L" :y="M" :width="R-L" :height="B-M"/></clipPath></defs><g v-for="n in [range,range/2,0,-range/2,-range]" :key="n"><line :x1="L" :x2="R" :y1="y(n)" :y2="y(n)" :class="n===0?'zero':'gridline'"/><text :x="L-10" :y="y(n)+4" text-anchor="end" class="axis">{{signed(n)}}</text></g><g v-for="t in timeTicks" :key="t"><line :x1="x(t)" :x2="x(t)" :y1="T" :y2="B" class="gridline"/><text :x="x(t)" y="188" text-anchor="middle" class="axis">{{time(t)}}</text></g><path :d="area" fill="#69a1ff" fill-opacity=".28" :clip-path="`url(#${blueClip})`"/><path :d="area" fill="#ff5064" fill-opacity=".28" :clip-path="`url(#${redClip})`"/><path :d="line" fill="none" stroke="#f5f0eb" stroke-width="2.5" stroke-linejoin="round"/><circle v-if="last" :cx="x(last.time)" :cy="y(last.diff)" r="4" :fill="last.diff>0?'#69a1ff':last.diff<0?'#ff5064':'#e2b793'" stroke="#fff" stroke-width="1.5"/></svg></div>
    </section>
  </SlideTransition>
</template>
<style scoped>
.gold-panel{width:100%;height:260px;box-sizing:border-box;display:grid;grid-template-columns:265px 230px minmax(0,1fr);background:repeating-linear-gradient(-14deg,#ffffff04 0 1px,transparent 1px 9px),linear-gradient(115deg,#260b13,#09090d 45%,#10090d);border:1px solid #ff263f65;border-top:3px solid #ff263f;color:#f5f0eb;font-family:Rajdhani,Inter,'Bebas Neue',Arial,sans-serif;font-variant-numeric:tabular-nums;box-shadow:0 -5px 20px #0009;pointer-events:none;overflow:hidden}.gold-panel *{box-sizing:border-box}.summary{display:flex;flex-direction:column;padding:12px 14px;gap:12px;border-right:1px solid #ff263f35;min-width:0}header{display:flex;align-items:center;gap:9px;border-bottom:1px solid #ff263f40;padding-bottom:10px}header img{width:34px;height:34px;object-fit:contain}header small{display:block;font-size:10px;letter-spacing:1.5px;color:#a99fa2;font-weight:800}h2{margin:4px 0 0;font:900 17px/1 Orbitron,Bahnschrift,Arial,sans-serif;white-space:nowrap}.latest{display:flex;flex-direction:column;gap:5px;flex:1;justify-content:center}.latest small{font-size:15px;font-weight:900;letter-spacing:1px}.latest strong{font:900 48px/1 Orbitron,Bahnschrift,Arial,sans-serif}.latest span{font-size:11px;font-weight:800;color:#a99fa2;letter-spacing:1px}.blue{color:#69a1ff}.red{color:#ff5064}.changes{display:flex;align-items:center;justify-content:space-between;background:#ffffff08;padding:8px 10px;color:#bcb3b8;font-size:12px;font-weight:800}.changes b{font-size:21px;color:#e2b793}.peaks{display:grid;grid-template-rows:1fr 1fr;gap:5px;padding:8px 10px;border-right:1px solid #ff263f35}
.team-peak{position:relative;display:grid;grid-template-columns:86px minmax(0,1fr);align-items:center;gap:10px;padding:8px;background:linear-gradient(110deg,color-mix(in srgb,currentColor 12%,#131218),#131218);border-left:3px solid currentColor;min-width:0;overflow:hidden}
.team-emblem{width:86px;height:86px;position:relative;display:grid;place-items:center;background:#08080c75;border:1px solid #ffffff18;overflow:hidden}
.team-emblem span{font-size:20px;font-weight:900;text-align:center;overflow-wrap:anywhere;max-width:100%}
.team-emblem img{position:absolute;inset:0;width:100%;height:100%;padding:7px;object-fit:contain;filter:drop-shadow(0 3px 7px #000a)}
.team-emblem:has(img:not([style*="hidden"])) span{visibility:hidden}
.peak-info{min-width:0;display:flex;flex-direction:column;gap:5px}
.peak-info b,.peak-info strong,.peak-info small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.peak-info b{font-size:17px;font-weight:900}.peak-info strong{font-size:26px;line-height:1;font-weight:900}.peak-info small{font-size:10px;color:#a99fa2;font-weight:800;letter-spacing:.8px}
.chart-wrap{min-width:0;display:flex;flex-direction:column;padding:10px 14px 8px}.chart-heading{height:28px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #ff263f30;font-size:14px;letter-spacing:1px}.chart-heading span{display:flex;align-items:center;gap:6px;color:#bcb3b8;font-size:11px;font-weight:800;white-space:nowrap}.chart-heading i{width:8px;height:8px}.blue-dot{background:#69a1ff}.red-dot{background:#ff5064}.chart{width:100%;flex:1;min-height:0;display:block}.gridline{stroke:#ffffff18;stroke-width:1}.zero{stroke:#ffffff80;stroke-dasharray:5 4}.axis{fill:#c6bdc1;font-size:12px;font-weight:700}
</style>
