// An original, looping major-key tune: bell melody, soft chords and bouncing bass.
const MELODY=[72,76,79,76,81,79,76,74,72,76,79,84,83,79,76,74,69,72,77,81,79,77,76,72,71,74,79,83,81,79,74,71];
const CHORDS=[[60,64,67],[60,64,67],[57,60,65],[59,62,67]];
export function createJumpMusic({AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext}={}){
 let context=null,master=null,muted=false,active=false,destroyed=false,step=0,next=0;const voices=new Set();
 function silence(){for(const voice of voices){try{voice.stop();}catch{}}voices.clear();}
 function unlock(){if(destroyed||!AudioContext)return;try{if(!context){context=new AudioContext();master=context.createGain();master.gain.value=.23;master.connect(context.destination);}if(context.state==='suspended')context.resume().catch(()=>{});}catch{}}
 function note(midi,at,length,volume,type='sine'){
  const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=type;oscillator.frequency.value=440*2**((midi-69)/12);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+length);oscillator.connect(gain);gain.connect(master);voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(at);oscillator.stop(at+length+.02);
 }
 function update(playing){if(destroyed)return;if(!playing||muted){if(active)silence();active=false;return;}if(!context||context.state!=='running')return;if(!active){active=true;next=context.currentTime+.03;step=0;}if(next<context.currentTime)next=context.currentTime+.03;
  while(next<context.currentTime+.16){const chord=CHORDS[Math.floor(step/8)%4];note(MELODY[step%32],next,.32,.26,'triangle');note(MELODY[step%32]+12,next,.18,.035);if(step%2===0)note(chord[step%4===0?0:2]-12,next,.32,.22);if(step%4===0)for(const pitch of chord)note(pitch,next,.6,.055);next+=60/116/2;step++;}
 }
 return {unlock,update,setMuted(value){muted=Boolean(value);if(muted){silence();active=false;}else unlock();},destroy(){destroyed=true;silence();if(context){context.close().catch(()=>{});context=null;}active=false;}};
}
