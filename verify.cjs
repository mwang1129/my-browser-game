const fs=require('fs'),assert=require('assert');
const chunks=[];const vm={createContext:()=>{},runInContext:code=>chunks.push(code)};
const elements={};const noop=()=>{};const context=new Proxy({}, {get:(o,k)=>k==='createLinearGradient'?()=>({addColorStop:noop}):noop,set:()=>true});
function el(id){return elements[id]??={style:{},classList:{add:noop,remove:noop},focus:noop,querySelectorAll:()=>[],getContext:()=>context,textContent:'',width:0,height:0}}
const handlers={};
const env={document:{getElementById:el,querySelectorAll:()=>[]},innerWidth:1440,innerHeight:900,devicePixelRatio:1,addEventListener:(name,handler)=>handlers[name]=handler,requestAnimationFrame:noop,setTimeout:noop,localStorage:{getItem:()=>0,setItem:noop},console,handlers};vm.createContext(env);
vm.runInContext(fs.readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1],env);
vm.runInContext(`reset(); update(2.6); if(state!=='racing')throw Error('countdown');keys.w=true;for(let i=0;i<60;i++)update(1/60);if(car.v<20)throw Error('acceleration');let a=car.angle; keys.d=true;update(.1);if(car.angle<=a)throw Error('steering'); keys={};travel=N-2;elapsed=20;update(.016);if(state!=='finished')throw Error('finish');reset();if(elapsed!==0||state!=='countdown')throw Error('replay');draw(0);console.log('PASS: countdown, acceleration, steering, finish, replay, rendering calls');`,env);
vm.runInContext(`
if(tracks.length!==51||new Set(tracks.map(t=>t.name)).size!==51)throw Error('track count');
for(let i=1;i<tracks.length;i++){let a=tracks[i-1],b=tracks[i];if(!(b.width<a.width&&b.elevation>a.elevation&&b.penalty>a.penalty))throw Error('difficulty progression '+i)}
const signatures=new Set(),saved=new Map();localStorage.setItem=(k,v)=>saved.set(k,String(v));localStorage.getItem=k=>saved.get(k)||null;
for(let id=0;id<51;id++){
 selectTrack(id);if(road.length!==N||!road.every(p=>Number.isFinite(p.x+p.y+p.z+p.angle)))throw Error('geometry '+id);
 signatures.add(JSON.stringify(road.map(p=>[p.x,p.z])));
 const lengths=road.map((p,i)=>Math.hypot(p.x-road[(i+1)%N].x,p.z-road[(i+1)%N].z));
 if(Math.max(...lengths)/Math.min(...lengths)>1.1)throw Error('uneven sampling '+id);
 reset();update(2.6);elapsed=20;
 // Follow each sampled point through a full lap to exercise progress wrapping.
 for(let i=1;i<=N;i++){car.x=road[i%N].x;car.z=road[i%N].z;car.v=0;update(.016);if(state==='finished')break}
 if(state!=='finished'||!saved.has(bestKey()))throw Error('lap finish '+id);
 draw(0);reset();if(elapsed!==0||travel!==0)throw Error('restart '+id);
}
if(signatures.size!==51||saved.size!==51)throw Error('uniqueness or record isolation');
selectTrack(2);if(!best)throw Error('record reload');openCourses();if(($('coursegrid').innerHTML.match(/data-course=/g)||[]).length!==51)throw Error('atlas count');closeCourses();
selectTrack(50);$('next').onclick();if(selected!==0||state!=='countdown')throw Error('next wrap');
const looks=new Set();let priorCount=0;
for(let id=0;id<51;id++){
 selectTrack(id);looks.add(track.theme.kind+':'+track.variant);
 if(obstacles.length<priorCount)throw Error('hazard progression');priorCount=obstacles.length;
 for(const o of obstacles){if(o.index<30||o.index>N-30)throw Error('start clearance');if(Math.hypot(o.x-road[o.index].x,o.z-road[o.index].z)-o.radius-1.25<.4)throw Error('center line blocked '+id)}
 reset();update(2.6);const o=obstacles[0];car.x=o.x;car.z=o.z;car.angle=o.angle;car.v=50;nearest=o.index;previous=o.index;update(.001);
 if(car.v>20||impact<=0||!hitCooldown)throw Error('obstacle collision '+id);
 const d=Math.hypot(car.x-o.x,car.z-o.z);if(d<o.radius+1.24)throw Error('collision separation');
 reset();if(hitCooldown||impact)throw Error('impact reset');draw(0);
}
if(looks.size!==51)throw Error('environment variants');
for(let id=0;id<51;id++){
 selectTrack(id);if(shortcuts.length!==1)throw Error('missing shortcut '+id);const branch=shortcuts[0];
 if(branch.width>=track.width||branch.start<20||branch.end>N-20)throw Error('shortcut bounds');
 reset();update(2.6);elapsed=20;
 function follow(p){car.x=p.x;car.z=p.z;car.v=0;update(.016)}
 for(let i=1;i<=branch.start;i++)follow(road[i]);
 for(const p of branch.points)follow(p);
 if(Math.abs(travel-branch.end)>4)throw Error('shortcut progress '+id+': '+travel);
 for(let i=branch.end+1;i<N;i++){follow(road[i]);if(state==='finished')break}
 if(state!=='finished')throw Error('shortcut finish '+id);
 // Test both road edges at a point away from a shortcut junction.
 for(const side of [-1,1]){reset();const p=road[5];car.x=p.x+p.nx*side*(track.width+4);car.z=p.z+p.nz*side*(track.width+4);const before=findSurface(car.x,car.z);car.angle=Math.atan2(car.x-before.x,car.z-before.z);car.v=60;containCar();const surface=findSurface(car.x,car.z);if(surface.score>.01||(before.score>0&&car.v>=60))throw Error('guardrail containment '+id)}
 if(!fences.length)throw Error('missing guardrails '+id);
}
console.log('PASS: all 51 shortcut entries, traversals, rejoins, lap finishes, and guardrail containment');
console.log('PASS: 51 environment variants, hazard clearance, collision slowdown, separation, impact reset');
console.log('PASS: 51 unique tracks, uniform sampling, all lap finishes, isolated records, atlas, next-course wrap');
`,env);
vm.runInContext(`
selectTrack(0);reset();state='racing';keys.s=true;
for(let i=0;i<90;i++)update(1/120);
if(car.v>=-2)throw Error('reverse from rest');
let before=car.angle;keys={d:true};update(.01);if(car.angle>=before)throw Error('reverse steering');
reset();state='racing';car.v=20;keys.s=true;update(.05);if(car.v>=20||car.v<0)throw Error('brake before reverse');
keys={};const coast=car.v;update(.05);if(car.v<coast*.8)throw Error('coasting momentum');
reset();state='racing';const ramp=ramps[0];previousRampIndex=ramp.end;nearest=ramp.end;previous=ramp.end;
car.x=road[ramp.end+1].x;car.z=road[ramp.end+1].z;car.y=road[ramp.end].y;car.angle=road[ramp.end+1].angle;car.v=45;
update(.001);if(!car.airborne||car.vy<=0)throw Error('ramp takeoff');
for(let i=0;i<500&&car.airborne;i++)update(1/120);
if(car.airborne||runAir<.2)throw Error('gravity and landing');
reset();if(car.airborne||car.vy||car.lateral||runAir)throw Error('physics reset');
console.log('PASS: reverse, reverse steering, braking, coasting, ramp launch, gravity, landing, physics reset');
`,env);
vm.runInContext(`
selectTrack(0);reset();state='racing';car.v=90;keys.d=true;let heading=car.angle;update(.01);if(car.angle-heading<.002)throw Error('high speed steering');
reset();state='racing';car.v=35;keys={w:true,' ':true,d:true};
for(let i=0;i<230;i++)updateRace(.01,1,true);
if(driftCharge<2.2)throw Error('ultra drift charge');updateRace(.01,0,false);if(boostTime<1.7||boostTotal!==1)throw Error('release turbo');
driftCharge=1;wasDrift=true;car.airborne=false;hitCooldown=.1;updateRace(.01,1,true);if(driftCharge)throw Error('contact cancels drift');hitCooldown=0;
reset();state='racing';for(const p of pickups.slice(0,3)){car.x=p.x;car.z=p.z;car.y=p.y;updateRace(.01,0,false)}
if(nitro!==1||coins!==3)throw Error('coin nitro award');keys.e=true;updateRace(.01,0,false);if(nitro!==0||boostTime<1.3)throw Error('nitro use');
reset();state='racing';car.airborne=true;car.y=road[0].y+.01;car.vy=-5;elapsed=5;car.airTap=4.9;update(.02);if(trickTotal!==1||boostTime<.8)throw Error('timed landing trick');
reset();state='racing';car.v=40;keys={w:true,' ':true,d:true};updateDriving(TUNING.step);updateRace(TUNING.step,1,true);
if(!car.driftDirection||!car.lateral||!car.slipAngle)throw Error('drift momentum and slip');
for(let i=0;i<80;i++)updateRace(.01,0,true);if(driftCharge<.7||!wasDrift)throw Error('neutral steering cancels held drift');
updateRace(.01,-1,true);if(car.driftDirection!==-1)throw Error('switch drift side');for(let i=0;i<80;i++)updateRace(.01,-1,true);
updateRace(.01,0,false);if(!boostTime||car.driftDirection)throw Error('drift release');
if(typeof rivals!=='undefined')throw Error('competitors remain');
reset();if(coins||nitro||driftCharge||boostTime||boostTotal||trickTotal||pickups.some(p=>p.taken))throw Error('kart reset');
console.log('PASS: high-speed steering, held drift, countersteering, hop, slide, turbo release, contact cancellation, coins, nitro, tricks, solo mode, reset');
`,env);
vm.runInContext(`
function simulateFrames(fps){selectTrack(0);reset();state='racing';keys={w:true,d:true};for(let i=0;i<fps;i++)advanceFrame(1/fps);return [car.x,car.z,car.angle,car.v,elapsed]}
const baseline=simulateFrames(30);for(const fps of [60,144]){const result=simulateFrames(fps);if(result.some((n,i)=>Math.abs(n-baseline[i])>1e-6))throw Error('frame rate consistency '+fps)}
reset();state='racing';car.v=50;keys.d=true;for(let i=0;i<6;i++)update(TUNING.step);if(car.wheel<.9)throw Error('steering response');
keys={};for(let i=0;i<10;i++)update(TUNING.step);if(Math.abs(car.wheel)>.02)throw Error('steering release');
reset();const p=road[5];car.x=p.x+p.nx*(track.width+4);car.z=p.z+p.nz*(track.width+4);car.v=50;car.angle=p.angle+Math.PI/2;const beforeAngle=car.angle;containCar();if(car.angle!==beforeAngle)throw Error('wall overrides steering');
reset();state='racing';car.v=100;boostTime=0;const speedBefore=car.v;update(TUNING.step);if(speedBefore-car.v>1)throw Error('boost speed snap');
state='paused';const frozen=elapsed;advanceFrame(.1);if(elapsed!==frozen)throw Error('paused simulation');
reset();updateHUD();draw(0);console.log('PASS: 30/60/144 Hz consistency, 50 ms steering, quick release, wall steering independence, smooth boost expiry, pause, HUD');
`,env);
vm.runInContext(`
reset();state='racing';car.v=45;keys={w:true,d:true,' ':true};
for(let i=0;i<90;i++)updateDriving(TUNING.step);
const slip=Math.abs(car.slipAngle);if(slip<.3||car.v<45)throw Error('drift does not preserve powered momentum');
keys={w:true,a:true,' ':true};for(let i=0;i<35;i++)updateDriving(TUNING.step);
if(Math.abs(car.slipAngle)>=slip)throw Error('countersteering does not catch slide');
keys={w:true};for(let i=0;i<40;i++)updateDriving(TUNING.step);if(Math.abs(car.slipAngle)>.06)throw Error('grip recovery');
function coastWithSpace(space){reset();car.v=40;keys=space?{' ':true}:{};for(let i=0;i<60;i++)updateDriving(TUNING.step);return car.v}
if(Math.abs(coastWithSpace(true)-coastWithSpace(false))>.001)throw Error('Space applies unwanted brake');
console.log('PASS: real lateral slip, powered momentum, countersteer recovery, progressive grip return, no Space braking');
`,env);
vm.runInContext(`
const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
for(const forward of ['w','arrowup'])for(const dir of [-1,1])for(const speed of [0,40])for(const order of orders){
 reset();state='racing';car.v=speed;const button=dir<0?(forward==='w'?'a':'arrowleft'):(forward==='w'?'d':'arrowright'),combo=[forward,' ',button];
 for(const index of order){keys[combo[index]]=true;const input=updateDriving(TUNING.step);updateRace(TUNING.step,input.steer,input.driftButton)}
 if(car.driftDirection!==dir||!wasDrift)throw Error('combo activation '+forward+' '+dir+' '+speed+' '+order);
 const heading=car.angle;for(let i=0;i<12;i++){const input=updateDriving(TUNING.step);updateRace(TUNING.step,input.steer,input.driftButton)}
 if((car.angle-heading)*dir<=0)throw Error('drift turns wrong way');
 keys[' ']=false;let input=updateDriving(TUNING.step);updateRace(TUNING.step,input.steer,input.driftButton);if(car.driftDirection)throw Error('release does not clear side');
}
reset();car.v=40;keys={' ':true,d:true};updateDriving(TUNING.step);if(car.driftDirection)throw Error('drift without forward');
console.log('PASS: both sides, WASD/arrows, all six key orders, standing/moving activation, requested turn direction, release/re-arm, forward requirement');
`,env);
vm.runInContext(`
selectTrack(0);reset();update(.5);const countdownRemaining=count;
handlers.blur();if(state!=='paused')throw Error('countdown blur pause');
advanceFrame(.1);if(count!==countdownRemaining)throw Error('countdown runs while paused');
$('pause').onclick();if(state!=='countdown')throw Error('resume skipped countdown');
update(3);keys.w=true;$('pause').onclick();
if(state!=='paused'||keys.w)throw Error('pause did not clear held controls');
updateHUD();if($('pause').textContent!=='RESUME ▶')throw Error('missing resume control');
const pausedElapsed=elapsed;advanceFrame(.1);if(elapsed!==pausedElapsed)throw Error('paused timer advances');
handlers.keydown({key:'Escape',repeat:true});if(state!=='paused')throw Error('held Escape toggles pause');
$('pause').onclick();if(state!=='racing')throw Error('button resume');
openCourses();closeCourses();if(state!=='racing')throw Error('atlas resume');
handlers.blur();openCourses();closeCourses();if(state!=='paused')throw Error('atlas lost paused state');
reset();update(3);updateHUD();if($('pause').textContent!=='PAUSE Ⅱ')throw Error('restart pause label');
console.log('PASS: on-screen pause/resume, frozen timer, countdown blur recovery, cleared controls, Escape repeat, atlas pause preservation, restart');
`,env);
new Function(...Object.keys(env),chunks.join('\n'))(...Object.values(env));


