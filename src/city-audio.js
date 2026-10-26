// Short local synthesized pet calls, with browser speech for the house owner.
export function createCityAudio({Context=globalThis.AudioContext||globalThis.webkitAudioContext,speech=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance}={}){
  let context,muted=false,cue=null,elapsed=0,speaking=false,destroyed=false;const voices=new Set();
  function unlock(){if(destroyed||muted||!Context)return;try{context??=new Context();context.resume?.()?.catch?.(()=>{});}catch{}}
  function stop(){for(const voice of voices){try{voice.stop();voice.disconnect();}catch{}}voices.clear();if(speaking){speech?.cancel();speaking=false;}cue=null;elapsed=0;}
  function sound(kind){if(kind==='owner'&&speech&&Utterance){if(!speaking){const utterance=new Utterance('Hey, get out of the bed!');utterance.rate=1.05;utterance.onend=utterance.onerror=()=>{speaking=false;};speaking=true;speech.speak(utterance);}return;}
    if(!context||context.state==='suspended')return;
    const start=context.currentTime;
    if(kind==='dog'&&context.createBuffer&&context.createBufferSource){
      for(let i=0;i<2;i++){const buffer=context.createBuffer(1,Math.floor(context.sampleRate*.16),context.sampleRate),data=buffer.getChannelData(0);for(let j=0;j<data.length;j++)data[j]=(Math.random()*2-1)*Math.exp(-j/data.length*4);
        const source=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=1100;gain.gain.value=.14;source.connect(filter);filter.connect(gain);gain.connect(context.destination);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(start+i*.22);source.stop(start+i*.22+.17);
      }
    }

    for(let i=0;i<(kind==='dog'?2:1);i++){const oscillator=context.createOscillator(),gain=context.createGain(),at=start+i*.22,duration=kind==='cat'?.65:.16;
      oscillator.type=kind==='cat'?'triangle':'sawtooth';oscillator.frequency.setValueAtTime(kind==='cat'?620:170,at);oscillator.frequency.exponentialRampToValueAtTime(kind==='cat'?850:95,at+duration*.4);oscillator.frequency.exponentialRampToValueAtTime(kind==='cat'?420:70,at+duration);
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.055,at+.025);gain.gain.exponentialRampToValueAtTime(.001,at+duration);oscillator.connect(gain);gain.connect(context.destination);voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(at);oscillator.stop(at+duration+.02);
    }
  }
  return {unlock,stop,tick(dt,next){if(destroyed||muted||!next){if(cue)stop();return;}if(next!==cue){stop();cue=next;elapsed=4;}elapsed+=dt;if(elapsed>=3){elapsed=0;sound(cue);}},setMuted(value){muted=value;if(value)stop();else unlock();},destroy(){stop();destroyed=true;context?.close?.()?.catch?.(()=>{});}};
}
