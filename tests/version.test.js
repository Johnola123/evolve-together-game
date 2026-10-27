const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('server sets fixed four-minute workshop duration',()=>{
 const source=fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
 assert.match(source,/build:240/);
 assert.match(source,/phase\(r,phases\.build,setting\.build\)/);
});
test('winning nickname appears for all players, including champion',()=>{
 const source=fs.readFileSync(path.join(__dirname,'..','public','game.js'),'utf8');
 assert.match(source,/HOORAY! \${esc\(winner\.nick\)} IS THE EVOLUTION CHAMPION!/);
 assert.doesNotMatch(source,/YOU ARE THE EVOLUTION CHAMPION/);
});
