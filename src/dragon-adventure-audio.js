// Original creature effects. The requested music uses its official embedded player.
export function createDragonAdventureAudio(Context=globalThis.AudioContext||globalThis.webkitAudioContext){
 let context,muted=false,disposed=false;const voices=new Set();
 function unlock(){if(disposed||!Context)return;try{context??=new Context();context.resume?.().catch(()=>{});}catch{}}
 function stop(){for(const voice of voices)try{voice.stop();}catch{}voices.clear();}
 function roar(small=false){if(muted||disposed||!context||context.state!=='running')return;const length=small?.65:1.8,buffer=context.createBuffer(1,Math.ceil(context.sampleRate*length),context.sampleRate),data=buffer.getChannelData(0);let low=0,phase=0,seed=731;
  for(let i=0;i<data.length;i++){const t=i/context.sampleRate,progress=t/length;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;low+=.08*(noise-low);phase+=2*Math.PI*(small?180:58)*(1-progress*.45)/context.sampleRate;data[i]=(low*.75+Math.sin(phase)*.13+Math.sin(phase*1.93)*.08)*Math.sin(Math.PI*progress)**.8*(.8+.2*Math.sin(t*32));}
  const source=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=small?1700:850;gain.gain.value=.45;source.connect(filter);filter.connect(gain);gain.connect(context.destination);voices.add(source);source.onended=()=>voices.delete(source);source.start();
 }
 return {unlock,roar,stop,setMuted(value){muted=!!value;if(muted)stop();},destroy(){disposed=true;stop();context?.close?.().catch(()=>{});}};
}
