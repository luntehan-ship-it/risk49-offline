// All amounts are integer cents. Payouts round half up to a cent.
export const SAMPLE=[60,45,50,30,75,70,105,65,70,90,0,0,20,15,95,10,5,70,75,20,50,60,20,0,85,55,40,30,35,65,75,90,100,90,10,70,5,45,20,10,5,75,95,50,95,70,30,30,30].map(x=>x*100);
export const defaults={p:47,q:47,cap:null,limit:null,feeRate:0,rebateRate:0,fixedFee:0,weight:50,seconds:8};
// Fixed mapping from the user's reference image. Do not rotate by calendar year.
export const ZODIAC=Object.freeze(Object.fromEntries(['马','蛇','龙','兔','虎','牛','鼠','猪','狗','鸡','猴','羊'].map((name,start)=>[name,Object.freeze(Array.from({length:Math.floor((48-start)/12)+1},(_,k)=>start+12*k))])));
export function selectionIndices(selection){if(typeof selection==='string'&&selection.startsWith('z:')){const indices=ZODIAC[selection.slice(2)];if(!indices)throw Error('无效生肖');return [...indices];}const index=Number(selection);if(!Number.isInteger(index)||index<0||index>=49)throw Error('号码必须为 01—49');return [index];}
export function selectionEntries(selection,delta){return selectionIndices(selection).map(index=>({index,delta}));}
export function detailOrder(plan,mode){const values=mode==='risk'?plan.f:plan.r;return values.map((_,i)=>i).sort((a,b)=>values[a]-values[b]||a-b);}
export function cents(v){const s=String(v).trim();if(!/^[+-]?\d+(\.\d{1,2})?$/.test(s))throw Error('金额需为数字，最多两位小数');const n=Math.round(Number(s)*100);if(!Number.isSafeInteger(n)||Math.abs(n)>100000000)throw Error('单笔金额不能超过 100 万元');return n;}
export function validate(b,s){if(!Array.isArray(b)||!b.length||b.some(x=>!Number.isSafeInteger(x)||x<0||x>100000000))throw Error('累计金额必须为非负金额，单号不超过 100 万元');for(const k of ['p','q'])if(!Number.isFinite(s[k])||s[k]<=0||s[k]>1000||Math.abs(s[k]*100-Math.round(s[k]*100))>1e-6)throw Error('赔率必须大于 0、不超过 1000，最多两位小数');for(const k of ['feeRate','rebateRate'])if(!Number.isFinite(s[k])||s[k]<0||s[k]>100)throw Error('费率必须在 0—100% 之间');for(const k of ['fixedFee','cap','limit'])if(s[k]!==null&&(!Number.isSafeInteger(s[k])||s[k]<0||s[k]>100000000))throw Error('预算、限额及固定费用必须为 0—100 万元');if(!Number.isFinite(s.weight)||s.weight<0||s.weight>100)throw Error('权重必须在 0—100 之间');if(!Number.isFinite(s.seconds)||s.seconds<1||s.seconds>30)throw Error('求解时间必须在 1—30 秒之间');}
export function fees(H,s){return H===0?0:s.fixedFee+Math.floor(H*s.feeRate/100+.5)-Math.floor(H*s.rebateRate/100+.5);}
export function evaluate(b,h,s){const B=b.reduce((a,x)=>a+x,0),H=h.reduce((a,x)=>a+x,0);const r=b.map(x=>B-Math.floor(x*Math.round(s.p*100)/100+.5));const f=r.map((x,i)=>x-H+Math.floor(h[i]*Math.round(s.q*100)/100+.5)-fees(H,s));return {h,H,r,f,N:f.filter(x=>x<0).length,L:Math.max(0,-Math.min(...f)),G:Math.max(...f),E:f.reduce((a,x)=>a+x,0)/b.length};}
export function verify(b,plan,s){validate(b,s);const cap=s.cap??b.reduce((a,x)=>a+x,0);if(!Array.isArray(plan.h)||plan.h.length!==b.length||plan.h.some(x=>!Number.isSafeInteger(x)||x<0||x%500!==0||(s.limit!==null&&x>s.limit))||plan.h.reduce((a,x)=>a+x,0)>cap)throw Error('方案违反步长、预算或限额');const v=evaluate(b,plan.h,s);for(const k of ['H','N','L','G','E'])if(v[k]!==plan[k])throw Error('方案汇总验算失败');if(!Array.isArray(plan.f)||!Array.isArray(plan.r)||plan.f.length!==b.length||plan.r.length!==b.length||v.f.some((x,i)=>x!==plan.f[i]||v.r[i]!==plan.r[i]))throw Error('方案逐行验算失败');return true;}
export function applyBatch(b,entries){const next=[...b];for(const {index,delta} of entries){if(!Number.isInteger(index)||index<0||index>=b.length||!Number.isSafeInteger(delta))throw Error('录入号码或金额不合法');next[index]+=delta;}if(next.some(x=>x<0))throw Error('冲减后金额不能小于 0，本批未提交');if(next.some(x=>x>100000000))throw Error('累计单号不能超过 100 万元');return next;}
export function parseRows(rows){const entries=[],seen=new Set();let start=0;if(rows[0]&&/号码/.test(String(rows[0][0])))start=1;for(let i=start;i<rows.length;i++){const row=rows[i];if(row.every(x=>String(x??'').trim()===''))continue;const n=Number(row[0]);if(!Number.isInteger(n)||n<1||n>49)throw Error(`第 ${i+1} 行：号码必须为 01—49`);if(seen.has(n))throw Error(`第 ${i+1} 行：号码 ${n} 重复`);seen.add(n);if(row[1]===undefined||String(row[1]).trim()==='')throw Error(`第 ${i+1} 行：金额为空，请明确填写 0`);try{const delta=cents(row[1]);if(delta<0)throw Error('导入金额不能为负；请用录入页进行冲减');entries.push({index:n-1,delta});}catch(e){throw Error(`第 ${i+1} 行：${e.message}`);}}if(seen.size!==49)throw Error(`必须包含全部 49 个号码，目前 ${seen.size} 个`);return entries;}
export function parseCSV(text){const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);return parseRows(lines.map(line=>line.split(/[,，;\t]/).map(x=>x.trim().replace(/^"(.*)"$/,'$1'))));}

export function jointKeys(p,base){const n=p.N/Math.max(1,base.N),l=p.L/Math.max(1,base.L);return [Math.max(n,l),n+l,p.H,p.L,p.N];}
export function jointBetter(p,current,base){if(p.N>base.N||p.L>base.L)return false;const a=jointKeys(p,base),b=jointKeys(current,base);for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]<b[i];return false;}

// Exact lexicographic endpoint search for every visited total H.
// At a fixed H, each increment has the same payout, so minimum required units
// and cheapest-to-make-nonnegative allocations determine feasibility exactly.
export function optimize(b,s,onProgress=()=>{}){
 validate(b,s);const start=performance.now(),base=evaluate(b,b.map(()=>0),s),budget=s.cap??b.reduce((a,x)=>a+x,0),maxUnits=Math.floor((s.limit??budget)/500),capUnits=Math.min(Math.floor(budget/500),maxUnits*b.length),gain=Math.round(s.q*100)*5;
 let bestL=base,bestN=base,joint=base,low=null,complete=true,visited=0;let pareto=[base];
 const less=(a,c,keys)=>{for(const k of keys){if(a[k]!==c[k])return a[k]<c[k];}return false;};
 function at(U){const H=U*500,a=base.r.map(x=>x-H-fees(H,s));
  function alloc(L,targetN,build=false){const units=a.map(x=>Math.max(0,Math.ceil((-L-x)/gain)));if(units.some(x=>x>maxUnits))return null;let used=units.reduce((x,y)=>x+y,0);if(used>U)return null;const extras=[];let N=0;for(let i=0;i<a.length;i++)if(a[i]+units[i]*gain<0){N++;const extra=Math.ceil(-a[i]/gain)-units[i];if(extra+units[i]<=maxUnits)extras.push({i,extra});}extras.sort((x,y)=>x.extra-y.extra);for(const {i,extra} of extras)if(used+extra<=U){units[i]+=extra;used+=extra;N--;}else break;if(N>targetN)return null;if(!build)return {N};let remaining=U-used;for(let i=0;i<units.length&&remaining;i++){const add=Math.min(remaining,maxUnits-units[i]);units[i]+=add;remaining-=add;}if(remaining)return null;return evaluate(b,units.map(x=>x*500),s);}
  const upper=Math.max(0,-Math.min(...a));function minL(target){let lo=0,hi=upper;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(alloc(mid,target))hi=mid;else lo=mid+1;}return alloc(lo,target,true);}
  const l=minL(b.length);const nmin=alloc(upper,b.length).N;const n=minL(nmin);const points=[l,n];
  // Every distinct N can have a different best L. Search intermediate tradeoffs,
  // rather than choosing only one of the two conflicting endpoint solutions.
  for(let target=nmin+1;target<l.N;target++)points.push(minL(target));
  return points;
 }
 for(let U=1;U<=capUnits;U++){if(performance.now()-start>s.seconds*1000){complete=false;break;}const points=at(U);for(const v of points){verify(b,v,s);if(!pareto.some(c=>c.N<=v.N&&c.L<=v.L&&c.H<=v.H)){pareto=pareto.filter(c=>!(v.N<=c.N&&v.L<=c.L&&v.H<=c.H));pareto.push(v);}if(jointBetter(v,joint,base))joint=v;if(less(v,bestL,['L','N','H']))bestL=v;if(less(v,bestN,['N','L','H']))bestN=v;if(!low&&(v.N<base.N||v.L<base.L))low=v;}visited++;if(U%100===0)onProgress(U/capUnits);}
 const score=x=>s.weight/100*x.N/b.length+(1-s.weight/100)*x.L/Math.max(1,base.L);
 const balance=[...pareto].sort((a,c)=>score(a)-score(c)||a.H-c.H)[0]||base;
 const simultaneous=joint.N===bestN.N&&joint.L===bestL.L;
 const status=complete?'已遍历预算及风险取舍范围；综合方案与两个优先模式已证明最优':'达到时间上限；返回可行方案，未证明最优';
 const jointInfo={score:jointKeys(joint,base)[0],simultaneous,rule:'两项均不高于零投入原始风险；最小化 max(亏损号码数/原始亏损号码数, 最大亏损/原始最大亏损)，并列按两比例之和、投入、最大亏损、亏损号码数选择；原始指标为0时分母取1。',message:!complete?'搜索未完成，尚不能确认是否同时达到两个单项最小值。':simultaneous?'本次综合方案同时达到两个单项最小值。':'两个单项最小值未同时达到，综合方案按公开规则兼顾两项。'};
 const named=[['双指标综合最佳',joint],['零投入',base],['均衡推荐',balance],['最大亏损优先',bestL],['亏损号码最少',bestN],['最低投入改善',low||base]].map(([name,p])=>({...p,name}));
 return {plans:named,jointInfo,paretoCount:pareto.length,complete,status,visited,total:capUnits,elapsed:Math.round(performance.now()-start),note:'综合方案：'+jointInfo.rule+' '+jointInfo.message+' 均衡按设置权重评分。低投入改善指亏损号码减少至少1个，或最大亏损下降至少0.01元。等概率平均值不是预测。',gap:null};
}

