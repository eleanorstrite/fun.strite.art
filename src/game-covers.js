export const GAME_COVERS={
 'dragon-adventures':{name:'Dragon Adventures',file:'dragon-adventures.jpg'},
 'platform-jump':{name:'Platform Jump',file:'platform-jump.jpg'},
 'animal-sports':{name:'Animal Sports',file:'animal-sports.jpg'},
 'dragon-memory':{name:'Dragon Memory',file:'dragon-memory.jpg'},
 'city-builder':{name:'City Builder',file:'city-builder.jpg'},
 'storm-stack':{name:'Wizard Tetris',file:'storm-stack.jpg'},
 'burger-stack':{name:'Stack the Hamburger',file:'burger-stack.jpg'},
 tag:{name:'Tag',file:'tag.jpg'},
 'family-van':{name:'The Raven',file:'family-van.jpg'},
 'knight-ember':{name:'Knights and Dragons',file:'knight-ember.jpg'},
 'sky-flight':{name:'Flappy Animals',file:'sky-flight-animals.jpg'},
 'hoop-flight':{name:'Hoop Flight',file:'hoop-flight.jpg'},
 'ice-cream':{name:'Make Your Own Ice Cream',file:'ice-cream.jpg'},
 'carve-pumpkin':{name:'Carve the Pumpkin',file:'carve-pumpkin.jpg'}
};
const artwork=new Map();
export function gameCoverImage(id){const cover=GAME_COVERS[id];if(!cover||typeof Image==='undefined')return null;if(!artwork.has(id)){const image=new Image();image.decoding='async';image.src=new URL('../assets/game-covers/'+cover.file,import.meta.url).href;artwork.set(id,image);}return artwork.get(id);}
export function drawGameCover(canvas,id){
 const image=gameCoverImage(id),c=canvas.getContext('2d');if(!image||!c)return false;
 canvas.width=960;canvas.height=540;canvas.parentElement?.classList.add('library-cover');
 c.fillStyle='#252b43';c.fillRect(0,0,960,540);
 const paint=()=>{if(canvas.isConnected===false)return;if(image.complete&&image.naturalWidth)c.drawImage(image,0,0,960,540);};
 if(image.complete)paint();else image.addEventListener('load',paint,{once:true});return true;
}
