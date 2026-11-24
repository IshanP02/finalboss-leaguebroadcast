<script setup lang="ts">
import { computed, useId } from 'vue';
import { buildGoldDiffSeries, formatGameClock, getPostGameSides, type postGameOverview } from '@bluebottle_gg/league-broadcast-client';
import FbePostGameFrame from './FbePostGameFrame.vue';

const props = withDefaults(defineProps<{ overview: postGameOverview | null; loading?: boolean; error?: string }>(), { loading:false, error:'' });
const sides = computed(() => props.overview ? [...getPostGameSides(props.overview)].sort((a,b)=>a-b).slice(0,2) : []);
const blue = computed(() => sides.value[0]);
const red = computed(() => sides.value[1]);
function teamTag(side: number | undefined, fallback: string) {
  if (side === undefined) return fallback;
  return props.overview?.teamOverviewBySide?.[side]?.metaData?.tag || props.overview?.teamInfoBySide?.[side]?.tag || fallback;
}
const blueTag = computed(()=>teamTag(blue.value,'BLUE'));
const redTag = computed(()=>teamTag(red.value,'RED'));
type Sample = { time: number; diff: number };
const series = computed<Sample[]>(() => {
  const current = props.overview?.goldGraph?.current;
  if (!current?.goldAtTime || !Object.keys(current.goldAtTime).length || blue.value === undefined) return [];
  const raw = buildGoldDiffSeries(current,blue.value);
  const byTime = new Map<number,Sample>();
  for (const sample of raw) {
    if (Number.isFinite(sample.time) && sample.time >= 0 && Number.isFinite(sample.diff)) byTime.set(sample.time,{time:sample.time,diff:sample.diff});
  }
  return [...byTime.values()].sort((a,b)=>a.time-b.time);
});
const hasData = computed(()=>series.value.length>=2);
const last = computed(()=>series.value[series.value.length-1]);
const bluePeak = computed(()=>series.value.reduce<Sample | null>((best,p)=>p.diff>0 && (!best || p.diff>best.diff) ? p : best,null));
const redPeak = computed(()=>series.value.reduce<Sample | null>((best,p)=>p.diff<0 && (!best || p.diff<best.diff) ? p : best,null));
const leadChanges = computed(()=> {
  let previous=0, count=0;
  for (const p of series.value) {
    const sign=Math.sign(p.diff);
    if (!sign) continue; // A tie is not itself a lead change.
    if(previous && sign!==previous) count++;
    previous=sign;
  }
  return count;
});
const endGold = computed(()=>{
  if (blue.value===undefined || red.value===undefined) return null;
  const b=props.overview?.teamOverviewBySide?.[blue.value]?.gold;
  const r=props.overview?.teamOverviewBySide?.[red.value]?.gold;
  return typeof b==='number' && Number.isFinite(b) && typeof r==='number' && Number.isFinite(r) ? {blue:b,red:r,diff:b-r} : null;
});
function compact(v:number) { return Math.abs(v)>=1000 ? `${(Math.abs(v)/1000).toFixed(1)}K` : Math.round(Math.abs(v)).toLocaleString('en-US'); }
function signed(v:number) { return v===0?'0':`${v>0?'+':'−'}${compact(v)}`; }
function leader(v:number) { return v>0?blueTag.value:v<0?redTag.value:'TIED'; }
function leadColor(v:number) { return v>0?'var(--pg-blue)':v<0?'var(--pg-red)':'var(--pg-gold)'; }
// SVG coordinates: actual elapsed game time, not sample index.
const W=1720,H=515,L=110,R=1640,T=43,B=448,M=(T+B)/2;
const domainStart=computed(()=>series.value[0]?.time ?? 0);
const domainEnd=computed(()=>last.value?.time ?? 0);
const tickSize=computed(()=>{
  const max=Math.max(1000,...series.value.map(p=>Math.abs(p.diff)));
  const target=max/2;
  const magnitude=10**Math.floor(Math.log10(target));
  return ([1,2,2.5,5,10].find(n=>n*magnitude>=target) ?? 10)*magnitude;
});
const range=computed(()=>tickSize.value*2);
const yTicks=computed(()=>[range.value,tickSize.value,0,-tickSize.value,-range.value]);
function x(time:number) { return L+(time-domainStart.value)/Math.max(1,domainEnd.value-domainStart.value)*(R-L); }
function y(diff:number) { return M-diff/range.value*(B-T)/2; }
const points=computed(()=>series.value.map(p=>({ ...p,x:x(p.time),y:y(p.diff) })));
const path=computed(()=>points.value.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '));
const area=computed(()=>{
  const a=points.value[0],z=points.value[points.value.length-1];
  return a&&z?`${path.value} L${z.x},${M} L${a.x},${M} Z`:'';
});
const timeTicks=computed(()=>{
  const start=domainStart.value,end=domainEnd.value;
  if(end<=start)return [];
  const step=Math.max(1,Math.ceil((end-start)/300/9))*300;
  const ticks=[start];
  for(let t=Math.ceil(start/step)*step;t<end;t+=step) if(t>start && t-start>step*.22 && end-t>step*.22)ticks.push(t);
  ticks.push(end);
  return ticks;
});
const id=useId().replace(/[^a-zA-Z0-9_-]/g,'');
const blueClip=`${id}-blue`,redClip=`${id}-red`,blueGradient=`${id}-bg`,redGradient=`${id}-rg`;
</script>

<template>
  <FbePostGameFrame :overview="overview" title="GOLD" accent="ADVANTAGE" section="03 // ECONOMY INTEL" :loading="loading" :error="error">
    <div v-if="hasData" class="gold-layout">
      <div class="metrics">
        <div class="metric blue"><small>{{ blueTag }} // LARGEST LEAD</small><strong>{{ bluePeak ? '+'+compact(bluePeak.diff) : '—' }}</strong><span>{{ bluePeak ? 'AT '+formatGameClock(bluePeak.time) : 'NO POSITIVE LEAD RECORDED' }}</span></div>
        <div class="metric neutral"><small>LEAD CHANGES</small><strong>{{ leadChanges }}</strong><span>BETWEEN RECORDED SAMPLES</span></div>
        <div class="metric red"><small>{{ redTag }} // LARGEST LEAD</small><strong>{{ redPeak ? '+'+compact(redPeak.diff) : '—' }}</strong><span>{{ redPeak ? 'AT '+formatGameClock(redPeak.time) : 'NO POSITIVE LEAD RECORDED' }}</span></div>
        <div v-if="last" class="metric last" :style="{'--leader':leadColor(last.diff)}"><small>LAST RECORDED ADVANTAGE</small><strong>{{ last.diff===0 ? 'TIED' : leader(last.diff)+' +'+compact(last.diff) }}</strong><span>AT {{ formatGameClock(last.time) }}</span></div>
      </div>
      <div class="chart-panel">
        <div class="chart-heading"><h2>GOLD DIFFERENCE OVER TIME</h2><div><span class="blue-dot"/>{{ blueTag }} AHEAD <span class="red-dot"/>{{ redTag }} AHEAD</div></div>
        <svg class="chart" :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Gold advantage over elapsed game time. Positive values indicate blue side leads; negative values indicate red side leads.">
          <defs>
            <clipPath :id="blueClip"><rect :x="L" :y="T" :width="R-L" :height="M-T"/></clipPath>
            <clipPath :id="redClip"><rect :x="L" :y="M" :width="R-L" :height="B-M"/></clipPath>
            <linearGradient :id="blueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#69a1ff" stop-opacity=".6"/><stop offset="100%" stop-color="#69a1ff" stop-opacity=".22"/></linearGradient>
            <linearGradient :id="redGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff5064" stop-opacity=".22"/><stop offset="100%" stop-color="#ff5064" stop-opacity=".6"/></linearGradient>
          </defs>
          <rect :x="L" :y="T" :width="R-L" :height="M-T" fill="#69a1ff" opacity=".035"/>
          <rect :x="L" :y="M" :width="R-L" :height="B-M" fill="#ff5064" opacity=".035"/>
          <g v-for="tick in yTicks" :key="tick"><line :x1="L" :x2="R" :y1="y(tick)" :y2="y(tick)" stroke="#ffffff" :stroke-opacity="tick === 0 ? 0.48 : 0.13" :stroke-dasharray="tick===0?'6 6':undefined"/><text :x="L-17" :y="y(tick)+6" text-anchor="end" class="axis">{{ signed(tick) }}</text></g>
          <g v-for="tick in timeTicks" :key="tick"><line :x1="x(tick)" :x2="x(tick)" :y1="T" :y2="B" stroke="#ffffff" stroke-opacity=".08"/><text :x="x(tick)" :y="B+32" text-anchor="middle" class="axis">{{ formatGameClock(tick) }}</text></g>
          <g class="chart-reveal">
            <path :d="area" :fill="`url(#${blueGradient})`" :clip-path="`url(#${blueClip})`"/>
            <path :d="area" :fill="`url(#${redGradient})`" :clip-path="`url(#${redClip})`"/>
            <path :d="path" fill="none" stroke="#f5f0eb" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
            <g v-if="bluePeak"><circle :cx="x(bluePeak.time)" :cy="y(bluePeak.diff)" r="8" fill="#69a1ff" stroke="#fff" stroke-width="2"/><circle :cx="x(bluePeak.time)" :cy="y(bluePeak.diff)" r="14" fill="none" stroke="#69a1ff" opacity=".5"/></g>
            <g v-if="redPeak"><circle :cx="x(redPeak.time)" :cy="y(redPeak.diff)" r="8" fill="#ff5064" stroke="#fff" stroke-width="2"/><circle :cx="x(redPeak.time)" :cy="y(redPeak.diff)" r="14" fill="none" stroke="#ff5064" opacity=".5"/></g>
            <g v-if="last"><circle :cx="x(last.time)" :cy="y(last.diff)" r="5" fill="#fff"/><line :x1="x(last.time)" :x2="x(last.time)" :y1="y(last.diff)" :y2="B" stroke="#fff" stroke-opacity=".25" stroke-dasharray="3 5"/></g>
          </g>
          <text :x="L+15" :y="T-13" class="side-axis blue-axis">{{ blueTag }} LEADS</text><text :x="L+15" :y="B+56" class="side-axis red-axis">{{ redTag }} LEADS</text>
          <text :x="R" :y="B+56" class="side-axis" text-anchor="end">GAME TIME →</text>
        </svg>
      </div>
      <div class="gold-note"><template v-if="endGold"><strong :style="{color:'var(--pg-blue)'}">{{ blueTag }} {{ compact(endGold.blue) }}</strong><span>FINAL TEAM GOLD · {{ endGold.diff===0 ? 'TIED' : leader(endGold.diff)+' +'+compact(endGold.diff) }}</span><strong :style="{color:'var(--pg-red)'}">{{ redTag }} {{ compact(endGold.red) }}</strong></template><span v-else>FINAL TEAM GOLD UNAVAILABLE</span></div>
    </div>
    <div v-else class="no-data">NO GOLD TIMELINE AVAILABLE</div>
  </FbePostGameFrame>
</template>

<style scoped>
.gold-layout { height:100%; display:grid; grid-template-rows:107px minmax(0,1fr) 43px; gap:12px; }
.metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
.metric { min-width:0; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:6px; padding:10px 12px; text-align:center; background:linear-gradient(135deg,#ff263f08,#0c0c10 55%); border:1px solid var(--pg-line); border-top:3px solid var(--tone); --tone:var(--pg-gold); }
.metric.blue { --tone:var(--pg-blue); } .metric.red { --tone:var(--pg-red); } .metric.last { --tone:var(--leader); }
.metric small,.metric span { font-size:13px; font-weight:800; letter-spacing:1.4px; color:var(--pg-muted); white-space:nowrap; } .metric strong { font:900 32px/1.1 var(--pg-heading); color:var(--tone); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; } .metric.last strong { font-size:28px; }
.chart-panel { min-height:0; display:flex; flex-direction:column; padding:15px 18px 4px; border:1px solid var(--pg-line); background:linear-gradient(150deg,#171018,#0a0a0e 55%); }
.chart-heading { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:0 12px; } .chart-heading h2 { font:800 20px/1 var(--pg-heading); letter-spacing:2px; } .chart-heading div { display:flex; align-items:center; gap:9px; font-size:15px; font-weight:800; color:var(--pg-muted); } .chart-heading div span { width:12px; height:12px; display:inline-block; } .blue-dot { background:var(--pg-blue); } .red-dot { background:var(--pg-red); margin-left:15px; }
.chart { width:100%; flex:1; min-height:0; overflow:visible; } .axis { fill:#bcb3b8; font-size:20px; font-weight:700; } .side-axis { font-size:16px; font-weight:800; letter-spacing:1.5px; fill:var(--pg-muted); } .blue-axis { fill:var(--pg-blue); } .red-axis { fill:var(--pg-red); }
.chart-reveal { animation:chart-reveal 1.5s cubic-bezier(.16,1,.3,1) both; } @keyframes chart-reveal { from { clip-path:inset(0 100% 0 0); } to { clip-path:inset(0 0 0 0); } }
.gold-note { display:flex; justify-content:space-between; align-items:center; padding:0 24px; background:#100e12; border:1px solid var(--pg-line); } .gold-note strong { font-size:23px; font-weight:900; } .gold-note span { font-size:15px; color:var(--pg-muted); letter-spacing:2px; font-weight:800; }
.no-data { height:100%; display:grid; place-items:center; border:1px solid var(--pg-line); color:var(--pg-muted); font:800 25px/1 var(--pg-heading); }
@media(prefers-reduced-motion:reduce) { .chart-reveal { animation:none; } }
</style>
