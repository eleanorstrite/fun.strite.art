let cover;
export function stormCoverImage(){
 if(typeof Image==='undefined')return null;
 if(!cover){cover=new Image();cover.src=new URL('../assets/storm-stack-cover.png',import.meta.url).href;}
 return cover;
}
// Shared by the live homepage and the exported animation preview.
export function drawStormCoverFrame(canvas,time=0){
 const c=canvas.getContext('2d');if(!c)return false;
 const w=canvas.width,h=canvas.height,img=stormCoverImage();
 c.fillStyle='#b9cee8';c.fillRect(0,0,w,h);
 if(!img?.complete||!img.naturalWidth)return false;
 c.save();c.scale(w/960,h/640);
 const breathe=1.025+Math.sin(time*Math.PI/3)*.008;
 c.translate(480,320+Math.sin(time*Math.PI/3)*2);c.scale(breathe,breathe);c.drawImage(img,-480,-320,960,640);c.restore();
 c.save();c.scale(w/960,h/640);
 for(let i=0;i<32;i++){
  const a=time*Math.PI/3+i*2.399,y=175+(i*37)%340,x=480+Math.sin(a+y*.018)*115;
  const glow=.25+.75*(.5+.5*Math.sin(time*Math.PI*2/3+i));
  c.globalAlpha=glow;c.fillStyle='#fff3ad';c.beginPath();c.moveTo(x,y-4);c.lineTo(x+2,y-1);c.lineTo(x+5,y);c.lineTo(x+2,y+1);c.lineTo(x,y+5);c.lineTo(x-2,y+1);c.lineTo(x-5,y);c.lineTo(x-2,y-1);c.closePath();c.fill();
 }
 c.globalAlpha=1;c.fillStyle='#283550d9';c.beginPath();c.roundRect(655,545,270,66,18);c.fill();c.fillStyle='#fff0b9';c.font='bold 28px sans-serif';c.textAlign='center';c.fillText('STORM STACK',790,574);c.fillStyle='#f5edf9';c.font='13px sans-serif';c.fillText('STACK · BALANCE · CAST MAGIC',790,595);c.restore();return true;
}
export function animateStormCover(canvas){
 canvas.width=960;canvas.height=640;canvas.parentElement?.classList.add('storm-art');
 const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const img=stormCoverImage();drawStormCoverFrame(canvas,0);
 if(reduced){img?.addEventListener('load',()=>drawStormCoverFrame(canvas,0),{once:true});return;}
 let start;
 function frame(now){if(!canvas.isConnected)return;start??=now;if(!globalThis.document?.hidden)drawStormCoverFrame(canvas,(now-start)/1000);requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
}
