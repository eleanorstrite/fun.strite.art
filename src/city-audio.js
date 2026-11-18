// Real local pet recordings; synthesized notes are reserved for magic powers.
export const CITY_PET_CALLS={dog:new URL('../assets/audio/city-dog-bark.wav',import.meta.url).href,cat:new URL('../assets/audio/city-cat-meow.wav',import.meta.url).href};
export function createCityAudio({Context=globalThis.AudioContext||globalThis.webkitAudioContext,speech=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance,fetchAudio=globalThis.fetch}={}){
  let context,muted=false,cue=null,elapsed=0,speaking=false,destroyed=false;const voices=new Set(),buffers=new Map();let loading=null,pendingPet=null,playGeneration=0;
  function unlock(){if(destroyed||muted||!Context)return;try{context??=new Context();context.resume?.()?.catch?.(()=>{});loadPets();}catch{}}
  function stop(){playGeneration++;pendingPet=null;for(const voice of voices){try{voice.stop();voice.disconnect();}catch{}}voices.clear();if(speaking){speech?.cancel();speaking=false;}cue=null;elapsed=0;}
  function sound(kind){if(kind==='owner'&&speech&&Utterance){if(!speaking){const utterance=new Utterance('Hey, get out of the bed!');utterance.rate=1.05;utterance.onend=utterance.onerror=()=>{speaking=false;};speaking=true;speech.speak(utterance);}return;}
    if(kind==='dog'||kind==='cat')playPet(kind);
  }
  function loadPets(){
    if(loading)return loading;
    if(!context?.decodeAudioData||!fetchAudio)return Promise.resolve();
    loading=Promise.all(Object.entries(CITY_PET_CALLS).map(async([kind,url])=>{try{const response=await fetchAudio(url);if(!response.ok)throw new Error('Pet recording unavailable');const buffer=await context.decodeAudioData(await response.arrayBuffer());if(!destroyed)buffers.set(kind,buffer);}catch{}}));return loading;
  }
  function playPet(kind){
    if(!context||context.state==='suspended'||muted||destroyed)return;
    const buffer=buffers.get(kind);
    if(!buffer){if(pendingPet===kind)return;pendingPet=kind;const generation=playGeneration;loadPets().then(()=>{if(generation!==playGeneration)return;pendingPet=null;if(cue===kind&&buffers.has(kind))playPet(kind);});return;}
    const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=.55;source.connect(gain);gain.connect(context.destination);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};source.start();
  }

  function magic(kind){
    if(destroyed||muted)return;unlock();if(!context||context.state==='suspended')return;
    const notes={shapeshift:[262,392,622,784,1245],flight:[392,587,784,1175,1568],speed:[330,440,660,880,1320],flowers:[523,659,784,1047,1319],bloom:[784,1175]}[kind];if(!notes)return;
    for(const [i,hz] of notes.entries()){const oscillator=context.createOscillator(),gain=context.createGain(),at=context.currentTime+i*.1;oscillator.type=kind==='flight'?'sine':'triangle';oscillator.frequency.setValueAtTime(hz,at);oscillator.frequency.exponentialRampToValueAtTime(hz*1.025,at+.55);gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(kind==='bloom'?.025:.045,at+.025);gain.gain.exponentialRampToValueAtTime(.001,at+.6);oscillator.connect(gain);gain.connect(context.destination);voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(at);oscillator.stop(at+.65);}
  }
  function cheer(){if(destroyed||muted)return;magic('flowers');if(speech&&Utterance){const line=new Utterance('Hooray! You saved the town!');line.rate=.95;line.pitch=1.1;speaking=true;line.onend=line.onerror=()=>{speaking=false;};speech.speak(line);}}
  function tryAgain(){if(destroyed||muted)return;stop();if(speech&&Utterance){const line=new Utterance('Try again.');line.rate=.85;line.pitch=.85;speaking=true;line.onend=line.onerror=()=>{speaking=false;};speech.speak(line);}}
  return {unlock,stop,magic,cheer,tryAgain,get ready(){return loadPets();},tick(dt,next){if(destroyed||muted||!next){if(cue)stop();return;}if(next!==cue){stop();cue=next;elapsed=4;}elapsed+=dt;if(elapsed>=3){elapsed=0;sound(cue);}},setMuted(value){muted=value;if(value)stop();else unlock();},destroy(){stop();destroyed=true;context?.close?.()?.catch?.(()=>{});}};
}
