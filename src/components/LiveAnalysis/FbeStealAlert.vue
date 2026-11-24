<script setup lang="ts">
import {useClient} from '@/client';
import fbeLogo from '@/assets/72x72.png';
import {sideColor} from './liveAnalysisData';
import type {StealAlert} from '@/composables/useFbeLiveAnalysis';
defineProps<{alert:StealAlert|null;preview?:string}>();
const client=useClient();
function hide(e:Event){if(e.currentTarget instanceof HTMLImageElement)e.currentTarget.style.visibility='hidden';}
function show(e:Event){if(e.currentTarget instanceof HTMLImageElement)e.currentTarget.style.visibility='visible';}
</script>
<template>
  <Transition name="steal" mode="out-in"><div v-if="alert" :key="alert.id" class="steal-banner" :style="{'--side':sideColor(alert.side)}"><img :src="fbeLogo" alt="FBE"/><div class="copy"><small>{{preview?'DESIGN PREVIEW':'OBJECTIVE // STEAL CONFIRMED'}}</small><strong>{{alert.title}}</strong><span v-if="alert.name">{{alert.name}}</span></div><img v-if="alert.portrait" class="champion" :src="client.getCacheUrl(alert.portrait)" alt="" @error="hide" @load="show"/></div></Transition>
</template>
<style scoped>
.steal-banner{position:absolute;top:174px;left:50%;transform:translateX(-50%);z-index:120;display:flex;align-items:center;justify-content:center;gap:18px;min-width:440px;max-width:660px;padding:12px 32px;background:repeating-linear-gradient(-14deg,#ffffff05 0 1px,transparent 1px 9px),linear-gradient(120deg,#3b0710,#09090d 45%,#270911);border:1px solid #e2b793;border-top:4px solid var(--side);box-shadow:0 8px 35px #000b;pointer-events:none;color:#f5f0eb;font-family:Rajdhani,Inter,Arial,sans-serif}.steal-banner img{width:48px;height:48px;object-fit:contain}.steal-banner .champion{object-fit:cover;border:1px solid var(--side)}.copy{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0}.copy small{font-size:11px;font-weight:900;letter-spacing:2px;color:#e2b793}.copy strong{font:900 30px/1 Orbitron,Bahnschrift,Arial,sans-serif;white-space:nowrap;color:#e2b793}.copy span{font-size:18px;font-weight:900;color:var(--side);max-width:360px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.steal-enter-active,.steal-leave-active{transition:transform .28s ease,opacity .28s ease}.steal-enter-from,.steal-leave-to{transform:translate(-50%,-18px);opacity:0}@media(prefers-reduced-motion:reduce){.steal-enter-active,.steal-leave-active{transition:none}}
</style>
