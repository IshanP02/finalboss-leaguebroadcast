<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useIngameSelector } from '@/composables/useIngame';
import { useClient } from '@/client';
import { handleImageError, handleImageLoad } from '@/utils/imageUtils';
import fbeLogo from '@/assets/72x72.png';
import TeamRow from './TeamRow.vue';
import TeamObjectiveRow from './TeamObjectiveRow.vue';
import PowerPlayBox from './PowerPlayBox.vue';
const scoreboard = useIngameSelector(s => s.gameData.scoreboard);
const client = useClient();
const seasonIcon = ref<string | null>(null);
const blue = computed(() => scoreboard.value?.teams[0]);
const red = computed(() => scoreboard.value?.teams[1]);
const gameTime = computed(() => {
  const seconds = Math.max(0, Math.floor(scoreboard.value?.gameTime ?? 0));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
});
const cacheStamp = Date.now();
const seasonLogo = computed(() => seasonIcon.value ? `${client.getCacheUrl(seasonIcon.value, true)}?ts=${cacheStamp}` : undefined);
onMounted(async () => {
  try { seasonIcon.value = await client.api.season.getCurrentSeasonIcon(); }
  catch { /* FBE logo remains available if the season has no icon. */ }
});
</script>
<template>
  <Transition name="scoreboard">
    <div v-if="scoreboard && blue && red" class="scoreboard-with-powerplays">
      <div class="scoreboard">
        <div class="top-row">
          <TeamRow :team="blue" :best-of="scoreboard.bestOf" :enemy-team-gold="red.gold"/>
          <div class="center-logo"><img class="fallback" :src="fbeLogo" alt="FBE"/><img v-if="seasonLogo" class="season" :src="seasonLogo" alt="Season logo" @error="handleImageError" @load="handleImageLoad"/></div>
          <TeamRow :team="red" :best-of="scoreboard.bestOf" :enemy-team-gold="blue.gold" mirror/>
        </div>
        <div class="bottom-row">
          <TeamObjectiveRow :team="blue"/>
          <div class="clock">{{gameTime}}</div>
          <TeamObjectiveRow :team="red" mirror/>
        </div>
      </div>
      <div class="powerplay-side left"><PowerPlayBox type="baron" :power-play="blue.baronPowerPlay"/><PowerPlayBox type="elder" :power-play="blue.dragonPowerPlay"/></div>
      <div class="powerplay-side right"><PowerPlayBox type="baron" :power-play="red.baronPowerPlay" mirror/><PowerPlayBox type="elder" :power-play="red.dragonPowerPlay" mirror/></div>
    </div>
  </Transition>
</template>
<style scoped>
/* IngameView centers this exact 800px anchor. Its absolutely positioned children never affect its width. */
.scoreboard-with-powerplays{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:800px;box-sizing:border-box;pointer-events:none;color:#f5f0eb;font-family:Rajdhani,Inter,'Bebas Neue',Arial,sans-serif;font-variant-numeric:tabular-nums;overflow:visible}
.scoreboard{width:100%;display:grid;grid-template-rows:80px 40px;gap:4px;filter:drop-shadow(0 4px 10px #0009)}
.top-row,.bottom-row{display:grid;grid-template-columns:minmax(0,1fr) 72px minmax(0,1fr);box-sizing:border-box;min-width:0;overflow:hidden;background:#0a090d;border:1px solid #ff263f48}
.top-row{border-top:3px solid #ff263f}.bottom-row{background:linear-gradient(100deg,#141822,#0b090e 50%,#21131a)}
.center-logo{position:relative;display:grid;place-items:center;background:linear-gradient(160deg,#3b0c18,#100b11);border-inline:1px solid #ff263f45}
.center-logo img{width:53px;height:53px;object-fit:contain;filter:drop-shadow(0 3px 5px #0009)}.center-logo .season{position:absolute;inset:0;margin:auto}.center-logo:has(.season:not([style*="hidden"]):not([style*="display: none"])) .fallback{visibility:hidden}
.clock{display:grid;place-items:center;background:#170c12;font:900 22px/1 'Bebas Neue',Rajdhani,Arial,sans-serif;letter-spacing:1px;border-inline:1px solid #ff263f35;white-space:nowrap}
.powerplay-side{position:absolute;top:0;width:174px;display:flex;flex-direction:column;gap:4px}.powerplay-side.left{right:calc(100% + 8px)}.powerplay-side.right{left:calc(100% + 8px)}
.scoreboard-enter-active,.scoreboard-leave-active{transition:opacity .35s ease}.scoreboard-enter-from,.scoreboard-leave-to{opacity:0}
@media(prefers-reduced-motion:reduce){.scoreboard-enter-active,.scoreboard-leave-active{transition:none}}
</style>
