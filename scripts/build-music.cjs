const fs=require('fs');const html=fs.readFileSync('dist/index.html','utf8');const code=html.slice(html.indexOf('function musicProfile('),html.indexOf('// Regular audio-file'));const profile=new Function(code+';return musicProfile')();
// Different arrangements, instruments, scales and drum patterns for each environment.
const styles=[
 ['Salt surf rock',116,'guitar','pick', 'rock',[0,2,4,5,7,9,11]],
 ['Desert caravan',98,'oud','round','hand',[0,1,4,5,7,8,11]],
 ['Canyon garage rock',132,'electric','pick','rock',[0,2,3,5,7,8,10]],
 ['Glacier ambient bells',76,'bell','soft','light',[0,2,4,7,9,11,12]],
 ['Juniper folk',108,'guitar','round','folk',[0,2,4,5,7,9,11]],
 ['Crystal dreamscape',84,'glass','soft','light',[0,2,3,5,7,9,10]],
 ['Harbor jazz',104,'epiano','round','swing',[0,2,3,5,7,9,10]],
 ['Garden marimba waltz',114,'marimba','soft','waltz',[0,2,4,5,7,9,11]],
 ['Volcanic industrial rock',142,'electric','growl','heavy',[0,1,3,5,6,8,10]],
 ['Cloud house',124,'organ','synth','house',[0,2,4,5,7,9,11]],
 ['Orchard bluegrass',138,'banjo','pick','folk',[0,2,4,5,7,9,11]],
 ['Oasis hand drums',92,'oud','round','hand',[0,1,4,5,7,8,10]],
 ['Moon space ambient',70,'pad','soft','space',[0,2,3,5,7,8,10]],
 ['Foundry techno',136,'pulse','growl','techno',[0,2,3,5,6,8,10]],
 ['Alpine orchestral',102,'horn','round','march',[0,2,4,5,7,9,11]],
 ['Neon synthwave',110,'synth','synth','electro',[0,2,3,5,7,8,10]],
 ['Coastal chillhop',88,'epiano','round','swing',[0,2,4,5,7,9,11]]
];
const rate=16000,manifest=[];
for(let id=-1;id<52;id++){
 const p=profile(id),variant=id<0?0:Math.floor(id/17),style=id<0?['Home lounge',80,'epiano','soft','swing',[0,2,4,5,7,9,11]]:id===51?['Practice groove',100,'marimba','round','swing',[0,2,4,5,7,9,11]]:id===50?['Stunt breakbeat',160,'pulse','growl','break',[0,2,3,5,7,8,10]]:styles[id%17];
 const [name,bpm,lead,bass,groove,scale]=style,tempo=bpm+variant*3,beat=60/tempo/2,steps=64,length=Math.ceil(steps*beat*rate),samples=new Float64Array(length);let seed=12345+(id+1)*7919;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1};
 const degree=(n,octave=0)=>p.root+scale[((n%7)+7)%7]+Math.floor(n/7)*12+octave*12;
 function tone(midi,start,duration,level,instrument){const f=440*2**((midi-69)/12),a=Math.round(start*rate),n=Math.floor(duration*rate);for(let j=0;j<n;j++){const t=j/rate,phase=2*Math.PI*f*t,release=Math.min(1,(duration-t)/.04);let wave,envelope;
  if(instrument==='bell'||instrument==='glass'){wave=Math.sin(phase+Math.sin(phase*2.71)*Math.exp(-t*5)*2)+Math.sin(phase*2.01)*.22;envelope=Math.min(1,t/.005)*Math.exp(-t*(instrument==='bell'?3:1.8));}
  else if(['guitar','banjo','oud','marimba'].includes(instrument)){const bright=instrument==='banjo'?.6:instrument==='oud'?.4:.22;wave=Math.sin(phase)+Math.sin(phase*2)*bright+Math.sin(phase*3)*bright*.4;envelope=(1-Math.exp(-t*900))*Math.exp(-t*(instrument==='marimba'?10:instrument==='banjo'?13:6));}
  else if(instrument==='electric'){wave=Math.tanh((Math.sin(phase)+Math.sin(phase*2)*.4)*2)*.6;envelope=Math.min(1,t/.009)*Math.exp(-t*2);}
  else if(['pulse','synth','horn','organ','growl','pick'].includes(instrument)){wave=Math.sin(phase)+Math.sin(phase*2)*.25+Math.sin(phase*3)*.18+Math.sin(phase*4)*.08;if(instrument==='synth')wave+=Math.sin(phase*1.004)*.3;envelope=Math.min(1,t/(instrument==='horn'?.06:.012))*Math.exp(-t*(instrument==='pick'?7:2.5));}
  else if(instrument==='epiano'){wave=Math.sin(phase+Math.sin(phase*2)*.7*Math.exp(-t*5))+.12*Math.sin(phase*3);envelope=Math.min(1,t/.008)*Math.exp(-t*3);}
  else {wave=Math.sin(phase)+Math.sin(phase*1.003)*.22;envelope=Math.min(1,t/(instrument==='pad'?.15:.015))*Math.exp(-t*(instrument==='pad'?.4:3));}
  samples[(a+j)%length]+=wave*envelope*release*level;
 }}
 function drum(kind,start,level){const duration=kind==='hat'?.045:kind==='kick'?.22:.15,a=Math.round(start*rate);let phase=0;for(let j=0;j<duration*rate;j++){const t=j/rate;phase+=2*Math.PI*(kind==='kick'?48+110*Math.exp(-t*35):170)/rate;const wave=kind==='kick'?Math.sin(phase):kind==='hand'?Math.sin(phase)*.65+noise()*.2:noise();samples[(a+j)%length]+=wave*Math.exp(-t*(kind==='hat'?75:kind==='kick'?18:30))*level;}}
 const motifs=[[0,2,4,2,1,3,5,4],[0,0,2,4,3,2,1,0],[4,3,2,0,2,1,0,-1],[0,3,2,5,4,2,1,2]],motif=motifs[(id+1)%4],progressions=[[0,3,5,4],[0,5,3,4],[0,2,5,3]],chords=progressions[(variant+id+4)%3];
 for(let step=0;step<steps;step++){
  const bar=Math.floor(step/8),chord=chords[bar%4],s=step%8,swing=groove==='swing'&&step%2?beat*.22:0,at=step*beat+swing;
  const sparse=['light','space'].includes(groove),melodyOn=sparse?step%4===0:groove==='waltz'?step%2===0:step%2===0||(s===3||s===7)&&bar%2===1;
  if(melodyOn){const d=motif[(Math.floor(step/2)+variant)%8]+chord+(bar>=4&&s===6?2:0);tone(degree(d,1),at,beat*(sparse?4:1.7),.16,lead);}
  if(step%4===0||['house','techno','break'].includes(groove)&&step%2===0)tone(degree(chord+(s>=4?4:0),-1),at,beat*2.9,.16,bass);
  if(step%8===0)for(const d of [0,2,4])tone(degree(chord+d),at,beat*7.8,.028,groove==='space'?'pad':lead==='horn'?'horn':'soft');
  if(groove==='space'){if(s===0&&bar%2===0)drum('hand',at,.08);}
  else if(['house','techno'].includes(groove)){if(step%2===0)drum('kick',at,.23);else drum('hat',at,.065);if(s===2||s===6)drum('snare',at,.085);}
  else if(groove==='hand'){if([0,3,4,6].includes(s))drum('hand',at,.2);if(s%2)drum('hat',at,.025);}
  else if(groove==='waltz'){if(step%6===0)drum('kick',at,.16);if(step%6===2||step%6===4)drum('hand',at,.10);}
  else if(groove==='light'){if(s===0)drum('hand',at,.06);}
  else {if(s===0||s===4||groove==='break'&&s===3)drum('kick',at,groove==='heavy'?.28:.18);if(s===2||s===6)drum('snare',at,groove==='heavy'?.18:.09);if(step%2===1||groove==='break')drum('hat',at,.035);}
 }
 let peak=0;for(const sample of samples)peak=Math.max(peak,Math.abs(sample));const normalize=Math.min(1,.85/peak),wav=Buffer.alloc(44+length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(length*2,40);for(let i=0;i<length;i++)wav.writeInt16LE(Math.round(samples[i]*normalize*32767),44+i*2);const key=id<0?'home':String(id);fs.writeFileSync('dist/music/'+key+'.wav',wav);manifest.push({key,style:name,tempo,lead,bass,groove,duration:length/rate});
}
fs.writeFileSync('dist/music/styles.json',JSON.stringify(manifest,null,2));console.log('Built 53 distinct arrangements with varied instruments, percussion and moods');
