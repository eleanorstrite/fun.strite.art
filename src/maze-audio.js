// Original procedural mouth sounds: crunchy, game-like bites and wet tongue strokes.
// These are generated samples, not recordings or assets from another game.
export function makeIceMouthSound(name,sampleRate){
  const chew=name==='iceChew',duration=chew?.48:.32;
  const samples=new Float32Array(Math.ceil(sampleRate*duration));
  let seed=chew?7123:9811,low=0,phase=0;
  for(let i=0;i<samples.length;i++){
    const t=i/sampleRate;
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const noise=seed/2147483648-1;
    if(chew){
      // Four irregular crackles with a little low mouth-body beneath the crunch.
      const pulse=Math.floor(t/.115),local=t-pulse*.115;
      const envelope=Math.min(1,local/.003)*Math.exp(-local*(pulse%2?45:32))*Math.max(0,Math.min(1,(.46-t)/.04));
      low+=.22*(noise-low);
      const crackle=Math.round((noise-low)*10)/10;
      samples[i]=envelope*(.38*crackle+.16*low+.06*Math.sin(2*Math.PI*155*t));
    }else{
      // A short suction sweep, soft wet friction, then a rounded tongue smack.
      const progress=t/duration;
      const envelope=Math.sin(Math.PI*progress)**1.3;
      const frequency=170+330*Math.sin(Math.PI*progress);
      phase+=2*Math.PI*frequency/sampleRate;
      low+=(.06+.12*Math.sin(Math.PI*progress))*(noise-low);
      const smack=Math.exp(-(((t-.245)/.013)**2));
      samples[i]=envelope*(.18*Math.sin(phase)+.055*Math.sin(phase*2)+.55*low)+smack*.14*noise;
    }
  }
  return samples;
}
// Small synthesized arcade cues; no downloads or audio files required.
export function createMazeAudio(Context = globalThis.AudioContext || globalThis.webkitAudioContext) {
  let context = null, muted = false, disposed = false, speech = null;
  const voices = new Set(), mouthBuffers = new Map();
  function unlock() {
    if (disposed || !Context) return;
    try {
      context ||= new Context();
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch { /* Audio is optional when unsupported or blocked. */ }
  }
  function stop() {
    if(speech){globalThis.speechSynthesis?.cancel();speech=null;}
    for (const voice of voices) { try { voice.stop(); } catch {} }
    voices.clear();
  }
  const cues = {
    pumpkinScoop: [[130, 65, .08], [80, 220, .07], [170, 55, .1], [95, 45, .08]],
    pumpkinCarve: [[210, 90, .045], [150, 65, .045]],
    pumpkinScrape: [[140, 55, .06], [110, 45, .06]],
    pumpkinSnip: [[640, 180, .04], [190, 70, .07]],
    pumpkinPick: [[420, 620, .045]],
    pumpkinUndo: [[380, 190, .09]],
    pumpkinReady: [[440, 660, .1], [660, 880, .16]],

    thunder: [[70, 35, .4], [55, 25, .5]],
    cackle: [[320, 620, .12], [500, 280, .16], [340, 680, .12], [540, 260, .18], [300, 560, .14], [440, 190, .3]],
    flap: [[380, 760, .055], [680, 460, .045]],
    chirp: [[1100, 1800, .035], [1500, 950, .04]],
    whoosh: [[180, 420, .07], [360, 190, .055]],
    jet: [[90, 260, .07], [210, 480, .06]],
    flightCoin: [[880, 880, .05], [1320, 1760, .12]],
    crash: [[150, 45, .14], [620, 180, .18], [260, 90, .22]],
    bounce: [[180, 480, .1], [420, 140, .16]],
    flightEnd: [[392, 392, .12], [330, 330, .12], [262, 196, .28]],
    portal: [[260, 780, .12], [1040, 520, .16]],
    gem: [[880, 1100, .06]],
    sword: [[440, 660, .12], [660, 880, .12], [880, 1320, .2]],
    dragon: [[180, 70, .16], [330, 660, .12], [660, 990, .22]],
    iceChew: [[220, 75, .07], [130, 55, .09], [240, 90, .065], [100, 48, .12]],
    iceSlurp: [[180, 410, .08], [410, 140, .11], [100, 60, .06]],
    gulp: [[160, 65, .18], [95, 210, .16], [120, 45, .3]],
    eaten: [[480, 320, .2], [320, 220, .2], [220, 140, .25], [140, 45, .55]],
    win: [[523, 523, .12], [659, 659, .12], [784, 784, .12], [1047, 1047, .4]],
  };
  return {
    unlock, stop,
    sayWin() { this.say('You win!',1.15); },
    sayLose() { this.say('You lose.',.65); },
    say(text,pitch) {
      if(muted || disposed || !globalThis.speechSynthesis || !globalThis.SpeechSynthesisUtterance)return;
      try {
        speech=new globalThis.SpeechSynthesisUtterance(text);
        speech.rate=.9;speech.pitch=pitch;speech.volume=.8;
        speech.onend=speech.onerror=()=>{speech=null;};
        globalThis.speechSynthesis.speak(speech);
      } catch { speech=null; }
    },
    play(name) {
      if (muted || disposed || !context || context.state !== 'running' || !cues[name]) return;
      if((name==='iceChew'||name==='iceSlurp')&&context.createBuffer&&context.createBufferSource){
        if(!mouthBuffers.has(name)){
          const samples=makeIceMouthSound(name,context.sampleRate);
          const buffer=context.createBuffer(1,samples.length,context.sampleRate);
          buffer.getChannelData(0).set(samples);mouthBuffers.set(name,buffer);
        }
        const source=context.createBufferSource(),gain=context.createGain();
        source.buffer=mouthBuffers.get(name);gain.gain.setValueAtTime(.7,context.currentTime);
        source.connect(gain);gain.connect(context.destination);voices.add(source);
        source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};
        source.start(context.currentTime);return;
      }
      if (name === 'eaten' || name === 'crash') stop();
      let at = context.currentTime;
      for (const [from, to, duration] of cues[name]) {
        const oscillator = context.createOscillator(), gain = context.createGain();
        oscillator.type = ['eaten','crash','jet','pumpkinCarve','pumpkinScrape'].includes(name) ? 'sawtooth' : 'triangle';
        oscillator.frequency.setValueAtTime(from, at);
        oscillator.frequency.exponentialRampToValueAtTime(to, at + duration);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(.07, at + .008);
        gain.gain.exponentialRampToValueAtTime(.001, at + duration);
        oscillator.connect(gain); gain.connect(context.destination);
        voices.add(oscillator);
        oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at); oscillator.stop(at + duration + .01);
        at += duration;
      }
    },
    setMuted(value) { muted = value; if (muted) stop(); else unlock(); },
    destroy() { disposed = true; stop(); if (context && context.state !== 'closed') context.close().catch(() => {}); },
  };
}
