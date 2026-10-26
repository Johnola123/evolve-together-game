'use strict';
const http=require('http');const express=require('express');const {Server}=require('socket.io');const crypto=require('crypto');const path=require('path');
const {sanitizeCreature,createWorld,tickWorld,scoreWorld}=require('./engine');
const app=express();app.use(express.static(path.join(__dirname,'public')));app.get('/health',(req,res)=>res.json({ok:true,rooms:rooms.size}));
const server=http.createServer(app);const io=new Server(server,{cors:{origin:false},maxHttpBufferSize:12000});
const PORT=Number(process.env.PORT||3000);const rooms=new Map();
const setting={lobby:25,build:150,simulation:100,results:16,rounds:3,minPlayers:2,maxPlayers:30};
for(const key of ['lobby','build','simulation','results','rounds','minPlayers','maxPlayers'])if(process.env['GAME_'+key.toUpperCase()])setting[key]=Number(process.env['GAME_'+key.toUpperCase()]);
const phases={lobby:'lobby',build:'build',simulation:'simulation',results:'results',finished:'finished'};
function code(){let c;do{c=crypto.randomBytes(3).toString('hex').slice(0,6).toUpperCase()}while(rooms.has(c));return c;}
function broadcast(room){io.to(room.code).emit('room',snapshot(room));}
function snapshot(r){return {code:r.code,phase:r.phase,round:r.round,rounds:setting.rounds,timeLeft:Math.max(0,Math.ceil((r.endAt-Date.now())/1000)),players:[...r.players.values()].map(p=>({id:p.id,nick:p.nick,online:p.online,ready:p.ready,creature:p.creature})),world:r.phase==='simulation'?r.world:null,results:r.results,settings:setting,message:r.message};}
function phase(r,which,duration){r.phase=which;r.endAt=Date.now()+duration*1000;r.message='';broadcast(r);}
function startBuild(r){r.round++;r.results=null;r.world=null;for(const p of r.players.values())p.ready=false;phase(r,phases.build,setting.build);}
function startSimulation(r){for(const p of r.players.values()){if(!p.creature?.valid)p.creature=sanitizeCreature({name:p.nick+'ling',color:'#66dbc1',traits:{speed:2,defense:3,sense:3,stealth:2,fertility:2},parts:[]});p.ready=true;}
 r.world=createWorld([...r.players.values()],crypto.randomInt(1,2**30));phase(r,phases.simulation,setting.simulation);}
function finishSim(r){r.results=scoreWorld(r.world);for(const item of r.results){const p=r.players.get(item.id);if(p){p.total=Math.round((p.total+item.score)*10)/10;item.total=p.total;}}r.results.sort((a,b)=>b.total-a.total);r.results.forEach((x,i)=>x.overallRank=i+1);phase(r,phases.results,setting.results);}
function advance(r){if(r.phase==='lobby'){if(r.players.size>=setting.minPlayers)startBuild(r);else{r.endAt=Date.now()+10000;r.message='Waiting for more creatures to join…';broadcast(r);}}else if(r.phase==='build')startSimulation(r);else if(r.phase==='simulation')finishSim(r);else if(r.phase==='results'){if(r.round<setting.rounds)startBuild(r);else phase(r,phases.finished,24*3600);}}
function join(socket,r,nick,identity){if(r.phase==='finished')return {error:'This match has finished.'};if(r.players.size>=setting.maxPlayers&&!r.players.has(identity))return {error:'Room is full.'};if(r.phase!=='lobby'&&!r.players.has(identity))return {error:'Game underway. Join the next room.'};if(!r.players.has(identity))r.players.set(identity,{id:identity,nick,online:true,ready:false,creature:null,total:0});const p=r.players.get(identity);p.online=true;p.nick=nick;socket.join(r.code);socket.data={room:r.code,id:identity};broadcast(r);return {ok:true,code:r.code,id:identity};}
function safeNick(n){return String(n||'Explorer').replace(/[<>]/g,'').trim().slice(0,18)||'Explorer';}
io.on('connection',socket=>{
 socket.on('create',({nick,id}={},ack=()=>{})=>{const r={code:code(),phase:'lobby',round:0,players:new Map(),endAt:Date.now()+setting.lobby*1000,world:null,results:null,message:'Digital host is recruiting players…',emptySince:null};rooms.set(r.code,r);ack(join(socket,r,safeNick(nick),id&&/^[a-f0-9-]{10,64}$/i.test(id)?id:crypto.randomUUID()));});
 socket.on('join',({code:raw,nick,id}={},ack=()=>{})=>{const r=rooms.get(String(raw||'').trim().toUpperCase());if(!r)return ack({error:'Room not found.'});ack(join(socket,r,safeNick(nick),id&&/^[a-f0-9-]{10,64}$/i.test(id)?id:crypto.randomUUID()));});
 socket.on('save',({creature}={},ack=()=>{})=>{const r=rooms.get(socket.data.room);const p=r?.players.get(socket.data.id);if(!p||r.phase!=='build'||Date.now()>=r.endAt)return ack({error:'Editing has closed.'});const c=sanitizeCreature(creature);if(!c.valid)return ack({error:'Evolution point budget exceeded.'});p.creature=c;p.ready=true;broadcast(r);ack({ok:true});});
 socket.on('leave',({code:raw,id}={})=>{
   // A player may leave their own current room only; no host/room-wide reset.
   const current=socket.data?.room;
   const r=rooms.get(current);
   if(!r||raw!==current||id!==socket.data.id)return;
   const p=r.players.get(id);
   if(p){
     if(r.phase==='lobby')r.players.delete(id);
     else p.online=false; // preserve roster/scoring for everybody still playing
   }
   socket.leave(current);
   socket.data={};
   broadcast(r);
 });
 socket.on('disconnect',()=>{const r=rooms.get(socket.data?.room);const p=r?.players.get(socket.data?.id);if(p){p.online=false;broadcast(r);}});
});
setInterval(()=>{for(const r of rooms.values()){if(r.phase==='simulation'&&Date.now()<r.endAt){tickWorld(r.world);broadcast(r);}else if(Date.now()>=r.endAt&&r.phase!=='finished')advance(r);else if(r.phase!=='finished')io.to(r.code).emit('clock',{timeLeft:Math.max(0,Math.ceil((r.endAt-Date.now())/1000))});if(![...r.players.values()].some(p=>p.online)){r.emptySince??=Date.now();if(Date.now()-r.emptySince>600000)rooms.delete(r.code);}else r.emptySince=null;}},1000);
server.listen(PORT,'0.0.0.0',()=>console.log(`Evolve Together running on http://localhost:${PORT}`));
