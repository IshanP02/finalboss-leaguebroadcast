<script setup lang="ts">
import { computed } from 'vue';
import { getPostGameSides, type postGameOverview } from '@bluebottle_gg/league-broadcast-client';
import { useClient } from '@/client';
import FbePostGameFrame from './FbePostGameFrame.vue';

const props = withDefaults(defineProps<{ overview: postGameOverview | null; loading?: boolean; error?: string }>(), { loading:false, error:'' });
const client = useClient();
const legend = [ { label:'Physical', color:'#ed925e' }, { label:'Magic', color:'#7394ed' }, { label:'True', color:'#ece9e2' }, { label:'Unclassified', color:'#696775' } ];
const valid = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const fmt = (v: number) => Math.round(v).toLocaleString('en-US');
const compact = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : fmt(v);
const clean = (v?: string | null) => v?.split('#')[0]?.trim() || '';
const teams = computed(() => {
  const overview = props.overview;
  if (!overview) return [];
  return [...getPostGameSides(overview)].sort((a,b) => a-b).slice(0,2).map((side,i) => {
    const info = overview.teamInfoBySide?.[side];
    const summary = overview.teamOverviewBySide?.[side];
    const entries = overview.damageGraph?.damageByTeam?.[side]?.entries ?? [];
    const rows = entries.map((entry,index) => {
      const damage = valid(entry.damage) ? entry.damage : null;
      const parts = [entry.physicalDamage,entry.magicDamage,entry.trueDamage];
      const known = parts.map(v => valid(v) ? v : 0);
      const sum = known.reduce((a,b) => a+b,0);
      // Normalize only small rounding differences. For inconsistent totals,
      // show an unclassified bar rather than implying a false composition.
      const tolerance = Math.max(1,(damage ?? 0)*.001);
      const inconsistent = damage !== null && sum > damage + tolerance;
      const segments = damage === null || damage === 0 ? [] : inconsistent
        ? [{ color:legend[3]!.color, pct:100 }]
        : [...known,Math.max(0,damage-sum)].map((v,j) => ({color:legend[j]!.color, pct:v/Math.max(damage,sum)*100})).filter(s => s.pct > 0);
      return { key:`${side}-${entry.champion?.id ?? index}-${index}`, damage, segments,
        physical: valid(parts[0]) ? parts[0] : null, magic:valid(parts[1]) ? parts[1] : null, trueDamage:valid(parts[2]) ? parts[2] : null,
        player:clean(entry.playerName), champion:entry.champion?.name || 'Unknown champion',
        portrait:entry.champion?.squareImg ? client.getCacheUrl(entry.champion.squareImg) : undefined };
    });
    return { side, tag:summary?.metaData?.tag || info?.tag || info?.name || (i===0?'BLUE':'RED'), color:i===0?'#69a1ff':'#ff5064', rows,
      total:rows.length === 5 && rows.every(r => r.damage !== null) ? rows.reduce((s,r) => s+(r.damage ?? 0),0) : null };
  });
});
const maximum = computed(() => Math.max(0,...teams.value.flatMap(t=>t.rows.map(r=>r.damage ?? 0))));
const hasData = computed(() => teams.value.some(t=>t.rows.some(r=>r.damage !== null)));
const allTotal = computed(() => teams.value.length === 2 && teams.value.every(t=>t.total !== null) ? teams.value.reduce((s,t)=>s+(t.total ?? 0),0) : null);
const showUnclassified = computed(() => teams.value.some(t=>t.rows.some(r=>r.segments.some(s=>s.color===legend[3]!.color))));
const visibleLegend = computed(() => showUnclassified.value ? legend : legend.slice(0,3));
function barWidth(damage: number | null) { return `${(damage ?? 0)/Math.max(maximum.value,1)*100}%`; }
function broken(e:Event) { if(e.currentTarget instanceof HTMLImageElement) e.currentTarget.style.visibility='hidden'; }
function loaded(e:Event) { if(e.currentTarget instanceof HTMLImageElement) e.currentTarget.style.visibility='visible'; }
</script>

<template>
  <FbePostGameFrame :overview="overview" title="DAMAGE" accent="BREAKDOWN" section="02 // COMBAT INTEL" :loading="loading" :error="error">
    <div v-if="hasData" class="damage-layout">
      <div class="legend-strip"><strong>DAMAGE DEALT TO CHAMPIONS</strong><div class="legend"><span v-for="item in visibleLegend" :key="item.label"><i :style="{background:item.color}"/>{{ item.label }}</span></div><small>SHARED SCALE · {{ compact(maximum) }} MAX</small></div>
      <div class="damage-teams">
        <section v-for="(team,i) in teams" :key="team.side" class="damage-team" :class="{ mirrored:i===1 }" :style="{'--side':team.color}">
          <header class="team-total"><div><small>{{ team.tag }} // TOTAL DAMAGE</small><strong>{{ team.total === null ? '—' : fmt(team.total) }}</strong></div><span v-if="team.total !== null && allTotal !== null && allTotal > 0">{{ (team.total/allTotal*100).toFixed(1) }}% OF GAME DAMAGE</span></header>
          <div class="rows">
            <article v-for="(row,j) in team.rows" :key="row.key" class="damage-row" :class="{ top:maximum>0 && row.damage===maximum }" :style="{'--delay':`${j*90}ms`}">
              <div class="portrait"><img v-if="row.portrait" :src="row.portrait" :alt="row.champion" @error="broken" @load="loaded" /></div>
              <div class="row-data">
                <div class="name-line"><strong>{{ row.player || row.champion }}</strong><b>{{ row.damage === null ? '—' : fmt(row.damage) }}</b></div>
                <div class="subline"><span>{{ row.player ? row.champion : 'PLAYER NAME UNAVAILABLE' }}</span><em v-if="maximum>0 && row.damage===maximum">TOP DAMAGE</em></div>
                <div class="track"><div class="fill" :style="{width:barWidth(row.damage)}"><i v-for="(segment,k) in row.segments" :key="k" :style="{width:`${segment.pct}%`,background:segment.color}"/></div></div>
              </div>
            </article>
            <div v-if="!team.rows.length" class="no-data">No player damage data</div>
          </div>
        </section>
      </div>
      <div class="damage-note"><span>BAR LENGTH = TOTAL DAMAGE · COLOR = DAMAGE TYPE</span><span v-if="showUnclassified">GRAY = DAMAGE WITHOUT A RELIABLE TYPE BREAKDOWN</span><span v-else>ALL TEN PLAYERS USE THE SAME SCALE</span></div>
    </div>
    <div v-else class="no-data standalone">NO CHAMPION DAMAGE DATA AVAILABLE</div>
  </FbePostGameFrame>
</template>

<style scoped>
.damage-layout { height:100%; display:grid; grid-template-rows:44px minmax(0,1fr) 27px; gap:12px; }
.legend-strip { display:flex; align-items:center; justify-content:space-between; gap:16px; border-bottom:1px solid var(--pg-line); padding:0 8px 10px; } .legend-strip>strong { font:800 20px/1 var(--pg-heading); letter-spacing:1px; } .legend-strip small,.damage-note { color:var(--pg-muted); font-size:13px; font-weight:800; letter-spacing:1px; }
.legend { display:flex; gap:24px; } .legend span { display:flex; align-items:center; gap:8px; font-size:18px; font-weight:700; } .legend i { width:15px; height:15px; display:inline-block; }
.damage-teams { min-height:0; display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.damage-team { min-width:0; min-height:0; display:flex; flex-direction:column; padding:16px 22px 18px; border:1px solid var(--pg-line); border-top:3px solid var(--side); background:linear-gradient(130deg,color-mix(in srgb,var(--side) 6%,#0c0c10),#0c0c10 65%); }
.team-total { display:flex; align-items:center; justify-content:space-between; gap:15px; padding-bottom:13px; border-bottom:1px solid var(--pg-line); } .team-total small { display:block; color:var(--side); font-size:14px; font-weight:800; letter-spacing:2px; } .team-total strong { font:900 40px/1.1 var(--pg-heading); } .team-total>span { color:var(--pg-muted); font-size:15px; font-weight:800; } .mirrored .team-total { flex-direction:row-reverse; text-align:right; }
.rows { display:flex; flex-direction:column; gap:9px; flex:1; min-height:0; padding-top:12px; } .damage-row { flex:1; min-height:0; display:flex; align-items:center; gap:17px; padding:9px 13px; background:linear-gradient(100deg,color-mix(in srgb,var(--side) 8%,#19191e),#141419 75%); border-left:3px solid var(--side); animation:enter .45s ease var(--delay) both; }
.mirrored .damage-row { flex-direction:row-reverse; border-left:0; border-right:3px solid var(--side); background:linear-gradient(260deg,color-mix(in srgb,var(--side) 8%,#19191e),#141419 75%); } .damage-row.top { box-shadow:inset 0 0 0 1px #e2b79399; }
.portrait { width:72px; height:72px; flex:0 0 72px; background:#25242b; border:1px solid #ffffff25; } .portrait img { width:100%; height:100%; object-fit:cover; display:block; }
.row-data { flex:1; min-width:0; } .name-line,.subline { display:flex; align-items:baseline; justify-content:space-between; gap:14px; min-width:0; } .mirrored .name-line,.mirrored .subline { flex-direction:row-reverse; }
.name-line strong { font-size:29px; font-weight:900; line-height:1.1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; } .name-line b { color:var(--side); font-size:29px; line-height:1.1; font-weight:900; white-space:nowrap; } .subline { margin:2px 0 6px; color:var(--pg-muted); font-size:14px; font-weight:700; } .subline span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .subline em { color:var(--pg-gold); font-style:normal; font-size:12px; font-weight:900; letter-spacing:1px; white-space:nowrap; }
.track { height:16px; background:#2b2a32; display:flex; overflow:hidden; } .mirrored .track { justify-content:flex-end; } .fill { height:100%; display:flex; transform-origin:left; animation:reveal .95s cubic-bezier(.16,1,.3,1) var(--delay) both; } .mirrored .fill { flex-direction:row-reverse; transform-origin:right; } .fill i { height:100%; display:block; flex-shrink:0; }
.damage-note { display:flex; justify-content:space-between; align-items:center; } .no-data { display:grid; place-items:center; height:100%; color:var(--pg-muted); font-size:23px; text-align:center; } .standalone { border:1px solid var(--pg-line); }
@keyframes enter { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } } @keyframes reveal { from { transform:scaleX(0); } to { transform:scaleX(1); } } @media(prefers-reduced-motion:reduce) { .damage-row,.fill { animation:none; } }
</style>
