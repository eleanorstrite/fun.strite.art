export const VICTORY_SECONDS = 7.5;
export function createVictorySequence(audio) {
  let time = 0, opened = false, spoken = false;
  return {
    get time() { return time; },
    get complete() { return time >= VICTORY_SECONDS; },
    advance(dt) {
      time = Math.min(VICTORY_SECONDS, time + Math.max(0, dt));
      if (!opened && time >= .8) { opened = true; audio.play('sword'); }
      if (!spoken && time >= 3.6) { spoken = true; audio.sayWin(); }
    },
  };
}
const colors = ['#ed6f94', '#72dbcb', '#b79af5', '#f2c875', '#76bdf4'];
function gem(ctx,x,y,size,color,angle=0) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;
  ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.7,0);ctx.lineTo(0,size);ctx.lineTo(-size*.7,0);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffffffb0';ctx.fillRect(-size*.25,-size*.6,size*.22,size*.5);ctx.restore();
}
// Drawn in a fixed stage coordinate system so the ending scales with the game.
export function drawVictory(ctx,time,width,height,drawKnight,reducedMotion=false) {
  ctx.save();ctx.scale(width/760,height/760);
  ctx.fillStyle='#10151f';ctx.fillRect(0,0,760,760);
  const opening=Math.max(0,Math.min(1,(time-.8)/.35));
  ctx.fillStyle='#22273b';ctx.beginPath();ctx.ellipse(380,640,310,45,0,0,Math.PI*2);ctx.fill();
  for(let i=0;i<32;i++) {
    const alpha=reducedMotion?.6:.35+.25*Math.sin(time*2+i);
    ctx.fillStyle=`rgba(243,209,138,${alpha})`;const x=30+(i*137)%700,y=60+(i*83)%460;
    ctx.fillRect(x,y,3,7);ctx.fillRect(x-2,y+2,7,3);
  }
  ctx.textAlign='center';ctx.font='bold 16px monospace';ctx.fillStyle='#e5c68a';ctx.fillText('THE DRAGONS’ TREASURE IS YOURS',380,95);
  // Warm light blooms from beneath the lid.
  if(opening){ctx.fillStyle=`rgba(246,208,119,${opening*.14})`;ctx.beginPath();ctx.moveTo(160,560);ctx.lineTo(65,245);ctx.lineTo(490,245);ctx.lineTo(365,560);ctx.fill();}
  const shake=time<.8&&!reducedMotion?Math.sin(time*35)*4:0;
  ctx.save();ctx.translate(260+shake,530);
  ctx.fillStyle='#251e25';ctx.fillRect(-110,-20,220,126);
  ctx.fillStyle='#965d40';ctx.fillRect(-104,-14,208,112);
  ctx.fillStyle='#6b3e32';ctx.fillRect(-100,32,200,5);ctx.fillRect(-100,73,200,5);
  ctx.fillStyle='#e7b963';ctx.fillRect(-92,-16,15,116);ctx.fillRect(77,-16,15,116);ctx.fillRect(-106,85,212,14);
  ctx.fillStyle='#30272b';ctx.fillRect(-96,-24,192,24);
  // The hinged lid springs back, exposing the gems inside.
  ctx.save();ctx.translate(0,-20);ctx.scale(1,1-opening*.7);ctx.translate(0,-opening*130);
  ctx.fillStyle='#d29a55';ctx.beginPath();ctx.roundRect(-110,-62,220,67,[26,26,3,3]);ctx.fill();
  ctx.fillStyle='#a36b42';ctx.fillRect(-103,-32,206,30);ctx.fillStyle='#f0cc7c';ctx.fillRect(-92,-53,15,57);ctx.fillRect(77,-53,15,57);ctx.fillRect(-110,-7,220,12);ctx.restore();
  ctx.fillStyle='#f2cd7d';ctx.fillRect(-16,-8,32,32);ctx.fillStyle='#67432c';ctx.fillRect(-3,0,6,15);ctx.restore();
  if(opening) {
    for(let i=0;i<55;i++) {
      const delay=(i%11)*.027,age=Math.max(0,time-.85-delay),angle=-Math.PI*.88+(i%17)/16*Math.PI*.76;
      const speed=155+(i*37)%180;
      const flight=reducedMotion?3:age;
      const x=260+Math.cos(angle)*speed*Math.min(flight,1.45);
      const y=Math.min(610+(i%4)*6,515+Math.sin(angle)*speed*flight+155*flight*flight);
      if(age>0)gem(ctx,x,y,8+(i%5)*2,colors[i%5],reducedMotion?0:Math.min(age,2)*(i%2?1:-1));
    }
    for(let i=0;i<15;i++)gem(ctx,178+(i*29)%170,508+(i%3)*8,12,colors[i%5]);
  }
  if(time>=2.2) {
    const entrance=Math.min(1,(time-2.2)/1.2),ease=1-Math.pow(1-entrance,3);
    const x=reducedMotion?550:850-300*ease,y=555+(entrance<1&&!reducedMotion?Math.sin(time*18)*5:0);
    const wave=time>=3.4?(reducedMotion?-.65:-.65+Math.sin((time-3.4)*7)*.55):.4;
    drawKnight(ctx,x,y,150,wave);
    if(time>=3.6) {
      ctx.fillStyle='#fff3d6';ctx.beginPath();ctx.roundRect(420,270,270,90,18);ctx.fill();
      ctx.beginPath();ctx.moveTo(510,358);ctx.lineTo(540,385);ctx.lineTo(555,358);ctx.fill();
      ctx.fillStyle='#30283b';ctx.font='bold 43px monospace';ctx.fillText('You win!',555,330);
    }
  }
  ctx.fillStyle='#9cabbc';ctx.font='14px monospace';ctx.fillText('Tap or press Enter to see your rewards',380,715);
  ctx.restore();
}
