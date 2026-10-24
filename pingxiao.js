import {ZODIAC,applyBatch} from './engine.js';
export const ANIMALS=Object.freeze(Object.keys(ZODIAC));
export const freshPing=()=>({b:Array(12).fill(0),logs:[]});
export function validatePing(p){
 if(!p||!Array.isArray(p.b)||p.b.length!==12||p.b.some(x=>!Number.isSafeInteger(x)||x<0||x>100000000)||!Array.isArray(p.logs))throw Error('平肖备份金额或流水无效');
 for(const l of p.logs){if(typeof l.id!=='string'||!Number.isFinite(Date.parse(l.time))||!Array.isArray(l.before)||l.before.length!==12||l.before.some(x=>!Number.isSafeInteger(x)||x<0||x>100000000)||!Array.isArray(l.entries)||l.entries.some(e=>!Number.isInteger(e.index)||e.index<0||e.index>=12||!Number.isSafeInteger(e.delta)))throw Error('平肖流水无效');}
 return true;
}
export function pingEntry(p,indices,delta,meta){validatePing(p);if(!indices.length||new Set(indices).size!==indices.length||indices.some(i=>!Number.isInteger(i)||i<0||i>=12)||!Number.isSafeInteger(delta)||!delta)throw Error('请选择生肖并输入非零金额');const entries=indices.map(index=>({index,delta}));return {b:applyBatch(p.b,entries),logs:[...p.logs,{...meta,before:[...p.b],entries}]};}
export function pingSummary(p,winners=[]){validatePing(p);if(new Set(winners).size!==winners.length||winners.some(i=>!Number.isInteger(i)||i<0||i>=12))throw Error('中奖生肖无效');const total=p.b.reduce((a,b)=>a+b,0),payout=winners.reduce((a,i)=>a+2*p.b[i],0);return {total,payout,profit:total-payout,rows:ANIMALS.map((name,index)=>({name,index,amount:p.b[index],payout:2*p.b[index],profit:total-2*p.b[index]})).sort((a,b)=>a.profit-b.profit||a.index-b.index)};}
