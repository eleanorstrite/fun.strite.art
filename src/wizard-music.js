import {createJumpMusic} from './platform-jump-music.js';
// Original bright major-key theme: chiming melody, warm chords and bouncing bass.
const MELODY=[
 74,78,81,86,83,81,78,81,79,83,86,88,86,83,79,78,
 76,79,83,88,86,83,81,79,78,81,86,90,88,86,81,78,
 74,78,81,78,83,86,90,86,88,86,83,81,79,78,76,79,
 78,81,86,88,90,88,86,83,81,79,78,76,78,81,86,81
];
const CHORDS=[[62,66,69],[67,71,74],[64,67,71],[62,66,69],[59,62,66],[67,71,74],[64,67,71],[69,73,76]];
export function createWizardMusic({AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext}={}){
 return createJumpMusic({AudioContext,melody:MELODY,chords:CHORDS,tempo:124,volume:.19});
}
