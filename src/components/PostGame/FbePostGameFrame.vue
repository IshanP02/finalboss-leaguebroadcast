<script setup lang="ts">
import { computed } from 'vue';
import { formatGameClock, getPostGameSides, type postGameOverview } from '@bluebottle_gg/league-broadcast-client';
import { useClient } from '@/client';
import fbeLogo from '@/assets/72x72.png';

const props = withDefaults(defineProps<{
  overview: postGameOverview | null;
  title: string;
  accent: string;
  section: string;
  loading?: boolean;
  error?: string;
}>(), { loading: false, error: '' });
const client = useClient();
const teams = computed(() => {
  const overview = props.overview;
  if (!overview) return [];
  const sides = [...getPostGameSides(overview)].sort((a,b) => a-b).slice(0,2);
  const winnerKnown = overview.winnerSide !== undefined && sides.includes(overview.winnerSide);
  return sides.map((side, i) => {
    const info = overview.teamInfoBySide?.[side];
    const summary = overview.teamOverviewBySide?.[side];
    const name = summary?.metaData?.name || info?.name || (i === 0 ? 'Blue side' : 'Red side');
    const path = summary?.metaData?.iconUri || info?.iconUri;
    return { side, name, tag: summary?.metaData?.tag || info?.tag || name,
      logo: path ? client.getCacheUrl(path) : undefined,
      color: i === 0 ? '#69a1ff' : '#ff5064',
      result: !winnerKnown ? '' : overview.winnerSide === side ? 'VICTORY' : 'DEFEAT' };
  });
});
const clock = computed(() => props.overview ? formatGameClock(props.overview.gameTime) : '—');
const patch = computed(() => props.overview?.patch?.split('.').slice(0,2).join('.') || '—');
function imageError(e: Event) { if (e.currentTarget instanceof HTMLImageElement) e.currentTarget.style.visibility = 'hidden'; }
function imageLoad(e: Event) { if (e.currentTarget instanceof HTMLImageElement) e.currentTarget.style.visibility = 'visible'; }
</script>

<template>
  <section class="fbe-pg-frame">
    <header class="frame-header">
      <div class="brand"><img :src="fbeLogo" alt="Final Boss Esports"/><strong>FINAL BOSS ESPORTS</strong></div>
      <h1>{{ title }} <em>{{ accent }}</em></h1>
      <div class="patch"><small>LEAGUE OF LEGENDS</small><strong>PATCH {{ patch }}</strong></div>
    </header>
    <template v-if="overview && teams.length === 2 && !loading && !error">
      <div class="match-strip">
        <div v-for="(team,i) in teams" :key="team.side" class="team" :class="{ mirrored: i === 1 }" :style="{ '--side': team.color, gridColumn: i === 0 ? '1' : '3' }">
          <div class="team-logo"><span>{{ team.tag }}</span><img v-if="team.logo" :src="team.logo" :alt="team.name" @error="imageError" @load="imageLoad" /></div>
          <div class="identity"><small>{{ i === 0 ? 'BLUE SIDE' : 'RED SIDE' }}</small><strong>{{ team.tag }}</strong><span>{{ team.name }}</span></div>
          <span v-if="team.result" class="result" :class="{ won: team.result === 'VICTORY' }">{{ team.result }}</span>
        </div>
        <div class="clock"><small>GAME DURATION</small><strong>{{ clock }}</strong><span>POSTGAME ANALYSIS</span></div>
      </div>
      <main class="frame-content"><slot /></main>
    </template>
    <div v-else class="empty"><i></i><h2>{{ error ? 'DATA UNAVAILABLE' : loading ? 'LOADING GAME DATA' : 'AWAITING GAME DATA' }}</h2><p v-if="error">{{ error }}</p></div>
    <footer class="frame-footer"><span><i></i> POSTGAME </span><strong>FINALBOSSESPORTS.NET</strong><span>FINAL BOSS ESPORTS</span></footer>
  </section>
</template>

<style scoped>
.fbe-pg-frame { --pg-blue:#69a1ff; --pg-red:#ff5064; --pg-gold:#e2b793; --pg-muted:#a99fa2; --pg-accent:var(--theme-red-bright,#ff263f); --pg-line:rgba(255,90,110,.19); --pg-heading:'Orbitron','Bahnschrift','Arial Black',sans-serif; --pg-body:'Rajdhani','Inter','Bahnschrift',system-ui,sans-serif; position:absolute; inset:0; width:1920px; height:1080px; padding:36px 52px 30px; display:grid; grid-template-rows:64px 128px minmax(0,1fr) 38px; gap:18px; overflow:hidden; isolation:isolate; box-sizing:border-box; color:var(--theme-text,#f5f0eb); font-family:var(--pg-body); font-variant-numeric:tabular-nums; background:radial-gradient(ellipse at 95% 0%,#3b050b80,transparent 48%),radial-gradient(ellipse at 4% 110%,#4e07137a,transparent 52%),repeating-linear-gradient(-14deg,#ffffff04 0 1px,transparent 1px 9px),linear-gradient(125deg,#10090d,#050507 50%,#15090d); }
.fbe-pg-frame::after { content:''; position:absolute; inset:14px; border:1px solid #ff263f24; z-index:-1; pointer-events:none; }
.frame-header { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; padding-bottom:13px; border-bottom:2px solid var(--pg-accent); }
.brand { display:flex; align-items:center; gap:14px; font-size:21px; font-weight:900; letter-spacing:2px; }
.brand img { width:48px; height:48px; object-fit:contain; }
h1 { font:900 37px/1 var(--pg-heading); letter-spacing:3px; white-space:nowrap; } h1 em { color:var(--pg-accent); font-style:normal; }
.patch { text-align:right; } .patch small,.clock small { display:block; color:var(--pg-muted); font-size:13px; letter-spacing:2px; font-weight:800; }
.patch strong { font-size:18px; letter-spacing:2px; }
.match-strip { display:grid; grid-template-columns:minmax(0,1fr) 280px minmax(0,1fr); gap:14px; }
.team { grid-row:1; display:flex; align-items:center; gap:20px; min-width:0; padding:14px 25px; border:1px solid color-mix(in srgb,var(--side) 35%,transparent); border-top:3px solid var(--side); background:linear-gradient(120deg,color-mix(in srgb,var(--side) 13%,#0c0c11),#101015 70%); }
.team.mirrored { flex-direction:row-reverse; text-align:right; background:linear-gradient(240deg,color-mix(in srgb,var(--side) 13%,#0c0c11),#101015 70%); }
.team-logo { width:86px; height:86px; flex:0 0 86px; position:relative; display:grid; place-items:center; font-size:22px; color:var(--side); font-weight:900; }
.team-logo img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; } .team-logo:has(img:not([style*="hidden"])) span { visibility:hidden; }
.identity { flex:1; min-width:0; display:flex; flex-direction:column; } .identity small { color:var(--side); font-size:12px; font-weight:800; letter-spacing:3px; } .identity strong { font:900 38px/1.1 var(--pg-heading); } .identity span { color:#c9c0c3; font-size:17px; } .identity strong,.identity span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.result { font-size:15px; font-weight:900; letter-spacing:2px; padding:8px 12px; color:#b5aeb1; background:#29262c; } .result.won { background:linear-gradient(110deg,#f0d2ae,#c49571); color:#190e10; }
.clock { grid-column:2; grid-row:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; background:#100e12; border:1px solid var(--pg-line); } .clock strong { font:900 39px/1.1 var(--pg-heading); } .clock span { font-size:12px; font-weight:800; letter-spacing:2px; color:var(--pg-accent); }
.frame-content { min-height:0; min-width:0; } .empty { grid-row:2/4; display:flex; flex-direction:column; gap:20px; align-items:center; justify-content:center; } .empty h2 { font:900 42px/1 var(--pg-heading); } .empty i { width:100px; height:4px; background:var(--pg-accent); } .empty p { font-size:20px; color:var(--pg-muted); }
.frame-footer { grid-row:4; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; border-top:1px solid var(--pg-line); color:var(--pg-muted); font-size:13px; font-weight:800; letter-spacing:1.5px; } .frame-footer span:last-child { text-align:right; } .frame-footer strong { color:var(--pg-accent); font:800 15px/1 var(--pg-heading); letter-spacing:3px; } .frame-footer i { display:inline-block; width:8px; height:8px; margin-right:6px; background:var(--pg-accent); transform:rotate(45deg); }
</style>
