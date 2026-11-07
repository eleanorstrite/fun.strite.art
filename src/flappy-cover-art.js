import {drawFlyer} from './sky-flight.js';
import {FLIGHT_DEFAULTS} from './flight-settings.js';
import {playAtlas} from './play-art.js';
export const FLAPPY_COVER_ANIMALS=[
 {animal:'eagle',x:153,y:229,size:132},
 {animal:'hummingbird',x:810,y:220,size:125},
 {animal:'dragon',x:700,y:320,size:164},
 {animal:'duck',x:150,y:385,size:145},
 {animal:'bluebird',x:445,y:330,size:240},
 {animal:'cat',x:292,y:457,size:119},
 {animal:'capybara',x:590,y:454,size:134},
 {animal:'dog',x:823,y:431,size:145}
];
let background;
function coverBackground(){if(!background&&typeof Image!=='undefined'){background=new Image();background.src=new URL('../assets/game-covers/sky-flight-background.jpg',import.meta.url).href;}return background;}
export async function flappyCoverReady(){await Promise.all([coverBackground(),playAtlas('objects'),playAtlas('details'),playAtlas('flyers-detailed')].filter(Boolean).map(im=>im.decode?.().catch(()=>{})));}
// Compose the homepage picture from the exact same creatures as the playable game.
export function drawFlappyCover(c,width=960,height=540,time=0){
 c.save();c.scale(width/960,height/540);const bg=coverBackground();c.fillStyle='#65bfdd';c.fillRect(0,0,960,540);if(bg?.complete&&bg.naturalWidth)c.drawImage(bg,0,0,960,540);
 for(const [i,look]of FLAPPY_COVER_ANIMALS.entries()){c.save();c.shadowColor='#153a5155';c.shadowBlur=10;c.shadowOffsetY=5;drawFlyer(c,look.x,look.y+Math.sin(time*2+i)*4,look.size,{...FLIGHT_DEFAULTS,animal:look.animal},time,Math.sin(time*1.4+i)*.035);c.restore();}c.restore();
}
