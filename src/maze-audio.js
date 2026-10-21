// Small synthesized arcade cues; no downloads or audio files required.
export function createMazeAudio(Context = globalThis.AudioContext || globalThis.webkitAudioContext) {
  let context = null, muted = false, disposed = false, speech = null;
  const voices = new Set();
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
      if (name === 'eaten' || name === 'crash') stop();
      let at = context.currentTime;
      for (const [from, to, duration] of cues[name]) {
        const oscillator = context.createOscillator(), gain = context.createGain();
        oscillator.type = ['eaten','crash','jet'].includes(name) ? 'sawtooth' : 'triangle';
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
