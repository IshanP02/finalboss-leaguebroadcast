export type Point={time:number;diff:number};
export function buildLiveGold(raw:unknown):Point[]{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return [];
  const rows=Object.entries(raw).flatMap(([t,v])=>{const time=Number(t);return Number.isFinite(time)&&time>=0&&v&&typeof v==='object'&&!Array.isArray(v)?[{time,v:v as Record<string,unknown>}]:[]}).sort((a,b)=>a.time-b.time);
  // Native side-key convention, as used by the existing graph. Do not assume arbitrary team IDs are blue/red.
  const first=rows.find(p=>Object.keys(p.v).length===2);if(!first)return [];
  const ids=Object.keys(first.v).map(Number).sort((a,b)=>a-b);const a=ids[0],b=ids[1];
  if(a===undefined||b===undefined||!((a===0&&b===1)||(a===1&&b===2)))return [];
  return rows.flatMap(p=>{const l=p.v[String(a)],r=p.v[String(b)];return typeof l==='number'&&typeof r==='number'&&Number.isFinite(l)&&Number.isFinite(r)&&l>=0&&r>=0?[{time:p.time,diff:l-r}]:[]});
}
export function previewGold():Point[]{return [0,800,2100,3200,1400,-1200,-2500,-800,2000,5200,6600].map((diff,i)=>({time:i*180,diff}));}
