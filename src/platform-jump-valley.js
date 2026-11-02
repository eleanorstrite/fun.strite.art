// These images stay in world position; only the glider and birds move.
const images=new Map();
function asset(name){if(!images.has(name)&&typeof Image!=='undefined'){const image=new Image();image.src=new URL('../assets/'+name,import.meta.url).href;images.set(name,image);}return images.get(name);}
export function drawEndingValley(c){const image=asset('ending-river-valley.png');if(!image?.complete||!image.naturalWidth)return false;c.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,0,0,900,650);return true;}
export function drawEndingCanopy(c){const image=asset('ending-blue-canopy.png');if(!image?.complete||!image.naturalWidth)return false;c.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,-160,-320,320,290);return true;}
