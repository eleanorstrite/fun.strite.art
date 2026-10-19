export const DEFEAT_SECONDS = 8;
export function createDefeatSequence(audio) {
  let time=0, gulped=false, spoken=false;
  return {
    get time(){return time;},
    get complete(){return time>=DEFEAT_SECONDS;},
    advance(dt){
      time=Math.min(DEFEAT_SECONDS,time+Math.max(0,dt));
      if(!gulped&&time>=3.2){gulped=true;audio.play('gulp');}
      if(!spoken&&time>=5.4){spoken=true;audio.sayLose();}
    },
  };
}
const clamp=n=>Math.max(0,Math.min(1,n));
export function defeatPose(time,reducedMotion=false){
  const swallow=clamp((time-3.2)/1.5),bite=clamp((time-2.5)/.7);
  return {enter:clamp((time-1)/1.4),bite,swallow,knightVisible:time<3.2,lumpVisible:time>=3.2&&time<4.7,talking:time>=5.4,
    wave:reducedMotion?-.65:-.65+Math.sin(time*7)*.55};
}
export function drawDefeat(ctx,time,width,height,drawKnight,reducedMotion=false){
  const pose=defeatPose(time,reducedMotion);
  ctx.save();ctx.scale(width/760,height/760);ctx.fillStyle='#10151f';ctx.fillRect(0,0,760,760);
  ctx.fillStyle='#272838';ctx.beginPath();ctx.ellipse(380,640,310,42,0,0,Math.PI*2);ctx.fill();
  ctx.textAlign='center';ctx.fillStyle='#e5c68a';ctx.font='bold 16px monospace';ctx.fillText('ONE LAST BRAVE SWING…',380,95);
  if(pose.knightVisible){
    const b=pose.bite;
    drawKnight(ctx,240+100*b,555-150*b,150*(1-b*.8),pose.wave);
  }
  if(time>=1){
    ctx.save();ctx.translate(reducedMotion?0:(1-pose.enter)*600,0);
    // A friendly, oversized side-view dragon. No blood or injury detail.
    ctx.fillStyle='#784f83';ctx.beginPath();ctx.moveTo(515,440);ctx.lineTo(640,280);ctx.lineTo(690,460);ctx.lineTo(635,424);ctx.lineTo(605,470);ctx.closePath();ctx.fill();
    ctx.fillStyle='#c498aa';ctx.beginPath();ctx.moveTo(540,435);ctx.lineTo(636,315);ctx.lineTo(659,421);ctx.lineTo(609,400);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#77608f';ctx.lineWidth=37;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(585,571);ctx.quadraticCurveTo(680,640,705,530);ctx.stroke();
    ctx.fillStyle='#77608f';ctx.beginPath();ctx.ellipse(530,540,95,100,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#77608f';ctx.lineWidth=90;ctx.beginPath();ctx.moveTo(415,365);ctx.quadraticCurveTo(425,465,500,535);ctx.stroke();
    ctx.strokeStyle='#d4ad86';ctx.lineWidth=42;ctx.beginPath();ctx.moveTo(405,380);ctx.quadraticCurveTo(415,465,490,543);ctx.stroke();
    ctx.fillStyle='#d4ad86';ctx.beginPath();ctx.ellipse(510,550,53,65,-.2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#65507e';ctx.beginPath();ctx.roundRect(455,610,67,24,10);ctx.roundRect(550,610,67,24,10);ctx.fill();
    // Jaw opens as the knight is scooped up, then closes for the gulp.
    const jaw=time<2.5?0:time<3.2?clamp((time-2.5)/.15):Math.max(0,1-(time-3.2)/.18);
    ctx.fillStyle='#77608f';ctx.beginPath();ctx.roundRect(315,320,135,74,24);ctx.fill();
    ctx.fillStyle='#3a263b';ctx.beginPath();ctx.roundRect(300,371,120,12+jaw*62,12);ctx.fill();
    ctx.fillStyle='#9673a5';ctx.beginPath();ctx.roundRect(301,381+jaw*62,114,20,8);ctx.fill();
    ctx.fillStyle='#f0ddad';ctx.beginPath();ctx.moveTo(410,328);ctx.lineTo(424,284);ctx.lineTo(440,330);ctx.fill();
    ctx.fillStyle='#f6d77e';ctx.beginPath();ctx.ellipse(390,344,12,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#232332';ctx.fillRect(386,337,5,14);
    if(pose.lumpVisible){
      // Follow the front edge of the neck into the belly, visibly bulging outward.
      const u=pose.swallow,x=405+85*u*u,y=401+143*u;
      ctx.fillStyle='#77608f';ctx.beginPath();ctx.ellipse(x,y,34,28,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e3bd92';ctx.beginPath();ctx.ellipse(x-9,y,24,22,0,0,Math.PI*2);ctx.fill();
    }
    if(time>=4.7&&time<5.4){ctx.fillStyle='#e5c68a';ctx.font='bold 24px monospace';ctx.fillText('GULP!',365,470);}
    ctx.restore();
  }
  if(pose.talking){
    ctx.fillStyle='#fff3d6';ctx.beginPath();ctx.roundRect(245,165,300,90,18);ctx.fill();ctx.beginPath();ctx.moveTo(375,254);ctx.lineTo(398,288);ctx.lineTo(414,254);ctx.fill();
    ctx.fillStyle='#30283b';ctx.font='bold 43px monospace';ctx.fillText('You lose.',395,225);
  }
  ctx.fillStyle='#9cabbc';ctx.font='14px monospace';ctx.fillText('Tap or press Enter to see your results',380,715);ctx.restore();
}
