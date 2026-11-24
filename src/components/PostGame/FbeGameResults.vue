<script setup lang="ts">
import { computed } from "vue";
import {
  getPostGameSides,
  formatGameClock,
  type postGameOverview,
} from "@bluebottle_gg/league-broadcast-client";
import { useClient } from "@/client";
import { useGameResultsDetails } from "@/composables/useGameResultsDetails";
import fbeLogo from "@/assets/72x72.png";

// Drop-in replacement for Phase 3. No router or caster changes required.
const props = withDefaults(defineProps<{
  overview: postGameOverview | null;
  gameId?: number;
  isMocking?: boolean;
  loading?: boolean;
  error?: string;
}>(), { isMocking: false, loading: false, error: "" });

const client = useClient();
const { players: playerDetails, match, loading: detailsLoading } = useGameResultsDetails(
  computed(() => props.gameId),
  computed(() => props.isMocking),
  computed(() => !!props.overview),
);

function numberText(value?: number | null): string {
  return value == null || !Number.isFinite(value) ? "—" : value.toLocaleString("en-US");
}
function compactNumber(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(value);
}
function kdaText(kills?: number, deaths?: number, assists?: number): string {
  return kills == null || deaths == null || assists == null ? "—" : `${kills} / ${deaths} / ${assists}`;
}
function cacheUrl(path?: string): string | undefined {
  return path ? client.getCacheUrl(path) : undefined;
}
function hideBrokenImage(event: Event) {
  if (event.currentTarget instanceof HTMLImageElement) event.currentTarget.style.visibility = "hidden";
}
function restoreImage(event: Event) {
  if (event.currentTarget instanceof HTMLImageElement) event.currentTarget.style.visibility = "visible";
}
function cleanName(name?: string | null): string {
  // Hide Riot ID tags in the broadcast, without stripping spaces in the name.
  return name?.split("#")[0]?.trim() ?? "";
}

const dragonAssets = import.meta.glob<string>("@/assets/dragon/*.png", {
  eager: true, query: "?url", import: "default",
});
const dragonNames: Record<string, string> = {
  fire: "Infernal", air: "Cloud", earth: "Mountain", water: "Ocean",
  hextech: "Hextech", chemtech: "Chemtech", elder: "Elder",
};
function dragonName(type: string): string { return dragonNames[type.toLowerCase()] ?? type; }
function dragonIcon(type: string): string | undefined {
  const file = `/${type.toLowerCase()}.png`;
  return Object.entries(dragonAssets).find(([path]) => path.endsWith(file))?.[1];
}

const sides = computed(() => props.overview
  ? [...getPostGameSides(props.overview)].sort((a,b) => a-b).slice(0,2) : []);
const winnerKnown = computed(() => {
  const winnerSide = props.overview?.winnerSide;
  return winnerSide !== undefined && sides.value.includes(winnerSide);
});

function normalizeStatKey(key: string): string { return key.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function getPlayerStat(index: number | undefined, keys: string[]): string {
  if (index === undefined) return "—";
  const rows = playerDetails.value.find(p => p.index === index)?.stats?.infoRows ?? [];
  const normalized = keys.map(normalizeStatKey);
  const row = rows.find(r => normalized.includes(normalizeStatKey(r.key)));
  return row?.value == null ? "—" : String(row.value);
}
function getPlayerKda(index?: number): string {
  const combined = getPlayerStat(index, ["KDA", "Kills Deaths Assists"]);
  if (combined !== "—") return combined;
  const parts = ["Kills", "Deaths", "Assists"].map(key => getPlayerStat(index, [key]));
  return parts.includes("—") ? "—" : parts.join("/");
}

const teams = computed(() => {
  const overview = props.overview;
  if (!overview) return [];
  return sides.value.map((side, sideIndex) => {
    const summary = overview.teamOverviewBySide?.[side];
    const info = overview.teamInfoBySide?.[side];
    const name = summary?.metaData?.name || info?.name || (sideIndex === 0 ? "Blue Side" : "Red Side");
    const tag = summary?.metaData?.tag || info?.tag || name;
    const teamId = summary?.metaData?.teamId ?? info?.teamId;
    const entries = overview.damageGraph?.damageByTeam?.[side]?.entries ?? [];
    const firstIndex = sideIndex === 0 ? 0 : 5;
    const sideDetails = playerDetails.value.filter(p => p.index >= firstIndex && p.index < firstIndex + 5);

    const players = entries.map((entry, index) => {
      const champion = entry.champion;
      // Match additional REST stats by champion within the same side.
      // A known team ID that contradicts the side rules out the stats record.
      const detail = champion?.id == null ? undefined : sideDetails.find(p => {
        const detailTeam = p.stats?.team?.teamId;
        return (teamId == null || detailTeam == null || detailTeam === teamId) &&
          (p.stats?.champion?.id === champion.id || p.build?.champion?.id === champion.id);
      });
      const stats = champion?.id != null && detail?.stats?.champion?.id === champion.id ? detail.stats : null;
      const build = champion?.id != null && detail?.build?.champion?.id === champion.id ? detail.build : null;
      const playerIndex = stats ? detail?.index : undefined;

      // The damage entry contains the name for THIS champion, including in mock data
      // when the backend supplies it. Prefer a matched broadcast display name if present.
      const playerName = cleanName(stats?.displayName) || cleanName(entry.playerName) ||
        cleanName(stats?.nameWithTag) || cleanName(build?.displayName) || cleanName(build?.nameWithTag);
      const recentPurchases = [...(build?.items ?? [])].sort((a,b) => a.gameTime - b.gameTime).slice(-5);
      return {
        key: `${side}-${champion?.id ?? index}-${index}`,
        name: playerName || "Name unavailable",
        hasName: !!playerName,
        championName: champion?.name || "Unknown champion",
        portrait: cacheUrl(champion?.squareImg),
        damage: entry.damage,
        kda: getPlayerKda(playerIndex),
        cs: getPlayerStat(playerIndex, ["CS", "Total CS", "Creep Score", "Minions Killed"]),
        gold: getPlayerStat(playerIndex, ["Gold", "Gold Earned", "Total Gold"]),
        recentPurchases,
      };
    });
    return {
      side, teamId, name, tag, summary, players,
      logo: cacheUrl(summary?.metaData?.iconUri || info?.iconUri),
      color: sideIndex === 0 ? "#69a1ff" : "#ff5064",
      sideName: sideIndex === 0 ? "Blue side" : "Red side",
      won: overview.winnerSide === side,
      bans: summary?.bans ?? [],
      dragons: summary?.dragons ?? [],
    };
  });
});
const left = computed(() => teams.value[0]);
const right = computed(() => teams.value[1]);
const winner = computed(() => winnerKnown.value ? teams.value.find(t => t.won) : undefined);
const gameClock = computed(() => props.overview ? formatGameClock(props.overview.gameTime) : "—");
const patch = computed(() => props.overview?.patch?.split(".").slice(0,2).join(".") || "—");
const maximumDamage = computed(() => Math.max(0, ...teams.value.flatMap(t => t.players.map(p => Number.isFinite(p.damage) ? p.damage : 0))));
function isTopDamage(value?: number): boolean { return maximumDamage.value > 0 && value === maximumDamage.value; }
function damageWidth(value?: number): string {
  return `${typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value / Math.max(1, maximumDamage.value) * 100)) : 0}%`;
}
function comparisonWidth(value?: number, opponent?: number): string {
  if (value == null || !Number.isFinite(value)) return "0%";
  return `${Math.max(0, value) / Math.max(1, value, Number.isFinite(opponent) ? (opponent ?? 0) : 0) * 100}%`;
}
interface ComparisonRow { label: string; left?: number; right?: number; compact?: boolean }
const comparisonRows = computed<ComparisonRow[]>(() => {
  const b = left.value?.summary, r = right.value?.summary;
  return [
    { label: "Total gold", left: b?.gold, right: r?.gold, compact: true },
    { label: "Towers", left: b?.towers, right: r?.towers },
    { label: "Void grubs", left: b?.grubs, right: r?.grubs },
    { label: "Rift heralds", left: b?.heralds, right: r?.heralds },
    { label: "Barons", left: b?.baronNashors, right: r?.baronNashors },
    { label: "Elder dragons", left: b?.elderDragons, right: r?.elderDragons },
    { label: "Objective bounties", left: b?.objectiveBounties, right: r?.objectiveBounties },
    { label: "Bounty gold", left: b?.objectiveBountyGold, right: r?.objectiveBountyGold },
  ];
});
function comparisonText(value?: number, compact?: boolean): string { return compact ? compactNumber(value) : numberText(value); }
const seriesScore = computed(() => {
  const data = match.value, leftId = left.value?.teamId, rightId = right.value?.teamId;
  if (!data || leftId == null || rightId == null ||
    !data.teams.some(t => t.teamId === leftId) || !data.teams.some(t => t.teamId === rightId)) return null;
  const completed = data.games.filter(g => g.isComplete);
  if (!completed.length) return null;
  return {
    left: completed.filter(g => g.gameWinnerId === leftId).length,
    right: completed.filter(g => g.gameWinnerId === rightId).length,
    bestOf: Number(data.type),
  };
});
</script>

<template>
  <section class="results-screen">
    <header class="results-header">
      <div class="brand">
        <img
          :src="fbeLogo"
          alt="Final Boss Esports"
          class="fbe-logo"
        />
        <div><strong>FINAL BOSS ESPORTS</strong></div>
      </div>
      <h1>GAME <em>RESULTS</em></h1>
      <div class="patch-label"><span>LEAGUE OF LEGENDS</span><strong>PATCH {{ patch }}</strong></div>
    </header>

    <template v-if="overview && left && right">
      <div class="scoreboard">
        <div v-for="(team, index) in teams" :key="team.side" class="team-hero"
          :class="{ winner: winnerKnown && team.won, loser: winnerKnown && !team.won, mirrored: index === 1 }"
          :style="{ '--side-color': team.color, gridColumn: index === 0 ? '1' : '3' }">
          <img v-if="team.logo" class="logo-watermark" :src="team.logo" alt="" @error="hideBrokenImage" @load="restoreImage" />
          <div class="team-logo">
            <span>{{ team.tag }}</span>
            <img v-if="team.logo" :src="team.logo" :alt="team.name" @error="hideBrokenImage" @load="restoreImage" />
          </div>
          <div class="team-identity">
            <div class="side-label">{{ team.sideName }}</div>
            <h2>{{ team.tag }}</h2>
            <div class="full-team-name">{{ team.name }}</div>
            <div v-if="winnerKnown" class="result-label">{{ team.won ? 'VICTORY' : 'DEFEAT' }}</div>
          </div>
          <div class="kill-score"><strong>{{ numberText(team.summary?.kills) }}</strong><span>KILLS</span></div>
        </div>
        <div class="center-score">
          <span class="small-label">GAME DURATION</span>
          <strong class="clock">{{ gameClock }}</strong>
          <div v-if="winner" class="winner-line">{{ winner.tag }} WINS</div>
          <template v-if="seriesScore">
            <div class="series-score">{{ seriesScore.left }} <span>–</span> {{ seriesScore.right }}</div>
            <span class="small-label">RECORDED SERIES<template v-if="seriesScore.bestOf"> · BO{{ seriesScore.bestOf }}</template></span>
          </template>
          <span v-else class="small-label final-label">FINAL SCORE</span>
        </div>
      </div>

      <main class="results-body">
        <section v-for="(team, index) in teams" :key="team.side" class="team-panel"
          :class="{ 'right-panel': index === 1 }" :style="{ '--side-color': team.color, gridColumn: index === 0 ? '1' : '3' }">
          <div class="panel-heading"><h3><span>{{ team.tag }}</span> // LINEUP</h3><span>DAMAGE TO CHAMPIONS</span></div>
          <div class="player-list">
            <div v-for="(player, playerPosition) in team.players" :key="player.key" class="player-row"
              :class="{ 'top-damage': isTopDamage(player.damage) }" :style="{ '--delay': `${playerPosition * 75}ms` }">
              <div class="champion-portrait">
                <img v-if="player.portrait" :src="player.portrait" :alt="player.championName" @error="hideBrokenImage" @load="restoreImage" />
              </div>
              <div class="player-information">
                <div class="player-name-row">
                  <strong class="player-name" :class="{ 'missing-name': !player.hasName }">{{ player.name }}</strong>
                  <strong class="damage-number">{{ compactNumber(player.damage) }}</strong>
                </div>
                <div class="player-subline">
                  <span class="champion-name">{{ player.championName }}</span>
                  <span v-if="isTopDamage(player.damage)" class="top-label">TOP DAMAGE</span>
                </div>
                <div class="damage-track"><div class="damage-fill" :style="{ width: damageWidth(player.damage) }" /></div>
                <div v-if="player.kda !== '—' || player.cs !== '—' || player.gold !== '—' || player.recentPurchases.length" class="player-secondary">
                  <span v-if="player.kda !== '—'">KDA {{ player.kda }}</span>
                  <span v-if="player.cs !== '—'">CS {{ player.cs }}</span>
                  <span v-if="player.gold !== '—'">G {{ player.gold }}</span>
                  <div v-if="player.recentPurchases.length" class="recent-items">
                    <img v-for="(item,i) in player.recentPurchases" :key="`${item.id}-${i}`" :src="cacheUrl(item.assetUrl)" :alt="item.name" :title="item.name" @error="hideBrokenImage" @load="restoreImage" />
                  </div>
                </div>
              </div>
            </div>
            <div v-if="!team.players.length" class="no-data">Champion damage data unavailable</div>
          </div>
          <div class="lineup-note">
            <template v-if="detailsLoading">Loading additional player statistics…</template>
            <template v-else-if="team.players.some(p => p.recentPurchases.length)">Item icons: recent purchases, not final inventory</template>
            <template v-else>SHARED DAMAGE SCALE // BOTH TEAMS</template>
          </div>
          <div class="bans-section">
            <h3>CHAMPION BANS</h3>
            <div class="ban-list">
              <div v-for="(ban, i) in team.bans" :key="`${ban?.id ?? 'empty'}-${i}`" class="ban" :title="ban?.name">
                <img v-if="ban?.squareImg" :src="cacheUrl(ban.squareImg)" :alt="ban.name" @error="hideBrokenImage" @load="restoreImage" />
                <div class="ban-slash"></div>
              </div>
              <span v-if="!team.bans.length" class="no-data">No ban data</span>
            </div>
          </div>
        </section>

        <section class="comparison-panel">
          <div class="comparison-heading"><span>01 //</span> TEAM COMPARISON <span>FINAL</span></div>
          <div class="kda-row">
            <strong class="blue-text">{{ kdaText(left.summary?.kills, left.summary?.deaths, left.summary?.assists) }}</strong>
            <span>K / D / A</span>
            <strong class="red-text">{{ kdaText(right.summary?.kills, right.summary?.deaths, right.summary?.assists) }}</strong>
          </div>
          <div class="comparison-list">
            <div v-for="(row,i) in comparisonRows" :key="row.label" class="comparison-row" :style="{ '--delay': `${i * 65}ms` }">
              <div class="comparison-values">
                <strong class="blue-text">{{ comparisonText(row.left,row.compact) }}</strong>
                <span>{{ row.label }}</span>
                <strong class="red-text">{{ comparisonText(row.right,row.compact) }}</strong>
              </div>
              <div class="comparison-bars">
                <div class="comparison-track blue-track"><div class="comparison-fill blue-fill" :style="{ width: comparisonWidth(row.left,row.right) }" /></div>
                <div class="comparison-track"><div class="comparison-fill red-fill" :style="{ width: comparisonWidth(row.right,row.left) }" /></div>
              </div>
            </div>
          </div>
          <div class="dragon-section">
            <div class="dragon-heading"><strong class="blue-text">{{ left.summary ? left.dragons.length : '—' }}</strong><span>ELEMENTAL DRAKES</span><strong class="red-text">{{ right.summary ? right.dragons.length : '—' }}</strong></div>
            <div class="dragon-comparison">
              <div v-for="team in teams" :key="team.side" class="dragon-icons">
                <div v-for="(dragon,i) in team.dragons" :key="`${dragon}-${i}`" class="dragon-icon">
                  <img v-if="dragonIcon(dragon)" :src="dragonIcon(dragon)" :alt="dragonName(dragon)" :title="dragonName(dragon)" />
                  <span v-else>{{ dragonName(dragon) }}</span>
                </div>
                <span v-if="!team.dragons.length" class="no-drakes">—</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </template>

    <div v-else class="empty-state">
      <div class="loading-accent"></div>
      <h2>{{ error ? 'RESULTS UNAVAILABLE' : loading ? 'LOADING GAME RESULTS' : 'AWAITING GAME RESULTS' }}</h2>
      <p v-if="error">{{ error }}</p>
    </div>

    <footer class="results-footer">
      <span><i></i> POSTGAME // MATCH REPORT</span>
      <span class="footer-brand">FINALBOSSESPORTS.NET</span>
      <span>FINAL BOSS ESPORTS <b>//</b> 01</span>
    </footer>
  </section>
</template>

<style scoped>
/* Use locally available brand fonts when present; no external requests in OBS. */
.results-screen {
  --pg-blue: #69a1ff; --pg-red: #ff5064; --pg-gold: #e2b793;
  --pg-accent: var(--theme-red-bright, #ff263f);
  --pg-muted: #a99fa2; --pg-line: rgba(255, 90, 110, .19);
  --pg-heading: "Orbitron", "Bahnschrift", "Arial Black", sans-serif;
  --pg-body: "Rajdhani", "Inter", "Bahnschrift", system-ui, sans-serif;
  position: absolute; inset: 0; width: 1920px; height: 1080px;
  box-sizing: border-box; padding: 36px 52px 30px;
  display: grid; grid-template-rows: 64px 176px minmax(0, 1fr) 38px; gap: 18px;
  overflow: hidden; isolation: isolate;
  color: var(--theme-text, #f5f0eb); font-family: var(--pg-body); font-variant-numeric: tabular-nums;
  background: radial-gradient(ellipse at 95% 0%, #3b050b80, transparent 48%),
    radial-gradient(ellipse at 4% 110%, #4e07137a, transparent 52%),
    repeating-linear-gradient(-14deg, #ffffff04 0 1px, transparent 1px 9px),
    linear-gradient(125deg, #10090d, #050507 50%, #15090d);
}
.results-screen::before { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: -1;
  background: linear-gradient(115deg, transparent 0 76%, #ff263f0b 76% 77%, transparent 77% 82%, #ff263f08 82% 90%, transparent 90%); }
.results-screen::after { content: ""; position: absolute; inset: 14px; border: 1px solid #ff263f24; pointer-events: none; z-index: -1; }
.results-screen *, .results-screen *::before, .results-screen *::after { box-sizing: border-box; }
.results-header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-bottom: 2px solid var(--pg-accent); padding-bottom: 13px; }
.brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.brand-mark { display: grid; place-items: center; width: 76px; height: 42px; flex: 0 0 76px;
  background: linear-gradient(135deg,#e91b37,#7c0a1a); clip-path: polygon(0 0,100% 0,100% 72%,84% 100%,0 100%);
  font: 900 23px/1 var(--pg-heading); letter-spacing: -1px; }
.brand strong { display: block; font-size: 21px; font-weight: 900; letter-spacing: 2px; }
.brand small, .patch-label span { display: block; color: var(--pg-muted); font-size: 12px; font-weight: 700; letter-spacing: 2px; }
.results-header h1 { font: 900 37px/1 var(--pg-heading); letter-spacing: 3px; white-space: nowrap; }
.results-header h1 em { color: var(--pg-accent); font-style: normal; }
.fbe-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
}
.patch-label { justify-self: end; text-align: right; }
.patch-label strong { display: block; margin-top: 4px; font-size: 18px; font-weight: 800; letter-spacing: 2px; }

.scoreboard { display: grid; grid-template-columns: minmax(0,1fr) 280px minmax(0,1fr); grid-template-rows: 1fr; gap: 14px; }
.team-hero { position: relative; isolation: isolate; grid-row: 1; display: flex; align-items: center; gap: 20px; min-width: 0; overflow: hidden;
  padding: 19px 25px; border: 1px solid color-mix(in srgb,var(--side-color) 35%,transparent); border-top: 4px solid var(--side-color);
  background: linear-gradient(120deg,color-mix(in srgb,var(--side-color) 16%,#0c0c11),#101015 70%);
  animation: panel-enter .55s ease both; }
.team-hero.mirrored { flex-direction: row-reverse; text-align: right; background: linear-gradient(240deg,color-mix(in srgb,var(--side-color) 16%,#0c0c11),#101015 70%); }
.team-hero.winner { box-shadow: inset 0 -2px var(--pg-gold), inset 0 0 35px #e2b79309; }
.logo-watermark { position: absolute; width: 260px; height: 260px; object-fit: contain; left: 27%; top: -45px; opacity: .065; z-index: -1; }
.mirrored .logo-watermark { left: auto; right: 27%; }
.team-logo { position: relative; width: 115px; height: 115px; flex: 0 0 115px; display: grid; place-items: center; }
.team-logo span { color: var(--side-color); font-size: 25px; font-weight: 900; overflow-wrap: anywhere; text-align: center; }
.team-logo:has(img:not([style*="hidden"])) span { visibility: hidden; }
.team-logo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 10px #000b); }
.team-identity { flex: 1; min-width: 0; }
.side-label { font-size: 13px; font-weight: 800; color: var(--side-color); letter-spacing: 3px; text-transform: uppercase; }
.team-identity h2 { font: 900 46px/1.08 var(--pg-heading); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.full-team-name { color: #c9c0c3; font-size: 18px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result-label { display: inline-block; margin-top: 7px; padding: 5px 16px; background: #2a282d; color: #b5aeb1; font-size: 16px; font-weight: 900; letter-spacing: 3px; }
.winner .result-label { background: linear-gradient(110deg,#f0d2ae,#c49571); color: #190e10; clip-path: polygon(0 0,100% 0,100% 72%,94% 100%,0 100%); }
.kill-score { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
.kill-score strong { font: 900 74px/.94 var(--pg-heading); letter-spacing: -4px; }
.kill-score span { color: var(--pg-muted); margin-top: 10px; font-size: 13px; font-weight: 800; letter-spacing: 3px; }
.center-score { grid-column: 2; grid-row: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 5px; background: #100e12; border: 1px solid var(--pg-line); text-align: center; }
.small-label { font-size: 12px; font-weight: 800; letter-spacing: 2px; color: var(--pg-muted); }
.clock { font: 900 43px/1.05 var(--pg-heading); white-space: nowrap; }
.winner-line { font-size: 16px; font-weight: 900; color: var(--pg-gold); letter-spacing: 2px; max-width: 245px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.final-label { color: var(--pg-accent); margin-top: 5px; }
.series-score { font-size: 27px; font-weight: 900; line-height: 1; }
.series-score span { color: var(--pg-muted); }

.results-body { min-height: 0; display: grid; grid-template-columns: minmax(0,1fr) minmax(0,.89fr) minmax(0,1fr); grid-template-rows: minmax(0,1fr); gap: 14px; }
.team-panel, .comparison-panel { grid-row: 1; min-width: 0; min-height: 0; background: linear-gradient(135deg,#ff263f08,transparent 38%),#0c0c10eF; border: 1px solid var(--pg-line); }
.team-panel { border-top: 3px solid var(--side-color); padding: 18px 18px 15px; display: flex; flex-direction: column; }
.panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding-bottom: 13px; flex-shrink: 0; }
.panel-heading h3 { font: 800 18px/1.1 var(--pg-heading); min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.panel-heading h3 span { color: var(--side-color); }
.panel-heading > span { color: var(--pg-muted); font-size: 11px; font-weight: 800; letter-spacing: .8px; flex-shrink: 0; }
.player-list { display: flex; flex-direction: column; gap: 7px; flex: 1; min-height: 0; overflow: hidden; }
.player-row { position: relative; display: flex; align-items: center; flex: 1; gap: 13px; min-height: 0; padding: 7px 11px; border-left: 3px solid var(--side-color); background: linear-gradient(100deg,color-mix(in srgb,var(--side-color) 8%,#19191e),#141419 75%); animation: panel-enter .45s ease var(--delay,0ms) both; }
.right-panel .player-row { border-left: 0; border-right: 3px solid var(--side-color); flex-direction: row-reverse; background: linear-gradient(260deg,color-mix(in srgb,var(--side-color) 8%,#19191e),#141419 75%); }
.player-row.top-damage { box-shadow: inset 0 0 0 1px #e2b79380; }
.champion-portrait { width: 65px; height: 65px; flex: 0 0 65px; overflow: hidden; background: #23232b; border: 1px solid #ffffff25; }
.champion-portrait img { display: block; width: 100%; height: 100%; object-fit: cover; }
.player-information { flex: 1; min-width: 0; }
.player-name-row, .player-subline { display: flex; justify-content: space-between; align-items: baseline; gap: 9px; min-width: 0; }
.player-name { font-size: 25px; font-weight: 900; line-height: 1.05; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.missing-name { color: var(--pg-muted); font-size: 17px; }
.damage-number { font-size: 25px; font-weight: 900; color: var(--side-color); line-height: 1; flex-shrink: 0; }
.champion-name { font-size: 15px; font-weight: 650; color: #bcb3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.top-label { color: var(--pg-gold); font-size: 11px; font-weight: 900; letter-spacing: 1.2px; white-space: nowrap; }
.damage-track { height: 7px; margin-top: 4px; background: #2b2a32; overflow: hidden; }
.damage-fill { height: 100%; background: linear-gradient(90deg,color-mix(in srgb,var(--side-color) 55%,#000),var(--side-color)); transform-origin: left; animation: bar-reveal .95s cubic-bezier(.16,1,.3,1) var(--delay,0ms) both; transition: width .35s ease; }
.right-panel .player-name-row, .right-panel .player-subline { flex-direction: row-reverse; }
.right-panel .damage-track { display: flex; justify-content: flex-end; }
.right-panel .damage-fill { transform-origin: right; background: linear-gradient(270deg,color-mix(in srgb,var(--side-color) 55%,#000),var(--side-color)); }
.player-secondary { display: flex; align-items: center; gap: 8px; min-width: 0; margin-top: 3px; font-size: 12px; font-weight: 700; color: #c6bdc1; overflow: hidden; }
.player-secondary > span { white-space: nowrap; }
.right-panel .player-secondary { flex-direction: row-reverse; }
.recent-items { display: flex; gap: 3px; margin-left: auto; flex-shrink: 0; }
.right-panel .recent-items { margin-left: 0; margin-right: auto; }
.recent-items img { width: 20px; height: 20px; object-fit: cover; border: 1px solid #ffffff25; }
.lineup-note { flex-shrink: 0; padding: 7px 0 8px; min-height: 29px; color: var(--pg-muted); text-align: right; font-size: 10px; font-weight: 700; letter-spacing: 1px; }
.bans-section { flex-shrink: 0; border-top: 1px solid var(--pg-line); padding-top: 9px; }
.bans-section h3 { font-size: 13px; font-weight: 800; color: var(--pg-muted); letter-spacing: 2px; margin-bottom: 8px; }
.ban-list { display: flex; justify-content: center; gap: 9px; min-height: 49px; }
.ban { position: relative; width: 49px; height: 49px; background: #232029; border: 1px solid #563039; overflow: hidden; }
.ban img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(.85) brightness(.75); }
.ban-slash { position: absolute; inset: 0; background: linear-gradient(135deg,transparent 47%,#ff4056 48% 51%,transparent 52%); }
.no-data { padding: 10px; text-align: center; font-size: 15px; color: var(--pg-muted); }

.comparison-panel { grid-column: 2; border-top: 3px solid var(--pg-accent); display: flex; flex-direction: column; padding: 18px 22px 14px; }
.comparison-heading { display: flex; align-items: center; justify-content: space-between; gap: 5px; border-bottom: 1px solid var(--pg-line); padding-bottom: 13px; font: 800 18px/1.1 var(--pg-heading); white-space: nowrap; }
.comparison-heading > span { color: var(--pg-muted); font: 800 11px/1 var(--pg-body); letter-spacing: 1px; }
.kda-row, .comparison-values, .dragon-heading { display: grid; grid-template-columns: 1fr 1.4fr 1fr; align-items: center; gap: 5px; text-align: center; }
.kda-row { padding: 13px 0; border-bottom: 1px solid #ffffff09; }
.kda-row strong { font-size: 20px; font-weight: 900; white-space: nowrap; }
.kda-row span, .comparison-values span, .dragon-heading span { font-size: 13px; font-weight: 800; letter-spacing: 1px; color: #c6bdc1; text-transform: uppercase; }
.comparison-list { display: flex; flex-direction: column; justify-content: space-evenly; flex: 1; min-height: 0; gap: 4px; }
.comparison-row { animation: panel-enter .45s ease var(--delay,0ms) both; }
.comparison-values strong, .dragon-heading strong { font-size: 26px; font-weight: 900; line-height: 1.1; }
.blue-text { color: var(--pg-blue); } .red-text { color: var(--pg-red); }
.comparison-bars { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 5px; }
.comparison-track { display: flex; height: 6px; background: #27262d; overflow: hidden; }
.blue-track { justify-content: flex-end; }
.comparison-fill { height: 100%; animation: bar-reveal .8s ease var(--delay,0ms) both; transition: width .35s ease; }
.blue-fill { background: var(--pg-blue); transform-origin: right; }
.red-fill { background: var(--pg-red); transform-origin: left; }
.dragon-section { flex-shrink: 0; padding-top: 10px; border-top: 1px solid var(--pg-line); }
.dragon-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 7px; }
.dragon-icons { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 5px; min-height: 32px; }
.dragon-icon img { width: 29px; height: 29px; object-fit: contain; }
.dragon-icon span, .no-drakes { font-size: 12px; color: var(--pg-muted); }

.empty-state { grid-row: 2 / 4; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; text-align: center; }
.empty-state h2 { font: 900 45px/1.1 var(--pg-heading); letter-spacing: 2px; }
.empty-state p { color: var(--pg-muted); font-size: 20px; }
.loading-accent { height: 4px; width: 120px; background: var(--pg-accent); box-shadow: 0 0 25px var(--pg-accent); }
.results-footer { grid-row: 4; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-top: 1px solid var(--pg-line); font-size: 13px; font-weight: 800; letter-spacing: 1.5px; color: var(--pg-muted); }
.results-footer span:last-child { text-align: right; }
.results-footer b { color: var(--pg-accent); }
.results-footer i { display: inline-block; width: 8px; height: 8px; margin-right: 6px; background: var(--pg-accent); transform: rotate(45deg); box-shadow: 0 0 9px #ff263f80; }
.footer-brand { font: 800 15px/1 var(--pg-heading); color: var(--pg-accent); letter-spacing: 3px; }
@keyframes panel-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bar-reveal { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) { .results-screen *, .results-screen *::before, .results-screen *::after { animation: none !important; transition: none !important; } }
</style>
