import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useClient } from '@/client';
import { useIngameSelector, useIsInGame, useIngameConnected } from '@/composables/useIngame';
import { chooseBottom, objectiveModel, nameOf, sideOf, type LiveData, type Identity, type Side } from '@/components/LiveAnalysis/liveAnalysisData';
import { fixture } from '@/components/LiveAnalysis/liveAnalysisFixtures';
export type StealAlert = { id:number; title:string; name:string; side:Side|null; portrait?:string };
const STEALS:Record<string,string>={BaronSteal:'BARON STOLEN',DragonSteal:'DRAGON STOLEN',HeraldSteal:'HERALD STOLEN',GrubSteal:'VOIDGRUB STOLEN'};
export function useFbeLiveAnalysis() {
  const client=useClient();
  const route=useRoute();
  const inGame=useIsInGame();
  const connected=useIngameConnected();
  const live=useIngameSelector(s=>{
    const d=s.gameData as unknown as LiveData;
    return {teamfightDamageOverview:d.teamfightDamageOverview,teamfightTimeline:d.teamfightTimeline,damageGraph:d.damageGraph,damageRecap:d.damageRecap,objectiveDps:d.objectiveDps,goldEfficiency:d.goldEfficiency,scoreboard:d.scoreboard,scoreboardBottom:d.scoreboardBottom};
  });
  const preview=computed(()=>import.meta.env.DEV && typeof route.query.fbe6==='string' && ['recap','finish','objective','efficiency','steal','sidebar','gold'].includes(route.query.fbe6)?route.query.fbe6:'');
  const active=computed(()=>inGame.value&&connected.value);
  const data=computed<LiveData>(()=>preview.value?fixture(preview.value):active.value?live.value:{});
  const choice=computed(()=>chooseBottom(data.value));
  const bottom=computed(()=>choice.value.bottom);
  const compact=computed(()=>choice.value.compact);
  const objective=computed(()=>objectiveModel(data.value));
  const current=ref<StealAlert|null>(null);
  let timer:ReturnType<typeof setTimeout>|undefined;
  let lastKey=''; let lastAt=0; let nextId=0;
  function clear(){clearTimeout(timer);timer=undefined;current.value=null;lastKey='';lastAt=0;}
  const unsubscribe=client.onIngameEvents({onAnnouncementEvent(event){
    if(!active.value||preview.value)return;
    const payload=event as unknown as {type?:unknown;announcementType?:unknown;source?:unknown};
    const type=String(payload.type??payload.announcementType); const title=STEALS[type];
    if(!title)return; // Never infer a steal from damage share or a smite alone.
    const src=payload.source as (Identity & {team?:number;member?:Identity})|undefined;
    const name=nameOf(src?.member ? {...src,...src.member,champion:src.champion}:src,'');
    const side=sideOf(src?.team);
    const key=`${type}:${side}:${name}`;const now=Date.now();
    if(key===lastKey&&now-lastAt<2000)return;
    lastKey=key;lastAt=now;
    current.value={id:++nextId,title,name,side,portrait:src?.champion?.squareImg};
    clearTimeout(timer);timer=setTimeout(()=>{current.value=null;},4500);
  }});
  watch([active,preview],clear);
  onUnmounted(()=>{unsubscribe();clear();});
  const alert=computed<StealAlert|null>(()=>preview.value==='steal'?{id:-1,title:'BARON STOLEN',name:'Demo 7',side:2}:preview.value?null:current.value);
  return {bottom,compact,objective,alert,preview,active};
}
