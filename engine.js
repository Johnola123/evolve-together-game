'use strict';
const TRAITS=['speed','defense','sense','stealth','fertility'];
const PARTS={wings:{cost:3,benefit:'speed'},shell:{cost:3,benefit:'defense'},horns:{cost:2,benefit:'defense'},fins:{cost:2,benefit:'speed'},antennae:{cost:2,benefit:'sense'},tail:{cost:1,benefit:'speed'}};
const MAX_POINTS=16;
function sanitizeCreature(raw={}){
 const name=String(raw.name||'New Species').replace(/[<>]/g,'').trim().slice(0,22)||'New Species';
 const color=/^#[0-9a-fA-F]{6}$/.test(raw.color)?raw.color:'#66dbc1';
 const traits={}; for(const key of TRAITS)traits[key]=Math.max(0,Math.min(5,Math.floor(Number(raw.traits?.[key])||0)));
 const parts=[...new Set(Array.isArray(raw.parts)?raw.parts.filter(p=>Object.hasOwn(PARTS,p)):[])];
 const spent=Object.values(traits).reduce((a,b)=>a+b,0)+parts.reduce((a,p)=>a+PARTS[p].cost,0);
 return {name,color,traits,parts,spent,valid:spent<=MAX_POINTS};
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function hash(seed){let t=seed>>>0;return ()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
function createWorld(players, seed){
 const rand=hash(seed);return {tick:0,seed,weather:'Clear skies',food:70,event:'The first creatures emerge',agents:players.map((p,i)=>({id:p.id,nick:p.nick,creature:p.creature,energy:75,population:6,alive:true,score:0,adaptability:0,foodCollected:0,eco:0,x:8+rand()*84,y:10+rand()*78,history:[],rank:0})),events:[]};
}
function tickWorld(world){
 const rand=hash(world.seed+world.tick*9973);world.tick++;
 const weatherCycle=[{name:'Clear skies',food:3,hazard:0},{name:'Dry season',food:-8,hazard:8},{name:'Predator surge',food:-3,hazard:12},{name:'Heavy rains',food:9,hazard:4},{name:'Cold snap',food:-5,hazard:10}];
 const phase=Math.floor((world.tick-1)/6)%weatherCycle.length;const w=weatherCycle[phase];world.weather=w.name;world.food=clamp(world.food+w.food+Math.floor(rand()*7)-3,5,100);
 if(world.tick===1||((world.tick-1)%6===0)){world.event=`${w.name}: ${w.food>=0?'resources shift':'survival becomes harder'}`;world.events.unshift({tick:world.tick,text:world.event});world.events=world.events.slice(0,8);}
 for(const a of world.agents){
  if(!a.alive)continue;
  const t=a.creature.traits;const set=new Set(a.creature.parts);
  const speed=t.speed+(set.has('wings')?1.5:0)+(set.has('fins')?0.8:0);
  const defense=t.defense+(set.has('shell')?2:0)+(set.has('horns')?1:0);
  const intelligence=t.sense+(set.has('antennae')?1.5:0);
  const preyProtection=defense*1.5+t.stealth*1.1;
  const available=world.food/24;
  const collected=clamp(available+intelligence*.37+speed*.20+(rand()-.5)*2.2,0,8);
  const consumption=3.2+speed*.32+Math.max(0,a.population-6)*.21;
  const danger=Math.max(0,w.hazard+rand()*9-preyProtection*1.35-intelligence*.5);
  const energyGain=collected*2.1-consumption-danger*.6;
  a.energy=clamp(a.energy+energyGain,0,100);
  a.foodCollected+=collected;
  a.adaptability+=clamp(10-danger+intelligence*.3,0,12);
  a.eco+=Math.max(0,collected-consumption/2);
  if(a.energy>=58&&rand()<(.09+t.fertility*.035)){a.population=Math.min(28,a.population+1+Math.floor(t.fertility/4));a.energy-=4;}
  if(a.energy<27||danger>9){a.population=Math.max(0,a.population-(danger>12?2:1));}
  if(a.population===0||a.energy<=0){a.alive=false;a.population=0;}
  a.x=clamp(a.x+(rand()-.5)*(3+speed*.85),3,97);a.y=clamp(a.y+(rand()-.5)*(3+speed*.85),5,95);
  a.history.push(a.population);if(a.history.length>50)a.history.shift();
 }
 return world;
}
function scoreWorld(world){
 const maxTicks=Math.max(1,world.tick);const scored=world.agents.map(a=>{
  const survival=a.alive?100:clamp(100*a.history.length/maxTicks,0,99);
  const population=clamp(a.population/22*100,0,100);
  const adaptability=clamp(a.adaptability/maxTicks/11*100,0,100);
  const efficiency=clamp(a.foodCollected/maxTicks/6*100,0,100);
  const ecological=clamp(a.eco/maxTicks/4*100,0,100);
  const components={survival,population,adaptability,efficiency,ecological};
  const score=Math.round((.35*survival+.25*population+.20*adaptability+.10*efficiency+.10*ecological)*10)/10;
  const reason=!a.alive?'Your species went extinct. Try more defense or efficient resource use.':a.energy<30?'You survived, but struggled to maintain energy. Try better sensing or lower speed.':a.population>=12?'Your species thrived and reproduced. Keep this balance of traits.':'Your species survived. Adjust traits to improve population growth.';
  return {id:a.id,nick:a.nick,creature:a.creature,score,components,population:a.population,alive:a.alive,reason};
 });scored.sort((a,b)=>b.score-a.score||a.nick.localeCompare(b.nick));scored.forEach((a,i)=>a.rank=i+1);return scored;
}
module.exports={TRAITS,PARTS,MAX_POINTS,sanitizeCreature,createWorld,tickWorld,scoreWorld};
