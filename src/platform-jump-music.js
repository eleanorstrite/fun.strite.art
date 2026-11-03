// An original, looping major-key tune: bell melody, soft chords and bouncing bass.
const MELODY=[72,76,79,76,81,79,76,74,72,76,79,84,83,79,76,74,69,72,77,81,79,77,76,72,71,74,79,83,81,79,74,71];
const CHORDS=[[60,64,67],[60,64,67],[57,60,65],[59,62,67]];
export function createJumpMusic({AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext,melody=MELODY,chords=CHORDS,tempo=116,volume=.23}={}){
 let context=null,master=null,muted=false,active=false,destroyed=false,step=0,next=0;const voices=new Set(),effects=new Set();
 function silence(pool=voices){for(const voice of pool){try{voice.stop();}catch{}}pool.clear();}
 function unlock(){if(destroyed||!AudioContext)return;try{if(!context){context=new AudioContext();master=context.createGain();master.gain.value=volume;master.connect(context.destination);}if(context.state==='suspended')context.resume().catch(()=>{});}catch{}}
 function note(midi,at,length,volume,type='sine',pool=voices){
  const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=type;oscillator.frequency.value=440*2**((midi-69)/12);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+length);oscillator.connect(gain);gain.connect(master);pool.add(oscillator);oscillator.onended=()=>{pool.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(at);oscillator.stop(at+length+.02);
 }
 function coin(){
  if(destroyed||muted||!context||context.state!=='running')return;
  const at=context.currentTime;
  // Quiet bell with a soft attack and a short, fading upper harmonic.
  note(88,at,.48,.18,'sine',effects);note(100,at,.26,.035,'sine',effects);
 }
 function update(playing){if(destroyed)return;if(!playing||muted){if(active)silence();active=false;return;}if(!context||context.state!=='running')return;if(!active){active=true;next=context.currentTime+.03;step=0;}if(next<context.currentTime)next=context.currentTime+.03;
  while(next<context.currentTime+.16){const chord=chords[Math.floor(step/8)%chords.length];note(melody[step%melody.length],next,.32,.26,'triangle');note(melody[step%melody.length]+12,next,.18,.035);if(step%2===0)note(chord[step%4===0?0:2]-12,next,.32,.22);if(step%4===0)for(const pitch of chord)note(pitch,next,.6,.055);next+=60/tempo/2;step++;}
 }
 return {unlock,update,coin,setMuted(value){muted=Boolean(value);if(muted){silence();silence(effects);active=false;}else unlock();},destroy(){destroyed=true;silence();silence(effects);if(context){context.close().catch(()=>{});context=null;}active=false;}};
}
