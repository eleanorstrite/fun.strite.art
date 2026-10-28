// The finale uses the very same atlas as the matching cards.
export const DRAGON_CELEBRATION_SECONDS=9;
export function dragonCelebrationPhase(time){return time<2.4?'gather':time<4.5?'wings':time<6.8?'fire':'good-job';}
const ease=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
export function createDragonCelebration(board){
 const stage=document.createElement('section');stage.className='dragon-celebration';stage.setAttribute('aria-label','Dragon victory celebration');
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=720;canvas.setAttribute('aria-hidden','true');
 const caption=document.createElement('p');caption.className='dragon-celebration-caption';caption.setAttribute('role','status');stage.append(canvas,caption);board.before(stage);board.hidden=true;
 const ctx=canvas.getContext('2d'),art=new Image(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const sprites=[];art.onload=()=>{for(let kind=0;kind<20;kind++){const sprite=document.createElement('canvas');sprite.width=sprite.height=256;const c=sprite.getContext('2d');c.drawImage(art,(kind%5)*art.naturalWidth/5,Math.floor(kind/5)*art.naturalHeight/4,art.naturalWidth/5,art.naturalHeight/4,0,0,256,256);c.globalCompositeOperation='destination-in';const mask=c.createRadialGradient(128,128,95,128,128,175);mask.addColorStop(0,'#000');mask.addColorStop(1,'#0000');c.fillStyle=mask;c.fillRect(0,0,256,256);sprites.push(sprite);}};art.src='./assets/dragon-memory-colors.png';let previous='';
 function draw(time){
  const phase=dragonCelebrationPhase(time);stage.dataset.phase=phase;
  if(previous!==phase){caption.textContent={gather:'All twenty dragons are coming together…',wings:'A celebratory wing bump!',fire:'A dragon-sized celebration!', 'good-job':'Good job!'}[phase];previous=phase;}
  if(!ctx)return;const w=960,h=720;
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#16253e');sky.addColorStop(1,'#546780');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  for(let i=0;i<65;i++){ctx.fillStyle=`rgba(255,230,171,${.25+(i%4)*.12})`;ctx.beginPath();ctx.arc((i*137)%w,(i*83)%h,1+i%2,0,Math.PI*2);ctx.fill();}
  const arrival=reduced?1:ease(time/2.4),bump=reduced?0:Math.sin(ease((time-2.5)/1.7)*Math.PI),mouths=[];
  for(let kind=0;kind<20;kind++){
   const col=kind%4,row=Math.floor(kind/4),left=col%2===0,side=left?-1:1;
   // Faces point outward, so each pair meets wing-to-wing in the middle.
   const targetX=180+col*200-side*bump*40,targetY=85+row*119;
   const angle=kind/20*Math.PI*2,x=targetX*arrival+(480+Math.cos(angle)*850)*(1-arrival),y=targetY*arrival+(340+Math.sin(angle)*750)*(1-arrival)+(reduced?0:Math.sin(time*2+row)*3);
   const size=132;ctx.save();ctx.translate(x,y);ctx.scale(left?-1:1,1);ctx.rotate(side*bump*.065);
   if(art.complete&&art.naturalWidth){
    // Feather the original cloudy picture edges; keep the entire dragon intact.
    const sprite=sprites[kind];if(sprite)ctx.drawImage(sprite,-size/2,-size/2,size,size);
   }
   ctx.restore();mouths.push({x:x+(left?-1:1)*size*.37,y:y-size*.2});
   if(bump>.7){ctx.fillStyle='#ffe7a7';ctx.font='24px serif';ctx.fillText('✦',x-side*size*.45,y-28);}
  }
  const flame=ease((time-4.5)/1.1)*(1-ease((time-6.3)/.9));
  if(flame>0){
   ctx.save();ctx.globalCompositeOperation='screen';
   if(!reduced)for(const [i,mouth]of mouths.entries()){
    const endX=mouth.x+(480-mouth.x)*.7+Math.sin(i*9)*180,endY=mouth.y+(360-mouth.y)*.7;
    const width=55*flame,wave=Math.sin(time*7+i)*25,gradient=ctx.createLinearGradient(mouth.x,mouth.y,endX,endY);gradient.addColorStop(0,'#fff9bde0');gradient.addColorStop(.5,'#ffad25b0');gradient.addColorStop(1,'#ff401000');ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(mouth.x,mouth.y);ctx.bezierCurveTo(mouth.x+wave,mouth.y-20,endX-width,endY-width,endX,endY-110*flame);ctx.bezierCurveTo(endX+width,endY+width,mouth.x-wave,mouth.y+15,mouth.x,mouth.y);ctx.fill();
   }
   for(let i=0;i<(reduced?20:160);i++){
    const mouth=mouths[i%20],travel=((time-4.5)*.85+(i%8)/8)%1;if(travel<0)continue;
    const spread=travel*travel,x=mouth.x+(480-mouth.x)*spread+Math.sin(i*12.3)*spread*650,y=mouth.y+(360-mouth.y)*spread+Math.cos(i*5.7)*spread*450,r=(8+spread*190)*flame*(reduced?.3:1);
    if(r<.1)continue;const glow=ctx.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,'#fff5b9e0');glow.addColorStop(.23,'#ffcb46c0');glow.addColorStop(.55,'#ff641980');glow.addColorStop(1,'#ed260000');ctx.fillStyle=glow;ctx.fillRect(x-r,y-r,r*2,r*2);
   }ctx.restore();
  }
  if(time>=6.8){const reveal=reduced?1:ease((time-6.8)/.6);ctx.fillStyle=`rgba(10,20,38,${reveal*.7})`;ctx.fillRect(0,0,w,h);ctx.save();ctx.globalAlpha=reveal;ctx.textAlign='center';ctx.shadowColor='#ffb94e';ctx.shadowBlur=25;ctx.fillStyle='#fff1b6';ctx.font='bold 100px Georgia,serif';ctx.fillText('Good job!',480,345);ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.font='26px sans-serif';ctx.fillText('Every dragon found a friend.',480,397);ctx.restore();}
 }
 draw(0);return {draw,destroy(){art.onload=null;sprites.length=0;stage.remove();board.hidden=false;}};
}
