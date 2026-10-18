const fs=require('fs');
const html=fs.readFileSync('dist/index.html','utf8');const code=html.slice(html.indexOf('function musicProfile('),html.indexOf('function createMusic('));const profile=new Function(code+';return musicProfile')();
const rate=16000;
for(let id=-1;id<51;id++){
 const p=profile(id),beat=60/p.tempo/2,length=Math.ceil(32*beat*rate),samples=new Float64Array(length);
 const note=(degree,octave)=>p.root+p.scale[((degree%7)+7)%7]+Math.floor(degree/7)*12+octave*12;
 const tone=(midi,start,duration,level)=>{const frequency=440*2**((midi-69)/12),a=Math.round(start*rate),n=Math.floor(duration*rate);for(let j=0;j<n;j++){const age=j/rate,envelope=Math.min(1,age/.025)*Math.exp(-age/(duration*.3))*Math.min(1,(duration-age)/.05),index=(a+j)%length;samples[index]+=Math.sin(2*Math.PI*frequency*age)*envelope*level;}};
 for(let step=0;step<32;step++){const chord=p.chords[Math.floor(step/8)],at=step*beat,degree=p.melody[step];if(step%4===0)tone(note(chord,-1),at,beat*3.6,.13);if(degree>=0)tone(note(chord+degree,1),at,beat*.9,.16);if(step%2===0)tone(note(chord+[0,2,4,2][Math.floor(step/2)%4],0),at,beat*1.7,.06);if(step%8===0)tone(note(chord+2,0),at,beat*7.5,.07);}
 const wav=Buffer.alloc(44+length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(length*2,40);for(let i=0;i<length;i++)wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),44+i*2);fs.writeFileSync('dist/music/'+(id<0?'home':id)+'.wav',wav);
}
console.log('Built 52 looping music tracks');
