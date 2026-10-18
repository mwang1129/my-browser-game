const fs=require('fs'),assert=require('assert');
const chunks=[];const vm={createContext:()=>{},runInContext:code=>chunks.push(code)};
const elements={};const noop=()=>{};const context=new Proxy({}, {get:(o,k)=>k==='createLinearGradient'?()=>({addColorStop:noop}):noop,set:()=>true});
function el(id){return elements[id]??={style:{},classList:{add:noop,remove:noop},focus:noop,querySelectorAll:()=>[],getContext:()=>context,textContent:'',width:0,height:0}}
const handlers={};
const audioParam=()=>({value:0,cancelScheduledValues(){},setValueAtTime(value){this.value=value},setTargetAtTime(value){this.value=value},linearRampToValueAtTime(value){this.value=value},exponentialRampToValueAtTime(value){this.value=value}});
class FakeAudioContext{
 constructor(){this.currentTime=0;this.sampleRate=200;this.destination={};}
 createGain(){return {gain:audioParam(),connect(){}}}
 createOscillator(){return {frequency:audioParam(),connect(){},start(){}}}
 createBiquadFilter(){return {frequency:audioParam(),Q:audioParam(),connect(){}}}
 createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)}}
 createBufferSource(){return {connect(){},start(){}}}
 resume(){return Promise.resolve()}
}
const env={document:{getElementById:el,querySelectorAll:()=>[]},innerWidth:1440,innerHeight:900,devicePixelRatio:1,addEventListener:(name,handler)=>handlers[name]=handler,requestAnimationFrame:noop,setTimeout:noop,localStorage:{getItem:()=>0,setItem:noop},console,handlers};vm.createContext(env);
env.AudioContext=FakeAudioContext;env.Audio=undefined;
vm.runInContext(fs.readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1],env);
vm.runInContext(`function driveThroughFinish(){const p=road[0];car.x=p.x-Math.sin(p.angle);car.z=p.z-Math.cos(p.angle);car.y=p.y+1;car.angle=car.motionAngle=p.angle;car.airborne=false;car.v=20;keys={w:true};previous=N-1;update(.1)};reset(); update(3.1); if(state!=='racing')throw Error('countdown');keys.w=true;for(let i=0;i<60;i++)update(1/60);if(car.v<20)throw Error('acceleration');let a=car.angle; keys.d=true;update(.1);if(car.angle<=a)throw Error('steering'); keys={};travel=N-2;elapsed=20;update(.016);if(state!=='racing')throw Error('finished before crossing line');travel=N;driveThroughFinish();if(state!=='finished')throw Error('finish');reset();if(elapsed!==0||state!=='countdown')throw Error('replay');draw(0);console.log('PASS: countdown, acceleration, steering, finish, replay, rendering calls');`,env);
vm.runInContext(`
if(tracks.length!==51||new Set(tracks.map(t=>t.name)).size!==51)throw Error('track count');
for(let i=1;i<tracks.length;i++){let a=tracks[i-1],b=tracks[i];if(!(b.width<a.width&&b.elevation>a.elevation&&b.penalty>a.penalty))throw Error('difficulty progression '+i)}
const signatures=new Set(),saved=new Map();localStorage.setItem=(k,v)=>saved.set(k,String(v));localStorage.getItem=k=>saved.get(k)||null;
for(let id=0;id<51;id++){
 selectTrack(id);if(road.length!==N||!road.every(p=>Number.isFinite(p.x+p.y+p.z+p.angle)))throw Error('geometry '+id);
 signatures.add(JSON.stringify(road.map(p=>[p.x,p.z])));
 const lengths=road.map((p,i)=>Math.hypot(p.x-road[(i+1)%N].x,p.z-road[(i+1)%N].z));
 if(Math.max(...lengths)/Math.min(...lengths)>1.1)throw Error('uneven sampling '+id);
 reset();update(3.1);elapsed=20;
 // Follow each sampled point through a full lap to exercise progress wrapping.
 for(let i=1;i<=N;i++){car.x=road[i%N].x;car.z=road[i%N].z;car.y=road[i%N].y+1;car.airborne=false;car.v=0;update(.016);if(state==='finished')break}
 driveThroughFinish();if(state!=='finished'||!saved.has(bestKey()))throw Error('lap finish '+id);
 draw(0);reset();if(elapsed!==0||travel!==0)throw Error('restart '+id);
}
if(signatures.size!==51||[...saved.keys()].filter(key=>key.endsWith('-best')).length!==51)throw Error('uniqueness or record isolation');
selectTrack(2);if(!best)throw Error('record reload');openCourses();if(($('coursegrid').innerHTML.match(/data-course=/g)||[]).length!==51)throw Error('atlas count');closeCourses();
selectTrack(50);$('next').onclick();if(selected!==0||state!=='countdown')throw Error('next wrap');
const looks=new Set();let priorCount=0;
for(let id=0;id<51;id++){
 selectTrack(id);looks.add(track.theme.kind+':'+track.variant);
 if(obstacles.length<priorCount)throw Error('hazard progression');priorCount=obstacles.length;
 for(const o of obstacles){if(o.index<30||o.index>N-30)throw Error('start clearance');if(Math.hypot(o.x-road[o.index].x,o.z-road[o.index].z)-o.radius-1.25<.4)throw Error('center line blocked '+id)}
 reset();update(3.1);const o=obstacles[0];car.x=o.x;car.z=o.z;car.angle=o.angle;car.v=50;nearest=o.index;previous=o.index;update(.001);
 if(car.v>20||impact<=0||!hitCooldown)throw Error('obstacle collision '+id);
 const d=Math.hypot(car.x-o.x,car.z-o.z);if(d<o.radius+1.24)throw Error('collision separation');
 reset();if(hitCooldown||impact)throw Error('impact reset');draw(0);
}
if(looks.size!==51)throw Error('environment variants');
for(let id=0;id<51;id++){
 selectTrack(id);if(shortcuts.length!==1)throw Error('missing shortcut '+id);const branch=shortcuts[0];
 if(branch.width>=track.width||branch.start<20||branch.end>N-20)throw Error('shortcut bounds');
 reset();update(3.1);elapsed=20;
 function follow(p){car.x=p.x;car.z=p.z;car.y=p.y+1;car.airborne=false;car.v=0;update(.016)}
 for(let i=1;i<=branch.start;i++)follow(road[i]);
 for(const p of branch.points)follow(p);
 if(Math.abs(travel-branch.end)>4)throw Error('shortcut progress '+id+': '+travel);
 for(let i=branch.end+1;i<N;i++){follow(road[i]);if(state==='finished')break}
 driveThroughFinish();if(state!=='finished')throw Error('shortcut finish '+id);
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
for(let i=0;i<1500&&car.airborne;i++)update(1/120);
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
if(powerups!==3)throw Error('one power-up per box');const beforePowerup=car.v;keys.e=true;updateRace(.01,0,false);if(powerups!==2||boostTime<2.9||car.v-beforePowerup<30)throw Error('stored turbo use');
reset();state='racing';car.airborne=true;car.y=(wheelContact(road[0].y+3,road[0].y-3)??road[0].y)+.01;car.vy=-5;elapsed=5;car.airTap=4.9;update(.02);if(trickTotal!==1||boostTime<.8)throw Error('timed landing trick');
reset();state='racing';car.v=40;keys={w:true,' ':true,d:true};updateDriving(TUNING.step);updateRace(TUNING.step,1,true);
if(!car.driftDirection||!car.lateral||!car.slipAngle)throw Error('drift momentum and slip');
for(let i=0;i<80;i++)updateRace(.01,0,true);if(driftCharge<.7||!wasDrift)throw Error('neutral steering cancels held drift');
updateRace(.01,-1,true);if(car.driftDirection!==-1)throw Error('switch drift side');for(let i=0;i<80;i++)updateRace(.01,-1,true);
updateRace(.01,0,false);if(!boostTime||car.driftDirection)throw Error('drift release');
if(typeof rivals!=='undefined')throw Error('competitors remain');
reset();if(powerups||driftCharge||boostTime||boostTotal||trickTotal||pickups.some(p=>p.taken))throw Error('kart reset');
console.log('PASS: high-speed steering, held drift, countersteering, hop, slide, turbo release, contact cancellation, power-up boxes, stored turbo, tricks, solo mode, reset');
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
vm.runInContext(`
for(let id=0;id<51;id++){
 selectTrack(id);
 for(const ramp of ramps){
  reset();state='racing';const tip=road[ramp.end],spacing=track.length/N;
  if(ramp.height<10||ramp.gapLength<160)throw Error('ramp or gap dimensions '+id);
  const middle=(ramp.end+ramp.landing)/2,base=Math.floor(middle),fraction=middle-base;
  const point={x:road[base].x+(road[base+1].x-road[base].x)*fraction,z:road[base].z+(road[base+1].z-road[base].z)*fraction};
  if(findSurface(point.x,point.z).supported)throw Error('solid roadway in jump gap '+id);
  car.x=tip.x;car.z=tip.z;car.y=tip.y;car.v=45;car.rampLock=0;previousRampIndex=ramp.end;nearest=ramp.end;
  updateHeight(.001,{y:tip.y,supported:false,progress:ramp.end+.01});if(!car.airborne||car.vy<=0)throw Error('winged takeoff at exact gap edge '+id);
  const duration=ramp.gapLength/45;
  for(let t=0;t<duration;t+=1/120){
   const progress=ramp.end+Math.min(t/duration,.999)*(ramp.landing-ramp.end),a=Math.floor(progress),f=progress-a,b=road[a+1];
   car.x=road[a].x+(b.x-road[a].x)*f;car.z=road[a].z+(b.z-road[a].z)*f;nearest=a;
   updateHeight(1/120,{y:road[a].y+(b.y-road[a].y)*f,supported:false});
   if(!car.airborne)throw Error('landed on missing road '+id);
  }
  if(car.y<road[ramp.landing].y)throw Error('cannot clear landing edge at 45 m/s '+id);
  car.x=road[ramp.landing].x;car.z=road[ramp.landing].z;nearest=ramp.landing;
  for(let i=0;i<1200&&car.airborne;i++)updateHeight(1/120,{y:road[ramp.landing].y,supported:true});
  if(car.airborne||runHits)throw Error('failed supported landing '+id);
 }
}
selectTrack(0);reset();state='racing';const missed=ramps[0];nearest=missed.end+2;previousRampIndex=nearest;car.x=road[nearest].x;car.z=road[nearest].z;car.y=road[nearest].y;car.v=0;travel=nearest;
for(let i=0;i<1200;i++){updateHeight(1/120,{y:road[missed.landing].y,supported:false});if(runHits)break}
if(runHits!==1||car.airborne||nearest!==missed.start-5||elapsed!==2||travel!==nearest)throw Error('missed jump recovery');
reset();car.airborne=true;car.x=road[0].x+500;const airborneX=car.x;containCar();if(car.x!==airborneX)throw Error('invisible airborne guardrail');drawKart(car,track.accent);
console.log('PASS: 106 ramp launches and gap crossings, unsupported gaps, landing clearance, wing rendering, no airborne walls, missed-gap recovery and penalty');
`,env);
vm.runInContext(`
selectTrack(0);reset();state='racing';const flightRamp=ramps[0],tip=road[flightRamp.end];
car={...car,x:tip.x,z:tip.z,y:tip.y,v:60,angle:tip.angle+.7,motionAngle:tip.angle-.6,wheel:1,lateral:25,slipAngle:1.3,driftDirection:1};
nearest=previousRampIndex=flightRamp.end;updateHeight(.001,{y:tip.y,supported:false,progress:flightRamp.end+.01});
const flightHeading=car.angle,startX=car.x,startZ=car.z;keys={};
for(let i=0;i<120;i++)updateDriving(1/120);
const crosswind=(car.x-startX)*Math.cos(flightHeading)-(car.z-startZ)*Math.sin(flightHeading);
if(Math.abs(crosswind)>1e-7||Math.abs(car.angle-flightHeading)>1e-7||Math.abs(car.lateral)>1e-7||car.v<59)throw Error('uncommanded glide drift or speed loss');
const forwardHeading=car.angle;keys={d:true};for(let i=0;i<60;i++)updateDriving(1/120);
if(car.angle-forwardHeading<.2||Math.abs(car.motionAngle-car.angle)>.15||car.airBank>-.15)throw Error('smooth banked air steering');
keys={};for(let i=0;i<120;i++)updateDriving(1/120);const settledHeading=car.angle;for(let i=0;i<120;i++)updateDriving(1/120);if(Math.abs(car.angle-settledHeading)>.002||Math.abs(car.lateral)>.1||Math.abs(car.airBank)>.01)throw Error('air turn does not settle after release');
reset();state='racing';powerups=3;keys={e:true};updateRace(.01,0,false);const heldCount=powerups;
for(let i=0;i<120;i++)updateRace(1/120,0,false);if(powerups!==heldCount)throw Error('held E drains inventory');
keys={};updateRace(.01,0,false);keys={e:true};updateRace(.01,0,false);if(powerups!==heldCount-1)throw Error('second E press');
reset();state='racing';powerups=3;const item=pickups[0];car.x=item.x;car.z=item.z;car.y=item.y;updateRace(.01,0,false);if(item.taken)throw Error('full inventory wastes pickup');
usePowerup();updateRace(.01,0,false);if(powerups!==3||!item.taken)throw Error('stored box collection');
reset();state='racing';car.v=90;powerups=1;usePowerup();keys={w:true};for(let i=0;i<120;i++)updateDriving(1/120);if(car.v<135)throw Error('turbo does not produce a substantial speed boost');
powerups=0;const emptySpeed=car.v;usePowerup();if(car.v!==emptySpeed||powerups!==0)throw Error('empty power-up use');
console.log('PASS: zero neutral air drift, smooth banked steering and settled release, maintained glide speed, stored power-ups, single use per E press, full inventory, strong turbo speed');
`,env);
vm.runInContext(`
for(let id=0;id<51;id++){selectTrack(id);if(ramps.length!==(id===50?6:2))throw Error('flight sections missing '+id);for(let i=1;i<ramps.length;i++)if(ramps[i].start<=ramps[i-1].landing+4)throw Error('overlapping flight sections '+id)}
if(!track.bonus||track.name!=='Skyway Stunt Park'||obstacles.length!==36||new Set(obstacles.map(o=>o.index)).size!==36)throw Error('bonus stunt course');
openCourses();if(($('coursegrid').innerHTML.match(/FLIGHT SECTIONS/g)||[]).length!==51||!$('coursegrid').innerHTML.includes('6 FLIGHT SECTIONS · 36 OBSTACLES'))throw Error('atlas flight markers');closeCourses();
selectTrack(0);reset();state='racing';muted=false;initAudio();
if(!soundNodes||osc.type!=='sine'||gain.gain.value<=0)throw Error('layered engine sound');
car.airborne=true;car.v=60;syncAudio();if(soundNodes.wing.gain.value<=0||soundNodes.flutterDepth.gain.value<=0)throw Error('wing sound missing');
pauseRace();if(gain.gain.value!==0)throw Error('pause did not immediately silence audio');
loop(100);if(gain.gain.value!==0)throw Error('paused animation has audio');
togglePause();syncAudio();if(gain.gain.value<=0)throw Error('resume audio');
car.airborne=false;syncAudio();if(soundNodes.wing.gain.value!==0||soundNodes.flutterDepth.gain.value!==0)throw Error('wing sound on ground');
for(const screen of ['intro','countdown','paused','finished']){state=screen;gain.gain.value=1;syncAudio();if(gain.gain.value!==0)throw Error('audio leaks on '+screen)}
state='racing';muted=true;syncAudio();if(gain.gain.value!==0)throw Error('mute audio');
console.log('PASS: layered engine, flight wind/flutter, immediate pause silence, paused render audio gate, resume/mute, 106 marked flight sections, six-jump 36-obstacle bonus map');
`,env);
vm.runInContext(`
{
 selectTrack(0);reset();state='racing';const floor=road[0].y,originalLanes=lanes;
 const flatLane={points:[{x:car.x,z:car.z-10,y:floor,nx:1,nz:0,progress:0},{x:car.x,z:car.z+10,y:floor,nx:1,nz:0,progress:1}],width:10,closed:false};lanes=[flatLane];
 function airborneAt(y,vy){car.airborne=true;car.y=y;car.vy=vy;car.v=0;car.flightRamp=ramps[0];nearest=previousRampIndex=0;}
 airborneAt(floor+4,-2);updateHeight(.01,{y:floor,supported:true});if(!car.airborne)throw Error('landed above road');
 airborneAt(floor-.1,2);updateHeight(.01,{y:floor,supported:true});if(!car.airborne||car.y>=floor)throw Error('snapped up while ascending below platform');
 airborneAt(floor-2,-2);updateHeight(.01,{y:floor,supported:true});if(!car.airborne||car.y>=floor)throw Error('snapped up to platform from below');
 airborneAt(floor+4,-2);updateHeight(.01,{y:floor+60,supported:false});if(!car.airborne||runHits)throw Error('nearby high platform forced recovery');
 lanes=[];airborneAt(floor+.005,-1);updateHeight(.01,{y:floor,supported:false});if(!car.airborne)throw Error('landed in open gap');lanes=[flatLane];
 airborneAt(floor+.005,-1);updateHeight(.01,{y:floor,supported:true});if(car.airborne||Math.abs(car.y-floor)>1e-8)throw Error('missed real descending touchdown');
 airborneAt(floor+4.005,-1);updateHeight(.01,{y:floor+4,supported:true});if(!car.airborne||car.y<=floor)throw Error('used nearby lane height instead of rendered wheel surface');
 car.airborne=false;car.flightBlend=1;car.wingOpen=1;updateCamera(1/120);if(car.flightBlend<.95||car.wingOpen<.94)throw Error('instant camera or wing snap at touchdown');
 state='racing';muted=false;car.v=0;keys={w:true};syncAudio();const idlePitch=osc.frequency.value;car.v=90;syncAudio();if(osc.frequency.value-idlePitch>30||soundNodes.engine.gain.value>.075||soundNodes.filter.frequency.value>350||soundNodes.exhaust.gain.value<=0)throw Error('harsh acceleration sound');muted=true;syncAudio();
 lanes=originalLanes;
 airborneAt(floor+20,0);car.angle=car.motionAngle=0;car.airYaw=0;car.v=60;keys={d:true};for(let i=0;i<30;i++)updateDriving(1/120);if(car.angle<.17||car.motionAngle<.08)throw Error('air steering not sensitive enough');
 console.log('PASS: rendered-road wheel contact, no nearby-lane height snap, no airborne/platform/gap landing, smooth camera and wing touchdown, quieter low-pitch engine, sensitive air steering');
}
`,env);
vm.runInContext(`
{
 selectTrack(0);reset();state='racing';const originalLanes=lanes;
 lanes=[{points:[{x:0,z:0,y:0,nx:1,nz:0,progress:0},{x:0,z:20,y:10,nx:1,nz:0,progress:1}],width:10,closed:false}];
 const start={x:0,z:2,y:4,angle:0};car={...car,x:0,z:10,y:4,angle:0,airborne:true,vy:-2,v:0,flightRamp:ramps[0]};nearest=previousRampIndex=0;
 updateHeight(.1,{y:5,supported:true},start);
 if(car.airborne||car.z<=start.z||car.z>=10||Math.abs(car.y-(car.z+1.95)*.5)>1e-6)throw Error('tunneled into rising road instead of stopping at first wheel contact');
 const savedZ=car.z,savedY=car.y;updateHeight(.01,{y:car.z*.5,supported:true});if(Math.abs(car.z-savedZ)>1e-8||Math.abs(car.y-savedY)>1e-6)throw Error('sank into slope on grounded frame after touchdown');
 car.x=0;car.z=10;car.angle=0;
 if(sweptWheelContact({x:0,z:10,y:9,angle:0},8)!==null)throw Error('swept landing before touching road');
 if(sweptWheelContact({x:0,z:10,y:1,angle:0},0)!==null)throw Error('swept snap onto road from below');
 const fast=sweptWheelContact({x:0,z:10,y:30,angle:0},-30);if(!fast||Math.abs(fast.y-5.975)>1e-6)throw Error('fast descent tunneled through surface');
 lanes=[];if(sweptWheelContact({x:0,z:10,y:30,angle:0},-30)!==null)throw Error('swept hit inside open gap');lanes=originalLanes;
 console.log('PASS: swept sloped touchdown, no post-landing ground penetration, no premature or below-road landing, fast descent collision, open gaps');
}
`,env);
vm.runInContext(`
{
 selectTrack(0);const p=road[0],point=(forward,side=0,y=p.y)=>({x:p.x+Math.sin(p.angle)*forward+Math.cos(p.angle)*side,z:p.z+Math.cos(p.angle)*forward-Math.sin(p.angle)*side,y});
 function prepare(progress= N){reset();state='racing';travel=progress;elapsed=9;keys={w:true};}
 function cross(from,to){Object.assign(car,to);return checkFinish(from,.1)}
 prepare();if(cross(point(-10),point(-2))||state!=='racing')throw Error('early finish');
 prepare(0);if(cross(point(-1),point(1)))throw Error('finish without full lap');
 prepare();if(cross(point(1),point(-1)))throw Error('reverse finish');
 prepare();if(cross(point(-1,track.width+3),point(1,track.width+3)))throw Error('finish outside gate');
 prepare();if(cross(point(-1,0,p.y-3),point(1,0,p.y-3)))throw Error('finish underneath road');
 prepare();if(!cross(point(-3),point(7))||Math.abs(elapsed-8.93)>1e-8||Math.abs((car.x-p.x)*Math.sin(p.angle)+(car.z-p.z)*Math.cos(p.angle))>1e-8)throw Error('crossing time or position');
 if(state!=='finished'||Object.keys(keys).length||$('hud').style.display!=='none'||$('result').style.display!=='flex')throw Error('finish controls/results');
 const finalElapsed=elapsed,finalBest=best;update(.5);finish();if(elapsed!==finalElapsed||best!==finalBest)throw Error('duplicate or moving finish');
 prepare();car.airborne=true;if(!cross(point(-1,0,p.y+8),point(1,0,p.y+8)))throw Error('legitimate airborne finish');
 reset();if(state!=='countdown'||travel!==0||$('hud').style.display!=='block'||$('result').style.display!=='none')throw Error('replay after results');
 console.log('PASS: exact forward finish-line crossing, no early/reverse/off-road/under-road finish, full-lap requirement, sub-10-second and airborne finishes, precise timing, frozen results, replay');
}
`,env);
vm.runInContext(`
{
 for(let id=0;id<51;id++){
  selectTrack(id);reset();state='racing';for(const progress of [N*.2,N*.5,N*.75,N*.92])updateLapStage(progress);
  if(lapStage!==4)throw Error('lap checkpoint order '+id);
  travel=N*.75;elapsed=20;const p=road[0];car={...car,x:p.x-Math.sin(p.angle)*.2,z:p.z-Math.cos(p.angle)*.2,y:p.y+40,angle:p.angle,motionAngle:p.angle,v:90,airborne:true,vy:-2};keys={};
  update(TUNING.step);if(state!=='finished')throw Error('gliding finish with lost nearest-lane progress '+id);
 }
 selectTrack(0);reset();state='racing';for(const progress of [N-1,N*.8,N*.6,N*.3,0])updateLapStage(progress);if(lapStage===4)throw Error('reverse route armed finish');
 const p=road[0];lapStage=4;travel=N*.7;elapsed=20;car={...car,x:p.x+Math.sin(p.angle),z:p.z+Math.cos(p.angle),y:p.y+4};if(!checkFinish({...p,y:p.y+4},.1))throw Error('crossing from exactly on finish plane');
 reset();const groundShadow=shadowHeightAt({...road[0],y:road[0].y+20});if(Math.abs(groundShadow-road[0].y)>1e-6)throw Error('shadow not on rendered road');
 const gap=ramps[0],mid=Math.floor((gap.end+gap.landing)/2),gapShadow=shadowHeightAt({...road[mid],y:road[mid].y+40});if(gapShadow>=road[mid].y-1)throw Error('shadow floats on missing gap road');
 const originalPoly=poly,shadowPolygons=[];poly=(points,color)=>shadowPolygons.push({points,color});drawKartShadow({...road[0],y:road[0].y+20,airborne:true});poly=originalPoly;
 if(shadowPolygons.length<3||shadowPolygons.some(s=>!s.color.startsWith('rgba(')||s.points.some(p=>!Number.isFinite(p.y))))throw Error('invalid soft kart shadow');
 reset();if(lapStage!==0)throw Error('replay kept finish checkpoints');
 console.log('PASS: all 51 gliding finishes despite lost progress, ordered/reverse/reset checkpoint handling, exact-plane crossing, road and gap-floor shadows, soft shadow rendering');
}
`,env);
vm.runInContext(`
{
 const signatures=new Set();for(let id=-1;id<51;id++){const profile=musicProfile(id);signatures.add(JSON.stringify([profile.root,profile.tempo,profile.scale,profile.melody,profile.chords]));}if(signatures.size!==52)throw Error('music themes are not distinct');
 selectTrack(0);muted=false;state='intro';syncAudio();const music=soundNodes.music;if(music.key!==-1||music.bus.gain.value<=0||gain.gain.value!==0||music.step===0)throw Error('home-screen music');
 state='racing';selected=7;syncAudio();if(music.key!==7||music.profile.id!==7||music.voices[1].oscillator.frequency.value<=0)throw Error('map-specific music');
 const scheduledStep=music.step;audio.currentTime+=1;syncAudio();if(music.step<=scheduledStep)throw Error('music sequencer not advancing');
 state='paused';syncAudio();if(music.bus.gain.value!==0||gain.gain.value!==0)throw Error('paused music or engine leak');
 state='racing';muted=true;syncAudio();if(music.bus.gain.value!==0)throw Error('muted music leak');
 selectTrack(0);reset();state='racing';const originalLanes=lanes;lanes=[{points:[{x:0,z:-20,y:0,nx:1,nz:0,progress:0},{x:0,z:20,y:0,nx:1,nz:0,progress:1}],width:5,closed:false}];
 car={...car,x:6.85,z:0,y:.1,angle:0,airborne:true,vy:-1};if(wheelContact(.1,-.1)===null)throw Error('slightly missed edge does not catch tyre');
 car.x=7.2;if(wheelContact(.1,-.1)!==null)throw Error('landing assistance reaches too far');car.x=6.85;if(wheelContact(1,.5)!==null)throw Error('landing leniency pulls kart down early');lanes=originalLanes;
 console.log('PASS: 52 distinct music themes, home/map switching, sequencer playback, pause/mute silence, modest tyre-edge landing forgiveness without early or far-edge snaps');
}
`,env);
vm.runInContext(`
{
 selectTrack(0);reset();state='racing';const originalLanes=lanes;
 lanes=[{points:[{x:0,z:0,y:0,nx:1,nz:0,progress:0},{x:0,z:20,y:10,nx:1,nz:0,progress:1}],width:10,closed:false}];
 const start={x:0,z:2,y:4,angle:0};car={...car,x:0,z:10,y:4,angle:0,airborne:true,vy:2,v:0,flightRamp:ramps[0]};nearest=previousRampIndex=0;
 updateHeight(.1,{y:5,supported:true},start);if(car.airborne||Math.abs(car.y-(car.z+1.95)*.5)>1e-6)throw Error('ascending kart passed through rising road');lanes=originalLanes;
 for(let id=0;id<51;id++){selectTrack(id);for(const ramp of ramps){reset();state='racing';const index=Math.floor((ramp.end+ramp.landing)/2),p=road[index];car={...car,x:p.x,z:p.z,y:p.y+10,angle:p.angle,airborne:true,vy:-2,flightRamp:ramp};
  const hit=sweptWheelContact({...car},p.y-60,'pit');if(!hit||hit.y>p.y-20)throw Error('missing rendered pit floor collision '+id);
  car.y=hit.y+.01;const start={x:car.x,z:car.z,y:car.y,angle:car.angle};nearest=previousRampIndex=index;travel=index;
  updateHeight(.01,{y:p.y,supported:false,progress:index},start);if(car.airborne||runHits!==1||nearest!==ramp.start-5)throw Error('flew through pit floor before recovery '+id);
 }}
 selectTrack(0);reset();const ramp=ramps[0],p=road[ramp.landing],behind=(distance,y)=>({x:p.x-Math.sin(p.angle)*distance,z:p.z-Math.cos(p.angle)*distance,y,angle:p.angle});
 Object.assign(car,behind(.5,p.y-2));if(!landingWallContact(behind(4,p.y-2),p.y-2))throw Error('flies through landing platform face');
 Object.assign(car,behind(.5,p.y+3));if(landingWallContact(behind(4,p.y+3),p.y+3))throw Error('platform wall blocks a clear jump');
 muted=false;state='racing';car.airborne=true;car.v=90;syncAudio();if(soundNodes.wing.gain.value>.7||soundNodes.flutterDepth.gain.value>.025)throw Error('wind mix still too loud');muted=true;syncAudio();
 console.log('PASS: rising-road collision while ascending, all 106 pit-floor recoveries at visible contact, solid landing platform faces, clear jumps unblocked, quieter gliding wind');
}
`,env);
vm.runInContext(`
{
 selectTrack(0);muted=false;const originalCue=playCountdownCue,cues=[];playCountdownCue=beat=>{cues.push(beat);originalCue(beat)};
 reset();while(count>2)update(TUNING.step);keys={w:true};update(TUNING.step);while(state==='countdown')update(TUNING.step);
 if(car.v<35||boostTime<1.5||JSON.stringify(cues)!==JSON.stringify([3,2,1,'go']))throw Error('perfect start boost or countdown cue sequence');
 reset();keys={w:true};while(state==='countdown')update(TUNING.step);if(boostTime>0||car.v>2)throw Error('holding forward early awards start boost');
 reset();while(count>1)update(TUNING.step);keys={arrowup:true};update(TUNING.step);keys={};update(TUNING.step);while(state==='countdown')update(TUNING.step);if(boostTime>0)throw Error('released forward still earns start boost');
 reset();while(count>.4)update(TUNING.step);keys={w:true};while(state==='countdown')update(TUNING.step);if(boostTime>0)throw Error('late start awards boost');
 playCountdownCue=originalCue;state='paused';syncAudio();if(soundNodes.cues.bus.gain.value!==0)throw Error('countdown cue audible while paused');
 for(let id=0;id<51;id++){selectTrack(id);for(const ramp of ramps){reset();state='racing';const a=road[ramp.end-1],p=road[ramp.end],q=road[ramp.end+1],f=.05;car={...car,x:p.x+(q.x-p.x)*f,z:p.z+(q.z-p.z)*f,y:a.y,angle:p.angle,motionAngle:p.angle,v:90};powerups=1;usePowerup();previousRampIndex=nearest=ramp.end;updateHeight(TUNING.step,{y:p.y,supported:false,progress:ramp.end+f},{x:a.x,z:a.z,y:a.y,angle:a.angle});if(!car.airborne||car.v<120||car.rampLock>.5)throw Error('turbo launch recontacts ramp and locks out '+id);}}
 muted=false;state='racing';car.airborne=true;car.v=145;syncAudio();if(soundNodes.wing.gain.value>.13||soundNodes.flutterDepth.gain.value>.004)throw Error('wind not sufficiently reduced');muted=true;syncAudio();
 if(TUNING.focalLength>=.7)throw Error('field of view not widened');
 console.log('PASS: timed forward start boost, no early/released/late boost, 3/2/1/GO sounds, muted paused cues, all 106 turbo ramp-edge launches, much quieter wind, wider field of view');
}
`,env);
vm.runInContext(`
{
 selectTrack(0);reset();while(count>2)update(TUNING.step);keys={w:true,d:true};update(TUNING.step);while(state==='countdown')update(TUNING.step);if(boostTime<1.5||car.v<35||car.angle<=road[0].angle)throw Error('2-count launch boost with immediate steering');
 if(TUNING.turnRate!==1.85||TUNING.fastTurnRate!==1.55||TUNING.steerResponse!==48)throw Error('ground steering sensitivity changed');
 const triangle=[{x:-1,y:0,z:-1},{x:1,y:1,z:-1},{x:0,y:.5,z:1}],decal=clipShadowToTriangle([{x:-3,z:-3},{x:3,z:-3},{x:3,z:3},{x:-3,z:3}],triangle);
 if(decal.length<3||decal.some(p=>triangleHeight(p.x,p.z,...triangle)===null||Math.abs(p.y-triangleHeight(p.x,p.z,...triangle)-.035)>1e-7))throw Error('shadow floats or escapes receiver triangle');
 const originalLanes=lanes;lanes=[{points:[{x:1.65,z:1.2,y:0,nx:1,nz:0,progress:0},{x:1.65,z:1.6,y:0,nx:1,nz:0,progress:1}],width:.1,closed:false}];car={...car,x:0,z:0,y:.1,angle:0};if(wheelContact(.1,-.1)===null||sweptWheelContact({x:0,z:0,y:.1,angle:0},-.1)===null)throw Error('missed contact inside tyre patch');
 lanes=[{points:[{x:0,z:-10,y:0,nx:1,nz:0,progress:0},{x:0,z:10,y:0,nx:1,nz:0,progress:1}],width:10,closed:false}];car={...car,x:0,z:0,y:-6.4,angle:0,airborne:true,vy:20,v:0,flightRamp:ramps[0]};nearest=previousRampIndex=0;updateHeight(.1,{y:0,supported:true},{x:0,z:0,y:-6.4,angle:0});if(!car.airborne||car.y+2.4> -3||car.vy>=0)throw Error('kart passed upward through road underside');lanes=originalLanes;
 console.log('PASS: boost held from 2 with immediate steering, unchanged steering tuning, shadows clipped to sloped receivers, inner tyre-patch contacts, solid road undersides');
}
`,env);
vm.runInContext(`
{
 const flat=[{x:-100,y:0,z:-100},{x:100,y:0,z:-100},{x:0,y:0,z:100}],projected=projectShadowPoint({x:0,y:10,z:0},flat);
 if(!projected||Math.abs(projected.x+3.2)>1e-8||Math.abs(projected.z-2.2)>1e-8)throw Error('inconsistent shadow light direction');
 if(projectShadowPoint({x:0,y:-1,z:0},flat)!==null)throw Error('casts shadow upward onto road');
 const slope=[{x:-100,y:-50,z:-100},{x:100,y:50,z:-100},{x:0,y:0,z:100}],onSlope=projectShadowPoint({x:0,y:10,z:0},slope),distance=(onSlope.x/-.32);
 if(Math.abs(10-distance-triangleHeight(onSlope.x,onSlope.z,...slope,false))>1e-7)throw Error('shadow ray misses slope');
 const grounded={x:0,y:0,z:0,angle:0,airborne:false,wingOpen:0},flying={...grounded,y:6,airborne:true,wingOpen:1};
 if(kartShadowShapes(grounded).length!==1||kartShadowShapes(flying).length!==3)throw Error('missing kart or wing silhouette');
 selectTrack(0);reset();const stateBefore=JSON.stringify(car),layers=[];drawKartShadow(car,(points,color,key)=>layers.push({points,color,key}));
 if(!layers.length||layers.some(layer=>!layer.color.startsWith('rgba(')||layer.points.some(p=>!Number.isFinite(p.x+p.y+p.z))))throw Error('invalid projected shadow');
 if(JSON.stringify(car)!==stateBefore)throw Error('shadow renderer moves the kart');
 console.log('PASS: directional kart/wing silhouettes, slope ray projection, no upward shadows, finite surface-clipped layers, rendering preserves kart position');
}
`,env);
vm.runInContext(`
{
 const styles=new Set();for(let id=0;id<51;id++){selectTrack(id);const style=landscapeStyle();if(!style.floor||!style.path)throw Error('missing terrain '+id);styles.add(JSON.stringify(style)+selected);const n=landscapeNoise(9);if(n!==landscapeNoise(9)||!Number.isFinite(n))throw Error('unstable landscape');}
 if(styles.size!==51)throw Error('map settings');
 selectTrack(0);muted=false;initAudio();const music=soundNodes.music;state='racing';syncAudio();audio.currentTime=30;music.next=0;const before=music.step;syncMusic();if(music.next<30||music.step-before>1)throw Error('music backlog replay');
 let resumes=0;const resume=audio.resume;audio.resume=()=>{resumes++;return Promise.resolve()};state='paused';pauseState='racing';$('courses').style.display='none';togglePause();if(!resumes)throw Error('resume fails to wake audio');
 audio.state='suspended';handlers.pointerdown();if(resumes<2)throw Error('gesture fails to wake audio');audio.resume=resume;audio.state='closed';const oldAudio=audio;initAudio();if(audio===oldAudio)throw Error('closed audio not recreated');audio.state='running';
 muted=true;$('sound').onclick();if(localStorage.getItem('apex-sound-enabled')!=='true')throw Error('sound preference not saved');$('sound').onclick();
 console.log('PASS: themed landscape settings for all 51 maps, stable scenery, no stale music backlog, audio resumes on unpause/interaction, saved sound preference');
}
`,env);
vm.runInContext(`
{
 selectTrack(4);if(terrainMesh.length!==36*36*2||terrainMesh.some(f=>f.points.some(p=>!Number.isFinite(p.x+p.y+p.z))))throw Error('terrain mesh invalid');
 const vertices=new Set(terrainMesh.flatMap(f=>f.points));if(vertices.size!==37*37)throw Error('terrain is disconnected');
 const tree=obstacles.find(o=>o.type==='tree');if(!tree)throw Error('missing solid tree');reset();state='racing';car.x=tree.x;car.z=tree.z;car.y=tree.y;car.v=50;updateObstacles();if(car.v>=50||runHits!==1||Math.hypot(car.x-tree.x,car.z-tree.z)<tree.radius+1.24)throw Error('tree collision');
 muted=false;initAudio();syncAudio();if(osc.frequency.value<100||osc.frequency.value>160)throw Error('engine outside speaker range');
 state='intro';confirmSound();syncAudio();if(soundNodes.cues.bus.gain.value<=0)throw Error('enable sound confirmation silent');state='paused';syncAudio();if(soundNodes.cues.bus.gain.value!==0)throw Error('confirmation leaks while paused');
 console.log('PASS: connected finite ground mesh, solid on-course trees, audible-range soft engine, enable-sound chime and pause silence');
}
`,env);
vm.runInContext(`
{
 Audio=class {constructor(src){this.src=src;this.paused=true;this.plays=0;this.pauses=0}play(){this.plays++;this.paused=false;return Promise.resolve()}pause(){this.paused=true;this.pauses++}};
 mediaMusic=null;muted=false;state='intro';syncMediaMusic(true);if(!mediaMusic.src.includes('home.wav')||mediaMusic.paused)throw Error('home audio file');const homePlayer=mediaMusic;syncMediaMusic();if(homePlayer.plays!==1)throw Error('restarted playing music');
 state='racing';syncMediaMusic();if(!homePlayer.paused||!mediaMusic.src.includes(selected+'.wav'))throw Error('map audio switching');state='paused';syncMediaMusic();if(!mediaMusic.paused)throw Error('file music leaks on pause');state='racing';muted=true;syncMediaMusic();if(!mediaMusic.paused)throw Error('file music leaks on mute');
 muted=false;mediaFailed=true;if(syncMediaMusic()!==false)throw Error('missing synthesizer fallback');
 $('soundtest').onclick();if(!soundTestPlayer.src.includes('sound-check.wav')||soundTestPlayer.paused)throw Error('independent sound check');soundTestPlayer.pause();mediaMusic.pause();mediaMusic=null;Audio=undefined;
 console.log('PASS: home/map audio-file playback, no restarts, pause/mute, synthesizer fallback, independent sound-test playback');
}
`,env);
vm.runInContext(`
{
 selectTrack(0);reset();state='racing';const f=fences.find(f=>Math.hypot(f.b.x-f.a.x,f.b.z-f.a.z)>1),mx=(f.a.x+f.b.x)/2,mz=(f.a.z+f.b.z)/2,len=Math.hypot(f.b.x-f.a.x,f.b.z-f.a.z),nx=-(f.b.z-f.a.z)/len,nz=(f.b.x-f.a.x)/len,y=(f.a.y+f.b.y)/2;
 for(const airborne of [false,true]){const start={x:mx+nx*4,z:mz+nz*4,y:y+.2};car={...car,x:mx-nx*4,z:mz-nz*4,y:y+.2,airborne,v:100,angle:0,motionAngle:Math.atan2(-nx,-nz)};collideTrackEdges(start);if((car.x-mx)*nx+(car.z-mz)*nz<1.64)throw Error('rail tunneling');}
 const start={x:mx+nx*4,z:mz+nz*4,y:y+8};car={...car,x:mx-nx*4,z:mz-nz*4,y:y+8,airborne:true};collideTrackEdges(start);if(Math.abs(car.x-(mx-nx*4))>.001)throw Error('high flight blocked');
 if(!roadsideMesh.length||roadsideMesh.some(face=>face.points.some(p=>!Number.isFinite(p.x+p.y+p.z))))throw Error('road shoulders missing');
 for(const face of roadsideMesh.filter((_,i)=>i%2===0)){const nearest=road.reduce((a,p)=>Math.hypot(p.x-face.points[0].x,p.z-face.points[0].z)<Math.hypot(a.x-face.points[0].x,a.z-face.points[0].z)?p:a);if(Math.abs(face.points[0].y-nearest.y)>.5)throw Error('detached shoulder');}
 console.log('PASS: swept grounded/low-airborne rail collisions, high flight clearance, attached roadside shoulders and finite scenery');
}
`,env);
vm.runInContext(`
{
 selectTrack(0);reset();state='racing';keys={};
 for(const direction of [-1,1]){car.angle=direction*3;cam.angle=car.angle;for(let i=0;i<400;i++){car.angle+=direction*.02;const before=cam.angle;updateCamera(.01);if(!Number.isFinite(cam.angle)||Math.abs(cam.angle-before)>.04)throw Error('camera hitch at half/full turn');}}
 const point={x:100,y:4,z:140};cam={x:0,y:12,z:0,angle:3.2};const projected=project(point);cam.angle+=Math.PI*2;const wrapped=project(point);if(Math.abs(projected.x-wrapped.x)>1e-6||Math.abs(projected.y-wrapped.y)>1e-6)throw Error('rotation projection discontinuity');
 let emitted=0;const originalTerrain=terrainPoly;terrainPoly=(points,color)=>{emitted++;originalTerrain(points,color)};for(const degrees of [179,180,181,359,360,361]){cam.angle=degrees*Math.PI/180;drawLandscape();}terrainPoly=originalTerrain;if(emitted>=landscapeFaces.length*6)throw Error('offscreen terrain never culled');
 for(const degrees of [179,180,181,359,360,361]){cam.angle=degrees*Math.PI/180;draw(0);}
 console.log('PASS: continuous camera across repeated left/right full turns, equivalent wrapped projections, offscreen terrain culling, render through 180/360 degrees');
}
`,env);
new Function(...Object.keys(env),chunks.join('\n'))(...Object.values(env));



// A refresh must create a completely new game scope with only browser storage shared.
{
 const source=fs.readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
 const storage=new Map(),browserStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))};
 const boot=(code,store=browserStorage)=>new Function(...Object.keys(env),source+'\n'+code)(...Object.values({...env,localStorage:store}));
 boot("selectTrack(7);state='racing';elapsed=42.125;finish();");
 let result=boot("return {selected,best,label:$('savedbest').textContent};");
 assert.equal(result.selected,7);assert.equal(result.best,42.125);assert(result.label.includes('00:42.125'));
 boot("state='racing';elapsed=50;finish();");assert.equal(boot('return best'),42.125);
 boot("state='racing';elapsed=40;finish();selectTrack(50);state='racing';elapsed=60;finish();");
 assert.equal(boot('return selected'),50);assert.equal(boot('return best'),60);
 assert.equal(boot('selectTrack(7);return best'),40);
 storage.set('apex-selected-track','999');assert.equal(boot('return selected'),0);
 storage.set('apex-kart-v7-0-best','Infinity');assert.equal(boot('return best'),0);
 storage.set('apex-sound-enabled','true');assert.equal(boot('return muted'),false);storage.set('apex-sound-enabled','false');assert.equal(boot('return muted'),true);
 const denied={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 assert(boot("state='racing';elapsed=15;finish();return $('record').textContent",denied).includes('SAVING UNAVAILABLE'));
 console.log('PASS: full refresh restores course and personal best, slower runs preserve records, improved/bonus records persist separately, invalid storage is rejected, blocked saving is visible');
}

for(const name of fs.readdirSync('dist/music')){const wav=fs.readFileSync('dist/music/'+name);assert.equal(wav.toString('ascii',0,4),'RIFF');assert(wav.length>100000);let peak=0;for(let i=44;i<wav.length;i+=2)peak=Math.max(peak,Math.abs(wav.readInt16LE(i)));assert(peak>1000&&peak<32767);}assert.equal(fs.readdirSync('dist/music').length,52);console.log('PASS: 52 playable PCM music assets with nonzero, unclipped samples');
