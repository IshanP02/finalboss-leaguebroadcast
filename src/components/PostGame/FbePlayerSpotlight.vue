<script setup lang="ts">
import { computed } from 'vue';
import { formatGameClock } from '@bluebottle_gg/league-broadcast-client';
import { useClient } from '@/client';
import { useFbePlayerPostGame, type FbePlayerScreen } from '@/composables/useFbePlayerPostGame';
import fbeLogo from '@/assets/72x72.png';

const props = withDefaults(defineProps<{
  gameId?: number;
  playerIndex: number;
  isMocking?: boolean;
  mode: FbePlayerScreen;
  award?: boolean;
}>(), { award: false, isMocking: undefined });
const client = useClient();
const { stats, build, loading, error, warning } = useFbePlayerPostGame(
  computed(() => props.gameId), computed(() => props.playerIndex),
  computed(() => props.isMocking),
  // Share the POTG data path: real stats + build, or stats-only mock.
  // This flag selects the mock sample, not the on-screen award branding.
  computed<FbePlayerScreen>(() => 'spotlight'),
  computed(() => props.mode === 'performance' || props.award),
);

const isSpotlight = computed(() => props.mode === 'spotlight');
const isAward = computed(() => isSpotlight.value && props.award);
const identity = computed(() => stats.value ?? build.value);
const champion = computed(() => identity.value?.champion);
const clean = (s?: string | null) => s?.split('#')[0]?.trim() ?? '';
const playerName = computed(() => clean(stats.value?.displayName) || clean(build.value?.displayName) || clean(stats.value?.nameWithTag) || clean(build.value?.nameWithTag));
const championName = computed(() => champion.value?.name || champion.value?.alias || 'Champion unavailable');
const side = computed(() => props.playerIndex < 5 ? 'BLUE SIDE' : 'RED SIDE');
const sideColor = computed(() => props.playerIndex < 5 ? '#69a1ff' : '#ff5064');
// The stats endpoint exposes team metadata; build responses may not.
const team = computed(() => stats.value?.team);
const teamTag = computed(() => team.value?.tag || ('name' in (team.value ?? {}) ? String((team.value as { name?: string }).name ?? '') : ''));
function asset(path?: string | null) { return path ? client.getCacheUrl(path) : undefined; }
const splash = computed(() => asset(champion.value?.splashCenteredImg || champion.value?.splashImg || champion.value?.loadingImg || champion.value?.squareImg));
const logo = computed(() => {
  const meta = team.value as { iconUri?: string } | null | undefined;
  return asset(meta?.iconUri);
});
function imageError(e: Event) { if (e.currentTarget instanceof HTMLImageElement) e.currentTarget.style.visibility = 'hidden'; }
function imageLoad(e: Event) { if (e.currentTarget instanceof HTMLImageElement) e.currentTarget.style.visibility = 'visible'; }
function formatValue(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—';
  return String(value);
}
// Exclude these metrics entirely from every Match Performance panel.
// Match the backend label, not its value: -1 can be valid for other metrics.
function isUnsupportedPerformanceStat(key: string): boolean {
  const label = key.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
  const jungleProximity = /(?:jg|jgl|jungle|jungler).*prox|prox.*(?:jg|jgl|jungle|jungler)/.test(label);
  const csOrGoldDifference = /csd|gd|csdiff|creepscorediff|golddiff|gold(?:andcs)?difference|cs(?:andgold)?difference/.test(label);
  const wardStats = /wards?(?:placed|destroyed|killed)|(?:placed|destroyed|killed)wards?/.test(label);
  const healingStats = /^(?:total)?(?:healing|heal)(?:done|dealt|provided|toallies|toothers|toself)?$/.test(label);
  const turretDamage = /(?:turret|tower).*damage|damage.*(?:turret|tower)/.test(label);
  return jungleProximity || (csOrGoldDifference && label.includes('14')) || wardStats || healingStats || turretDamage;
}
const rows = computed(() => (stats.value?.infoRows ?? [])
  .filter(r => r.key && r.value != null && String(r.value).trim() !== '')
  .filter(r => !isUnsupportedPerformanceStat(r.key))
  .map(r => ({ label: r.key.replace(/_/g, ' '), value: formatValue(r.value) })));
const displayedRows = computed(() => rows.value.slice(0, 4));
const showBuildPanels = computed(() => !props.isMocking || (isSpotlight.value && !isAward.value));
const primaryTree = computed(() => build.value?.perks?.primary);
const secondaryTree = computed(() => build.value?.perks?.secondary);
const primaryPerks = computed(() => (build.value?.perks?.perks ?? []).slice(0, 4));
const secondaryPerks = computed(() => (build.value?.perks?.perks ?? []).slice(4, 6));
const purchases = computed(() => (build.value?.items ?? []).map((item, index) => ({ item, index }))
  .sort((a, b) => a.item.gameTime - b.item.gameTime || a.index - b.index));
// Fixed 1080p canvas: show the eight latest purchases with their original sequence numbers.
const visiblePurchases = computed(() => purchases.value.slice(-8));
const purchaseOffset = computed(() => Math.max(0, purchases.value.length - visiblePurchases.value.length));
function purchaseTime(time: number) { return Number.isFinite(time) && time >= 0 ? formatGameClock(time) : '—'; }
</script>

<template>
  <section class="player-screen" :class="{ award: isAward, performance: !isSpotlight }" :style="{ '--side': sideColor }">
    <header class="header">
      <div class="brand"><img :src="fbeLogo" alt="Final Boss Esports"/><strong>FINAL BOSS ESPORTS</strong></div>
      <h1 v-if="isAward">PLAYER OF <em>THE GAME</em></h1>
      <h1 v-else-if="isSpotlight">PLAYER <em>SPOTLIGHT</em></h1>
      <h1 v-else>PLAYER <em>PERFORMANCE</em></h1>
      <div class="header-meta"><small>LEAGUE OF LEGENDS</small><strong>{{ isMocking ? 'MOCK DATA' : 'POSTGAME ANALYSIS' }}</strong></div>
    </header>

    <main v-if="identity && !loading && !error" class="content">
      <section class="hero">
        <img v-if="splash" class="splash" :src="splash" :alt="championName" @error="imageError" @load="imageLoad" />
        <div class="hero-shade"></div><div class="hero-angle"></div>
        <div class="hero-top"><span>{{ isAward ? 'POTG // PRODUCER SELECTION' : isSpotlight ? 'PLAYER PERFORMANCE' : 'PLAYER PERFORMANCE' }}</span><span>{{ isMocking ? 'MOCK PLAYER' : side }}</span></div>
        <div class="identity">
          <div v-if="teamTag || logo" class="team"><img v-if="logo" :src="logo" :alt="teamTag" @error="imageError" @load="imageLoad"/><strong>{{ teamTag }}</strong></div>
          <div class="identity-rule"></div>
          <div v-if="playerName" class="name" :class="{ long: playerName.length > 18 }">{{ playerName }}</div>
          <div v-else class="name missing">NAME UNAVAILABLE</div>
          <div class="champion">{{ championName }}</div>
        </div>
      </section>

      <div class="analysis">
        <section class="panel stat-panel" :class="{ 'has-build': !!build }">
          <div class="panel-heading"><span>01 //</span><h2>MATCH PERFORMANCE</h2><span>FINAL</span></div>
          <div v-if="displayedRows.length" class="stat-grid compact">
            <div v-for="(row, index) in displayedRows" :key="`${row.label}-${index}`" class="stat" :style="{ '--delay': `${index * 85}ms` }">
              <span>{{ row.label }}</span><strong :class="{ 'long-value': row.value.length > 12 }">{{ row.value }}</strong>
            </div>
          </div>
          <div v-else class="no-data">{{ isMocking && isSpotlight && !isAward ? 'Mock build and performance are separate samples. Select Player Performance to view mock statistics.' : 'Performance statistics unavailable.' }}</div>
        </section>

        <section v-if="showBuildPanels" class="panel rune-panel">
          <div class="panel-heading"><span>02 //</span><h2>RUNES</h2><span>LOADOUT</span></div>
          <div v-if="primaryTree || secondaryTree || primaryPerks.length || secondaryPerks.length" class="rune-trees">
            <div class="tree">
              <div class="tree-title"><img v-if="primaryTree?.assetPath" :src="asset(primaryTree.assetPath)" alt="" @error="imageError" @load="imageLoad"/><strong>{{ primaryTree?.treeName || 'Primary' }}</strong></div>
              <div class="perks"><div v-for="(perk, i) in primaryPerks" :key="i" class="perk" :class="{ keystone: i === 0 }" :title="perk.name"><img :src="asset(perk.iconPath)" :alt="perk.name" @error="imageError" @load="imageLoad"/></div></div>
            </div>
            <div class="tree">
              <div class="tree-title"><img v-if="secondaryTree?.assetPath" :src="asset(secondaryTree.assetPath)" alt="" @error="imageError" @load="imageLoad"/><strong>{{ secondaryTree?.treeName || 'Secondary' }}</strong></div>
              <div class="perks"><div v-for="(perk, i) in secondaryPerks" :key="i" class="perk" :title="perk.name"><img :src="asset(perk.iconPath)" :alt="perk.name" @error="imageError" @load="imageLoad"/></div></div>
            </div>
          </div>
          <div v-else class="no-data">Rune data unavailable.</div>
        </section>
        <section v-if="showBuildPanels" class="panel purchase-panel">
          <div class="panel-heading"><span>03 //</span><h2>ITEM PURCHASES</h2><span>CHRONOLOGICAL</span></div>
          <div v-if="visiblePurchases.length" class="purchase-list">
            <div v-for="({ item, index }, i) in visiblePurchases" :key="`${item.id}-${index}`" class="purchase" :style="{ '--delay': `${i * 80}ms` }">
              <div class="item-icon"><img :src="asset(item.assetUrl)" :alt="item.name" @error="imageError" @load="imageLoad"/><small>{{ purchaseOffset + i + 1 }}</small></div>
              <strong>{{ purchaseTime(item.gameTime) }}</strong><span :title="item.name">{{ item.name }}</span>
            </div>
          </div>
          <div v-else class="no-data">Purchase data unavailable.</div>
        </section>
        <p v-if="warning" class="warning">{{ warning }}</p>
      </div>
    </main>
    <div v-else class="empty"><i></i><h2>{{ error ? 'PLAYER DATA UNAVAILABLE' : loading ? 'LOADING PLAYER DATA' : 'AWAITING PLAYER DATA' }}</h2><p v-if="error">{{ error }}</p></div>
    <footer class="footer"><span><i></i> POSTGAME </span><strong>FINALBOSSESPORTS.NET</strong><span>FINAL BOSS ESPORTS // {{ isSpotlight ? '04' : '05' }}</span></footer>
  </section>
</template>

<style scoped>
.player-screen { --gold:#e2b793; --accent:var(--theme-red-bright,#ff263f); --muted:#a99fa2; --line:#ff506431; --heading:'Orbitron','Bahnschrift','Arial Black',sans-serif; --body:'Rajdhani','Inter','Bahnschrift',system-ui,sans-serif; --highlight:var(--accent); position:absolute; inset:0; width:1920px; height:1080px; box-sizing:border-box; padding:36px 52px 30px; display:grid; grid-template-rows:64px minmax(0,1fr) 38px; gap:18px; overflow:hidden; isolation:isolate; color:var(--theme-text,#f5f0eb); font-family:var(--body); font-variant-numeric:tabular-nums; background:radial-gradient(ellipse at 95% 0%,#3b050b80,transparent 48%),radial-gradient(ellipse at 4% 110%,#4e07137a,transparent 52%),repeating-linear-gradient(-14deg,#ffffff04 0 1px,transparent 1px 9px),linear-gradient(125deg,#10090d,#050507 50%,#15090d); }
.player-screen.award { --highlight:var(--gold); }
.player-screen *, .player-screen *::before, .player-screen *::after { box-sizing:border-box; }
.player-screen::after { content:''; position:absolute; inset:14px; border:1px solid #ff263f24; pointer-events:none; z-index:-1; }
.header { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; border-bottom:2px solid var(--highlight); padding-bottom:13px; gap:20px; }
.brand { display:flex; align-items:center; gap:14px; font-size:21px; font-weight:900; letter-spacing:2px; }
.brand img { width:48px; height:48px; object-fit:contain; }
h1 { font:900 36px/1 var(--heading); letter-spacing:3px; white-space:nowrap; } h1 em { color:var(--highlight); font-style:normal; }
.header-meta { text-align:right; } .header-meta small { display:block; font-size:12px; font-weight:800; color:var(--muted); letter-spacing:2px; } .header-meta strong { font-size:17px; letter-spacing:1.5px; }
.content { min-width:0; min-height:0; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.04fr); gap:20px; }
.hero { position:relative; isolation:isolate; overflow:hidden; min-height:0; border:1px solid var(--line); border-top:4px solid var(--highlight); background:radial-gradient(ellipse at 50% 25%,#3b1828,#0b0b10 75%); animation:enter .65s ease both; }
.splash { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:50% 35%; z-index:-3; animation:splash-in 1.4s cubic-bezier(.16,1,.3,1) both; }
.hero-shade { position:absolute; inset:0; z-index:-2; background:linear-gradient(0deg,#08080bfF 3%,#08080bed 17%,#08080b70 42%,transparent 72%),linear-gradient(90deg,#08080b55,transparent 45%,#08080b33); }
.hero-angle { position:absolute; inset:0; z-index:-1; background:linear-gradient(125deg,transparent 0 75%,#ff263f10 75% 76%,transparent 76% 80%,#ff263f12 80% 90%,transparent 90%); }
.hero-top { display:flex; justify-content:space-between; gap:10px; padding:23px 26px; font-size:13px; font-weight:900; letter-spacing:2px; } .hero-top span { background:#09090dd9; border:1px solid #ffffff28; padding:10px 13px; } .hero-top span:first-child { color:var(--highlight); } .hero-top span:last-child { color:var(--side); }
.identity { position:absolute; left:36px; right:36px; bottom:38px; display:flex; flex-direction:column; align-items:flex-start; gap:10px; animation:enter .65s ease .12s both; }
.team { display:flex; align-items:center; gap:14px; color:var(--side); font:900 24px/1 var(--heading); } .team img { width:52px; height:52px; object-fit:contain; }
.identity-rule { width:104px; height:5px; background:var(--highlight); box-shadow:0 0 25px #ff263f55; }
.name { max-width:100%; font:900 66px/1.06 var(--heading); letter-spacing:1px; text-transform:uppercase; overflow-wrap:anywhere; text-shadow:0 4px 20px #000; } .name.long { font-size:44px; } .name.missing { font-size:38px; color:#b5aeb1; }
.champion { color:var(--highlight); font-size:29px; font-weight:900; text-transform:uppercase; letter-spacing:3px; } .identity-note { color:var(--muted); font-size:13px; font-weight:800; letter-spacing:3px; }
.analysis { min-height:0; min-width:0; display:flex; flex-direction:column; gap:13px; }
.panel { min-width:0; min-height:0; background:linear-gradient(145deg,#ff263f09,transparent 55%),#101014; border:1px solid var(--line); border-top:3px solid var(--highlight); padding:18px 22px; animation:enter .5s ease both; }
.panel-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; padding-bottom:12px; border-bottom:1px solid var(--line); } .panel-heading h2 { font:800 19px/1.1 var(--heading); letter-spacing:1px; } .panel-heading > span { color:var(--muted); font-size:12px; font-weight:800; letter-spacing:1.3px; white-space:nowrap; }
.stat-panel { flex:1; display:flex; flex-direction:column; } .stat-grid { flex:1; min-height:0; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); grid-auto-rows:minmax(0,1fr); gap:10px; padding-top:13px; }
.stat { grid-column:span 2; min-width:0; min-height:0; padding:12px 17px; display:flex; flex-direction:column; justify-content:center; gap:6px; border-left:3px solid var(--highlight); background:linear-gradient(120deg,#ffffff0a,#ffffff03); animation:enter .55s ease var(--delay,0ms) both; }
.stat-grid > .stat:last-child:nth-child(odd) { grid-column:2 / span 2; }
.stat span { font-size:15px; font-weight:800; color:#c6bdc1; text-transform:uppercase; letter-spacing:1px; overflow-wrap:anywhere; }
.stat strong { color:var(--highlight); font:900 44px/1.1 var(--heading); overflow-wrap:anywhere; } .stat strong.long-value { font-size:26px; }
.stat-grid.compact .stat { padding:8px 14px; gap:4px; } .stat-grid.compact .stat strong { font-size:33px; } .stat-grid.compact .stat strong.long-value { font-size:23px; } .stat-grid.compact .stat span { font-size:13px; }
.rune-panel,.purchase-panel { flex-shrink:0; } .rune-trees { display:grid; grid-template-columns:1.25fr 1fr; gap:20px; margin-top:12px; } .tree + .tree { border-left:1px solid var(--line); padding-left:20px; } .tree-title { display:flex; align-items:center; gap:8px; font-size:16px; text-transform:uppercase; letter-spacing:1px; color:#c6bdc1; } .tree-title img { width:25px; height:25px; object-fit:contain; } .perks { display:flex; align-items:center; gap:10px; margin-top:8px; } .perk { width:50px; height:50px; border-radius:50%; background:#25222b; border:1px solid #ffffff23; display:grid; place-items:center; overflow:hidden; } .perk.keystone { width:62px; height:62px; border:2px solid var(--gold); } .perk img { width:100%; height:100%; object-fit:contain; }
.purchase-list { display:grid; grid-template-columns:repeat(8,minmax(0,1fr)); gap:8px; margin-top:13px; } .purchase { min-width:0; display:flex; flex-direction:column; align-items:center; gap:5px; animation:enter .5s ease var(--delay,0ms) both; } .item-icon { position:relative; width:58px; height:58px; background:#26232a; border:1px solid #ffffff29; } .item-icon img { width:100%; height:100%; object-fit:cover; } .item-icon small { position:absolute; top:-5px; left:-5px; background:#1b141a; border:1px solid var(--line); padding:1px 5px; font-size:10px; color:var(--gold); font-weight:900; } .purchase strong { font-size:15px; color:var(--highlight); } .purchase > span { display:block; max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:11px; color:#bcb3b8; }
.small-note { flex-shrink:0; color:var(--muted); font-size:12px; font-weight:700; letter-spacing:.5px; margin-top:8px; } .no-data { color:var(--muted); font-size:19px; line-height:1.4; padding:15px 0; } .warning { color:#c6bdc1; font-size:13px; padding:2px 4px; }
.performance .perk.keystone { border-color:var(--highlight); } .performance .item-icon small { color:var(--highlight); }
.empty { display:flex; flex-direction:column; justify-content:center; align-items:center; gap:22px; } .empty i { width:100px; height:4px; background:var(--highlight); } .empty h2 { font:900 42px/1 var(--heading); } .empty p { font-size:20px; color:var(--muted); }
.footer { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; border-top:1px solid var(--line); color:var(--muted); font-size:13px; font-weight:800; letter-spacing:1.5px; } .footer strong { color:var(--accent); font:800 15px/1 var(--heading); letter-spacing:3px; } .footer span:last-child { text-align:right; } .footer i { display:inline-block; width:8px; height:8px; margin-right:6px; background:var(--highlight); transform:rotate(45deg); }
@keyframes enter { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } } @keyframes splash-in { from { opacity:0; transform:scale(1.06); } to { opacity:1; transform:scale(1); } }
@media (prefers-reduced-motion:reduce) { .player-screen *, .player-screen *::before,.player-screen *::after { animation:none!important; transition:none!important; } }
</style>
