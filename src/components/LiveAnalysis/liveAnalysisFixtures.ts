import type { LiveData } from './liveAnalysisData';
// Synthetic design previews ONLY; never used by production builds.
export function fixture(kind: string): LiveData {
  const teams = [{teamTag:'BLUE'}, {teamTag:'RED'}];
  const champs=['Gnar','Vi','Ahri','Jinx','Rakan','Garen','Diana','Swain','Kai’Sa','Nautilus'];
  const players=champs.map((name,i)=>({name:`Demo ${i+1}`,team:i<5?1:2,champion:{name},totalDamage:[2100,1600,4500,3800,900,2600,1800,3700,4100,1200][i]??0,died:i===1||i===6}));
  const data:LiveData={scoreboard:{teams}};
  if(kind==='recap') data.teamfightTimeline={startTime:1320,endTime:1342,blueKills:3,redKills:2,players:players.map(p=>({...p,damageByType:{physical:p.totalDamage*.6,magic:p.totalDamage*.3,true:p.totalDamage*.1}}))};
  if(kind==='efficiency') data.goldEfficiency={players:players.map((p,i)=>({...p,goldSpent:10000,efficiency:[1.8,1.1,2.6,2.1,.5,1.6,1.3,2.2,2.4,.4][i]}))};
  if(kind==='objective') data.objectiveDps={objectiveName:'Baron Nashor',samples:[{blueDamage:6900,redDamage:3100}],blueDamageByType:{physical:4200,magic:1700,true:1000},redDamageByType:{physical:2100,magic:800,true:200}};
  if(kind==='finish') data.damageRecap={victimName:'Baron',timeline:[{gameTime:1600,sourceName:'Demo 2',damage:1200,isSmite:true,damageType:2},{gameTime:1601,sourceName:'Demo 4',damage:340,damageType:0},{gameTime:1601.1,sourceName:'Demo 8',damage:260,damageType:1},{gameTime:1601.2,sourceName:'Demo 4',damage:410,damageType:0},{gameTime:1601.5,sourceName:'Demo 7',damage:1200,isSmite:true,damageType:2}],entries:[{sourceName:'Demo 2',team:1,totalDamage:2100},{sourceName:'Demo 4',team:1,totalDamage:4800},{sourceName:'Demo 8',team:2,totalDamage:900},{sourceName:'Demo 7',team:2,totalDamage:2200}],totalDamageReceived:10000,smiteReaction:{junglerName:'Demo 7',smiteLandedTime:1601.5,reactionTimeSeconds:0}};
  return data;
}
