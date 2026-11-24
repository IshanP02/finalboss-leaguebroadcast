<script setup lang="ts">
import type { ingameScoreboardTeamData } from '@bluebottle_gg/league-broadcast-client';
import Grubs from '@/assets/grubs.png';
import Fire from '@/assets/dragon/fire.png';
import Air from '@/assets/dragon/air.png';
import Chemtech from '@/assets/dragon/chemtech.png';
import Hextech from '@/assets/dragon/hextech.png';
import Earth from '@/assets/dragon/earth.png';
import Water from '@/assets/dragon/water.png';
import Elder from '@/assets/dragon/elder.png';
import { handleImageError, handleImageLoad } from '@/utils/imageUtils';
defineProps<{team:ingameScoreboardTeamData;mirror?:boolean}>();
const icons:Record<string,string>={fire:Fire,air:Air,chemtech:Chemtech,hextech:Hextech,earth:Earth,water:Water,elder:Elder};
const getDragonIcon=(type:string)=>icons[type.toLowerCase()];
</script>
<template>
  <div class="objective-row" :class="{mirror}">
    <div class="grubs"><img :src="Grubs" alt="Void Grubs"/><b>{{team.grubs}}</b><small>GRUBS</small></div>
    <div class="dragons"><small>DRAKES</small><div class="dragon-list"><template v-for="(dragon,i) in team.dragons" :key="`${dragon}-${i}`"><img v-if="getDragonIcon(dragon)" :src="getDragonIcon(dragon)" :alt="dragon" @error="handleImageError" @load="handleImageLoad"/><span v-else class="unknown-dragon" :title="dragon">?</span></template><span v-if="!team.dragons?.length" class="no-drakes">—</span></div></div>
  </div>
</template>
<style scoped>
.objective-row{--side:#69a1ff;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 8px;min-width:0;height:100%;box-sizing:border-box;border-left:3px solid var(--side);color:#f5f0eb;overflow:hidden}.objective-row.mirror{--side:#ff5064;flex-direction:row-reverse;border-left:0;border-right:3px solid var(--side)}
.grubs,.dragons,.dragon-list{display:flex;align-items:center;gap:5px}.grubs{flex-shrink:0}.grubs img{width:23px;height:23px;object-fit:contain}.grubs b{font:900 23px/1 'Bebas Neue',Rajdhani,Arial,sans-serif}.objective-row small{font-size:10px;font-weight:800;letter-spacing:.7px;color:#a99fa2;white-space:nowrap}.dragons{min-width:0}.dragon-list{min-width:0;gap:4px}.dragon-list img{width:clamp(15px,1.25vw,23px);height:23px;min-width:0;flex:0 1 23px;object-fit:contain;filter:drop-shadow(0 1px 3px #0009)}.mirror .grubs,.mirror .dragons,.mirror .dragon-list{flex-direction:row-reverse}.no-drakes,.unknown-dragon{color:#a99fa2;font-size:16px}
</style>
