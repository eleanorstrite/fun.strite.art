// These images stay in world position; only the glider and birds move.
const images=new Map();
function asset(name){if(!images.has(name)&&typeof Image!=='undefined'){const image=new Image();image.src=new URL('../assets/'+name,import.meta.url).href;images.set(name,image);}return images.get(name);}
export function drawEndingValley(c){const image=asset('ending-river-valley.png');if(!image?.complete||!image.naturalWidth)return false;const sky=c.createLinearGradient(0,0,0,400);sky.addColorStop(0,'#67b9e9');sky.addColorStop(1,'#fff0c5');c.fillStyle=sky;c.fillRect(0,0,900,650);
 // The valley is far below the glider, with a broad open sky above it.
 c.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,0,300,900,350);
 const haze=c.createLinearGradient(0,300,0,355);haze.addColorStop(0,'#e8e9d5');haze.addColorStop(1,'#e8e9d500');c.fillStyle=haze;c.fillRect(0,300,900,55);
 for(const [x,y,scale] of [[60,90,1.1],[790,155,.85]]){c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#b9e4f6';for(let i=0;i<4;i++){c.beginPath();c.ellipse((i-1.5)*55,Math.abs(i-1.5)*10,65,28+i%2*10,0,0,Math.PI*2);c.fill();}c.restore();}return true;}
export function drawEndingCanopy(c){const image=asset('ending-blue-canopy.png');if(!image?.complete||!image.naturalWidth)return false;c.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,-160,-320,320,290);return true;}
