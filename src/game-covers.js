import {drawGamePresentation,gamePresentationReady} from './game-presentation.js';
export const GAME_COVERS={
 'platform-jump':{name:'Platform Jump',file:'platform-jump.jpg'},
 'animal-sports':{name:'Animal Sports',file:'animal-sports.jpg'},
 'dragon-memory':{name:'Dragon Memory',file:'dragon-memory.jpg'},
 'city-builder':{name:'City Builder',file:'city-builder.jpg'},
 'storm-stack':{name:'Wizard Tetris',file:'storm-stack.jpg'},
 'burger-stack':{name:'Stack the Hamburger',file:'burger-stack.jpg'},
 tag:{name:'Tag',file:'tag.jpg'},
 'family-van':{name:'The Raven',file:'family-van.jpg'},
 'knight-ember':{name:'Knights and Dragons',file:'knight-ember.jpg'},
 'sky-flight':{name:'Flappy Animals',file:'sky-flight.jpg'},
 'hoop-flight':{name:'Hoop Flight',file:'hoop-flight.jpg'},
 'ice-cream':{name:'Make Your Own Ice Cream',file:'ice-cream.jpg'},
 'carve-pumpkin':{name:'Carve the Pumpkin',file:'carve-pumpkin.jpg'}
};
const artwork=new Map();
export function gameCoverImage(id){const cover=GAME_COVERS[id];if(!cover||typeof Image==='undefined')return null;if(!artwork.has(id)){const image=new Image();image.decoding='async';image.src=new URL('../assets/game-covers/'+cover.file,import.meta.url).href;artwork.set(id,image);}return artwork.get(id);}
const previews=new Map();let frame=0,lastPaint=0;
function paintPresentation(canvas,entry,time=0){const c=canvas.getContext('2d');if(c)drawGamePresentation(c,entry.id,entry.character,time);}
function animatePreviews(now){frame=0;const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 for(const[canvas]of previews)if(canvas.isConnected===false)previews.delete(canvas);
 if(!globalThis.document?.hidden&&now-lastPaint>=100){lastPaint=now;for(const[canvas,entry]of previews){const rect=canvas.getBoundingClientRect?.();if(entry.ready&&(!rect||rect.bottom>0&&rect.top<(globalThis.innerHeight||1000)))paintPresentation(canvas,entry,reduced?0:now/1000);}}
 if(previews.size&&!reduced)frame=requestAnimationFrame(animatePreviews);
}
export function drawGameCover(canvas,id,character={}){
 const image=gameCoverImage(id),c=canvas.getContext('2d');if(!image||!c)return false;
 canvas.width=960;canvas.height=540;canvas.parentElement?.classList.add('library-cover');
 c.fillStyle='#252b43';c.fillRect(0,0,960,540);
 const entry={id,character:{...character},ready:false};
 const paint=()=>{if(canvas.isConnected===false)return;if(entry.ready)paintPresentation(canvas,entry);else if(image.complete&&image.naturalWidth)c.drawImage(image,0,0,960,540);};
 if(image.complete)paint();else image.addEventListener('load',paint,{once:true});
 if(typeof c.save==='function'&&typeof globalThis.requestAnimationFrame==='function'&&globalThis.document){previews.set(canvas,entry);gamePresentationReady().then(()=>{if(canvas.isConnected===false){previews.delete(canvas);return;}entry.ready=true;paintPresentation(canvas,entry);if(!frame)frame=requestAnimationFrame(animatePreviews);});}
 return true;
}
