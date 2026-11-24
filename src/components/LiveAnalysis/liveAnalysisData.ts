// Native LeagueBroadcast payload adapters. Optional newer fields are deliberately
// local: older client declarations/servers may omit them.
export type Side = 1 | 2;
export type Champion = { id?: number; name?: string; squareImg?: string };
export type Identity = { name?: string; displayName?: string; playerName?: string; champion?: Champion };
type DamageTypes = Record<string, number>;
type DamagePlayer = Identity & { team?: number; totalDamage?: number; totalDamageDealt?: number; damageByType?: DamageTypes; died?: boolean };
type EfficiencyPlayer = Identity & { team?: number; goldSpent?: number; efficiency?: number };
type TeamInfo = { teamTag?: string; teamName?: string; players?: Identity[] };
type Hit = { gameTime?: number; sourceName?: string; sourceDisplayName?: string; damage?: number; damageType?: number; isSmite?: boolean; spellKey?: string };
type RecapEntry = { sourceName?: string; sourceDisplayName?: string; team?: number; totalDamage?: number; source?: Champion };
export type Recap = { victimName?: string; victimDisplayName?: string; displayMode?: number; dragonType?: string; timeline?: Hit[]; entries?: RecapEntry[]; sourceLookup?: Record<string, Champion>; totalDamageReceived?: number; smiteReaction?: { junglerName?: string; smiteLandedTime?: number; reactionTimeSeconds?: number } };
export type LiveData = {
  teamfightDamageOverview?: { damageDealt?: DamagePlayer[] };
  teamfightTimeline?: { players?: DamagePlayer[]; startTime?: number; endTime?: number; blueKills?: number; redKills?: number };
  damageGraph?: { damageDealt?: DamagePlayer[] };
  damageRecap?: Recap;
  objectiveDps?: { objectiveName?: string; startTime?: number; endTime?: number; samples?: { blueDamage?: number; redDamage?: number }[]; blueDamageByType?: DamageTypes; redDamageByType?: DamageTypes };
  goldEfficiency?: { players?: EfficiencyPlayer[] };
  scoreboard?: { teams?: TeamInfo[] };
  scoreboardBottom?: { teams?: TeamInfo[] };
};
export const COLORS = ['#ed925e', '#7394ed', '#ece9e2', '#696775'];
export const sideColor = (side?: number | null) => side === 1 ? '#69a1ff' : side === 2 ? '#ff5064' : '#bcb3b8';
export const valid = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
export const sideOf = (n: unknown): Side | null => n === 1 || n === 2 ? n : null;
export function nameOf(p?: Identity | null, fallback = 'Unknown'): string {
  return p?.displayName?.trim() || p?.playerName?.split('#')[0]?.trim() || p?.name?.split('#')[0]?.trim() || p?.champion?.name || fallback;
}
export function teamName(data: LiveData, side: Side): string {
  const t = data.scoreboard?.teams?.[side - 1];
  return t?.teamTag || t?.teamName || (side === 1 ? 'BLUE SIDE' : 'RED SIDE');
}
export function clock(n?: number): string { if (!valid(n)) return '—'; const sec = Math.floor(n); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
export function amount(n: number | null | undefined): string { return valid(n) ? Math.round(n).toLocaleString('en-US') : '—'; }
export function compact(n: number | null | undefined): string { return !valid(n) ? '—' : n >= 1000 ? `${(n/1000).toFixed(1)}K` : amount(n); }
export function damageParts(map: DamageTypes | undefined, total: number): number[] {
  const parts = [0, 0, 0, 0];
  if (!map || typeof map !== 'object' || Array.isArray(map)) return [0,0,0,total];
  for (const [key, n] of Object.entries(map)) {
    if (!valid(n)) return [0,0,0,total];
    const k = key.toLowerCase();
    const i = k === 'physical' || k === '0' ? 0 : k === 'magic' || k === '1' ? 1 : k === 'true' || k === '2' ? 2 : 3;
    parts[i] = (parts[i] ?? 0) + n;
  }
  const sum = parts.reduce((a,b) => a+b,0);
  if (sum > total + Math.max(.01,total*1e-6)) return [0,0,0,total];
  // Retain a neutral residual for missing type data; never invent a split.
  parts[3] = (parts[3] ?? 0) + Math.max(0,total-sum);
  if (sum > total && sum > 0) return parts.map(n=>n*total/sum);
  return parts;
}
export type PlayerRow = { key: string; name: string; champion?: Champion; side: Side; value: number | null; parts: number[]; died?: boolean };
export type FightModel = { kind: 'fight'; title: string; context: string; teams: [string,string]; rows: [PlayerRow[],PlayerRow[]]; max: number; totals: [number,number] };
export type EfficiencyModel = { kind: 'efficiency'; title: string; context: string; teams: [string,string]; rows: [PlayerRow[],PlayerRow[]]; max: number; labels: string[] };
export type FinishEvent = { key: string; name: string; portrait?: string; side: Side | null; damage: number; type: number; relative: number; smite: boolean; final: boolean; separated: boolean };
export type FinishModel = { kind: 'finish'; title: string; context: string; objective: string; events: FinishEvent[]; winner: string; winnerSide: Side | null; share: number | null; reaction: number | null };
export type BottomModel = FightModel | EfficiencyModel | FinishModel;
export type ObjectiveModel = { name: string; teams: [string,string]; totals: [number,number]; shares: [number,number]; parts: [number[],number[]] };
export function fightModel(data: LiveData): FightModel | null {
  const timeline = data.teamfightTimeline;
  const isTimeline = !!timeline?.players?.length;
  const source = isTimeline ? timeline?.players : data.damageGraph?.damageDealt;
  if (!source?.length) return null;
  function rows(side: Side): PlayerRow[] {
    return (source ?? []).filter(p=>p.team===side).slice(0,5).map((p,i)=>{
      const raw = isTimeline ? p.totalDamage : p.totalDamageDealt;
      const value = valid(raw) ? raw : null;
      return { key:`${side}-${i}-${p.name??''}`, name:nameOf(p), champion:p.champion, side, value, parts: value===null?[]:damageParts(p.damageByType,value), died:p.died };
    });
  }
  const blue=rows(1), red=rows(2);
  const all=[...blue,...red];
  if (!all.some(p=>p.value!==null)) return null;
  const total=(r:PlayerRow[])=>r.reduce((sum,p)=>sum+(p.value??0),0);
  const kills = valid(timeline?.blueKills) && valid(timeline?.redKills) ? ` · ${timeline.blueKills}–${timeline.redKills} KILLS` : '';
  const times = valid(timeline?.startTime) && valid(timeline?.endTime) && timeline.endTime>=timeline.startTime ? `${clock(timeline.startTime)}–${clock(timeline.endTime)}` : 'LATEST FIGHT';
  return { kind:'fight',title:isTimeline?'TEAMFIGHT RECAP':'DAMAGE DEALT',context:isTimeline?`${times}${kills}`:'BACKEND DAMAGE GRAPH',teams:[teamName(data,1),teamName(data,2)],rows:[blue,red],max:Math.max(1,...all.map(p=>p.value??0)),totals:[total(blue),total(red)] };
}
export function efficiencyModel(data: LiveData): EfficiencyModel | null {
  const players = data.goldEfficiency?.players ?? [];
  const ratio=(p?:EfficiencyPlayer)=>p && valid(p.goldSpent) && p.goldSpent>0 && valid(p.efficiency) ? p.efficiency : null;
  const sides=[players.filter(p=>p.team===1),players.filter(p=>p.team===2)] as const;
  if (!players.some(p=>sideOf(p.team)!==null && ratio(p)!==null)) return null;
  const rosters=[data.scoreboardBottom?.teams?.[0]?.players??[], data.scoreboardBottom?.teams?.[1]?.players??[]] as const;
  const paired = rosters.every((r,i)=>r.length===5 && r.every(p=>!!p.name) && new Set(r.map(p=>p.name)).size===5 && (sides[i]??[]).every(p=>!!p.name && r.some(m=>m.name===p.name)));
  function rows(side:Side):PlayerRow[]{
    const list=sides[side-1]??[];
    const roster=rosters[side-1]??[];
    const ordered=paired?roster.map(p=>({p,entry:list.find(x=>x.name===p.name)})):[...list].sort((a,b)=>(ratio(b)??-1)-(ratio(a)??-1)).slice(0,5).map(p=>({p,entry:p}));
    return ordered.map(({p,entry},i)=>({ key:`${side}-${i}`,name:nameOf({...p,displayName:entry?.displayName||p.displayName}),champion:entry?.champion??p.champion,side,value:ratio(entry),parts:[] }));
  }
  const blue=rows(1),red=rows(2);
  return {kind:'efficiency', title:'GOLD EFFICIENCY',context:'CHAMPION DAMAGE / GOLD EARNED',teams:[teamName(data,1),teamName(data,2)],rows:[blue,red],max:Math.max(2.5,...[...blue,...red].map(p=>p.value??0)),labels:paired?['TOP','JGL','MID','BOT','SUP']:['#1','#2','#3','#4','#5']};
}
export function finishModel(data:LiveData):FinishModel|null {
  const r=data.damageRecap;
  if(!r || !['baron','baron nashor','dragon'].includes(r.victimName?.toLowerCase()??'') || ((r.displayMode??3)&1)===0 || !r.timeline?.length) return null;
  const ordered=r.timeline.map((hit,i)=>({hit,i})).sort((a,b)=>(a.hit.gameTime??0)-(b.hit.gameTime??0)||a.i-b.i);
  if(!ordered.every(({hit})=>valid(hit.gameTime)&&valid(hit.damage)&&!!hit.sourceName?.trim())||!ordered.some(({hit})=>(hit.damage??0)>0))return null;
  const last=ordered[ordered.length-1]!;
  const end=last.hit.gameTime!;
  const picked=ordered.slice(-5);
  const early=!picked.some(({hit})=>hit.isSmite) ? ordered.slice(0,-5).reverse().find(({hit})=>hit.isSmite&&end-hit.gameTime!<=5):undefined;
  if(early)picked.unshift(early);
  const teamFor=(name:string)=>{const e=(r.entries??[]).filter(x=>x.sourceName===name);const side=sideOf(e[0]?.team);return side!==null&&e.every(x=>x.team===side)?side:null;};
  const events=picked.map(({hit,i},j)=>{const source=r.entries?.find(e=>e.sourceName===hit.sourceName);return {key:`${hit.gameTime}-${i}`,name:nameOf({displayName:hit.sourceDisplayName||source?.sourceDisplayName,name:hit.sourceName}),portrait:r.sourceLookup?.[hit.sourceName!]?.squareImg||source?.source?.squareImg,side:teamFor(hit.sourceName!),damage:hit.damage!,type:hit.damageType??3,relative:hit.gameTime!-end,smite:!!hit.isSmite,final:i===last.i,separated:!!early&&j===1};});
  const winnerSide=teamFor(last.hit.sourceName!);
  const winEntries=(r.entries??[]).filter(e=>winnerSide!==null&&e.team===winnerSide);
  const total=winEntries.length&&winEntries.every(e=>valid(e.totalDamage))?winEntries.reduce((sum,e)=>sum+e.totalDamage!,0):null;
  const share=total!==null&&valid(r.totalDamageReceived)&&r.totalDamageReceived>0&&total<=r.totalDamageReceived?total/r.totalDamageReceived:null;
  const sm=r.smiteReaction;
  const reaction=sm&&typeof sm.reactionTimeSeconds==='number'&&Number.isFinite(sm.reactionTimeSeconds)&&picked.some(({hit})=>hit.isSmite&&hit.sourceName===sm.junglerName&&hit.gameTime===sm.smiteLandedTime)?sm.reactionTimeSeconds:null;
  return {kind:'finish',title:'OBJECTIVE FINISH',context:clock(end),objective:r.victimDisplayName||(/baron/i.test(r.victimName??'')?'Baron Nashor':r.dragonType?`${r.dragonType} Dragon`:'Dragon'),events,winner:winnerSide?teamName(data,winnerSide):'TEAM UNKNOWN',winnerSide,share,reaction};
}
export function objectiveModel(data:LiveData):ObjectiveModel|null {
  const d=data.objectiveDps; const last=d?.samples?.[d.samples.length-1];
  if(!d||!last||!valid(last.blueDamage)||!valid(last.redDamage))return null;
  const sum=last.blueDamage+last.redDamage;
  if(!Number.isFinite(sum)||sum<=0)return null;
  return {name:d.objectiveName?.trim()||'OBJECTIVE',teams:[teamName(data,1),teamName(data,2)],totals:[last.blueDamage,last.redDamage],shares:[last.blueDamage/sum,last.redDamage/sum],parts:[damageParts(d.blueDamageByType,last.blueDamage),damageParts(d.redDamageByType,last.redDamage)]};
}
export function chooseBottom(data:LiveData): { bottom:BottomModel|null; compact:boolean } {
  const finish=finishModel(data);
  if(finish)return {bottom:finish,compact:false};
  if(data.teamfightDamageOverview?.damageDealt?.length)return {bottom:null,compact:true};
  return {bottom:fightModel(data)??efficiencyModel(data),compact:false};
}
