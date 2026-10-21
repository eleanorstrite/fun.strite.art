import { FLIGHT_LEVELS, FLIGHT_DEFAULTS, validateFlightSettings } from './flight-settings.js';
import { createMazeAudio } from './maze-audio.js';
export const FLIGHT_WIDTH=540, FLIGHT_HEIGHT=720, FLIGHT_FLOOR=680;
export function createFlightState(settings=FLIGHT_DEFAULTS,random=Math.random){
  const config=validateFlightSettings(settings);
  const state={settings:config,level:FLIGHT_LEVELS[config.difficulty],x:150,y:330,velocity:0,radius:16,pipes:[],passed:0,earned:0,time:0,distance:0,status:'ready',crashTime:0,random};
  addPipe(state,680);addPipe(state,980);addPipe(state,1280);return state;
}
function addPipe(s,x){
  const previous=s.pipes.at(-1),margin=s.level.gap/2+65;
  let center=margin+s.random()*(FLIGHT_FLOOR-2*margin);
  if(previous)center=Math.max(previous.center-105,Math.min(previous.center+105,center));
  s.pipes.push({x,width:70,center,scored:false});
}
export function flapFlight(s){if(s.status==='playing')s.velocity=-340;}
function circleRect(x,y,r,left,top,width,height){
  const nearX=Math.max(left,Math.min(x,left+width)),nearY=Math.max(top,Math.min(y,top+height));
  return (x-nearX)**2+(y-nearY)**2<=r*r;
}
export function tickFlight(s,dt,onPass=()=>{}){
  if(s.status!=='playing')return;
  let remaining=Math.max(0,Math.min(dt,.1));
  while(remaining>1e-7&&s.status==='playing'){
    const step=Math.min(remaining,1/120);remaining-=step;s.time+=step;s.distance+=s.level.speed*step;s.velocity+=1000*step;s.y+=s.velocity*step;
    for(const pipe of s.pipes)pipe.x-=s.level.speed*step;
    if(s.y-s.radius<=0||s.y+s.radius>=FLIGHT_FLOOR){s.status='lost';break;}
    for(const pipe of s.pipes){
      const upper=pipe.center-s.level.gap/2,lower=pipe.center+s.level.gap/2;
      if(circleRect(s.x,s.y,s.radius,pipe.x-7,0,pipe.width+14,upper)||circleRect(s.x,s.y,s.radius,pipe.x-7,lower,pipe.width+14,FLIGHT_FLOOR-lower)){s.status='lost';break;}
      if(!pipe.scored&&pipe.x+pipe.width+7<s.x-s.radius){pipe.scored=true;s.passed++;s.earned=s.passed*s.level.reward;onPass(s.level.reward);}
    }
    if(s.pipes[0]?.x< -100){s.pipes.shift();addPipe(s,s.pipes.at(-1).x+300);}
  }
}
function polygon(ctx,points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
export function drawFlyer(ctx,x,y,size,settings,time=0,tilt=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.scale(size/80,size/80);
  const flap=Math.sin(time*(settings.animal==='hummingbird'?34:10)),color=settings.color;
  // Original animated silhouettes inspired by the supplied animal references.
  if(settings.animal==='duck'){
    polygon(ctx,[[-19,1],[-45,-8],[-38,8],[-15,15]],color);
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(-1,6,30,18,-.08,0,7);ctx.ellipse(24,-11,17,16,0,0,7);ctx.fill();
    ctx.fillStyle='#ffffff45';ctx.beginPath();ctx.ellipse(4,14,22,7,0,0,7);ctx.fill();
    // The wing pivots at the shoulder; no engine, tank, or flame.
    ctx.save();ctx.translate(-4,0);ctx.rotate(-.55+flap*.8);
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,9);ctx.quadraticCurveTo(-42,3,-40,-34);ctx.quadraticCurveTo(-17,-31,9,-4);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#ffffff66';ctx.lineWidth=2;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-2-i*5,0);ctx.lineTo(-21-i*6,-19-i*4);ctx.stroke();}
    ctx.restore();
    ctx.fillStyle='#eba33f';ctx.beginPath();ctx.ellipse(44,-7,14,6,.08,0,7);ctx.fill();
    ctx.strokeStyle='#b87529';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(35,-5);ctx.lineTo(55,-5);ctx.stroke();
    polygon(ctx,[[-8,21],[-11,29],[-23,30],[-18,24]],'#eba33f');
    polygon(ctx,[[10,20],[8,28],[-3,30],[1,23]],'#eba33f');
  }else if(['burger','pizza','taco'].includes(settings.animal)){
    polygon(ctx,[[-30,-2],[-72,12+flap*6],[-48,-8],[-70,-25-flap*6],[-30,-20]],'#f69945');
    polygon(ctx,[[-30,-6],[-56,0],[-43,-12],[-30,-16]],'#ffe898');
    ctx.fillStyle=color;ctx.fillRect(-39,-28,22,37);
    ctx.fillStyle='#d4e9ee';ctx.fillRect(-36,-24,6,27);
    ctx.fillStyle='#3b4c5e';ctx.fillRect(-42,-20,5,18);
    if(settings.animal==='burger'){
      ctx.fillStyle='#d59349';ctx.beginPath();ctx.ellipse(0,22,35,11,0,0,7);ctx.fill();
      ctx.fillStyle='#63402b';ctx.fillRect(-34,8,68,13);
      polygon(ctx,[[-35,7],[35,7],[27,15],[13,11],[4,18],[-10,10],[-30,14]],'#f6cc57');
      ctx.fillStyle='#d75c49';ctx.fillRect(-33,-1,66,7);
      polygon(ctx,[[-36,-3],[-25,-8],[-14,-3],[-2,-8],[11,-3],[25,-8],[36,-3],[29,3],[15,0],[2,4],[-12,0],[-26,3]],'#78ad52');
      ctx.fillStyle='#edb568';ctx.beginPath();ctx.ellipse(0,-8,35,22,0,Math.PI,Math.PI*2);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff0bc';for(const [xx,yy] of [[-20,-16],[-7,-24],[8,-20],[23,-14]]){ctx.beginPath();ctx.ellipse(xx,yy,3,1,-.4,0,7);ctx.fill();}
    }else if(settings.animal==='pizza'){
      polygon(ctx,[[-31,-33],[43,3],[-24,33]],'#b9763a');
      polygon(ctx,[[-24,-27],[42,3],[-19,26]],'#f1c959');
      ctx.strokeStyle='#df9a4e';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-29,-29);ctx.lineTo(-23,29);ctx.stroke();
      for(const [xx,yy] of [[-12,-12],[5,2],[-9,17]]){ctx.fillStyle='#ba4a35';ctx.beginPath();ctx.arc(xx,yy,6,0,7);ctx.fill();ctx.fillStyle='#df8054';ctx.beginPath();ctx.arc(xx-1,yy-2,2,0,7);ctx.fill();}
      ctx.fillStyle='#628e48';for(const [xx,yy] of [[-4,-3],[11,10],[-16,5]]){ctx.beginPath();ctx.ellipse(xx,yy,3,1.5,-.5,0,7);ctx.fill();}
    }else{
      ctx.fillStyle='#bd853e';ctx.beginPath();ctx.ellipse(0,1,37,28,0,0,7);ctx.fill();
      ctx.fillStyle='#65412d';ctx.beginPath();ctx.ellipse(0,-10,32,12,0,0,7);ctx.fill();
      for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#78b55a':'#a1cf6b';ctx.beginPath();ctx.arc(-27+i*9,-15+(i%2?3:0),7,0,7);ctx.fill();}
      ctx.fillStyle='#df6550';for(const xx of [-19,2,21])ctx.fillRect(xx,-20,7,6);
      ctx.fillStyle='#efc264';ctx.beginPath();ctx.moveTo(-36,-9);ctx.quadraticCurveTo(0,6,36,-9);ctx.bezierCurveTo(34,38,-34,38,-36,-9);ctx.fill();
      ctx.fillStyle='#cc9a49';for(const [xx,yy] of [[-23,3],[-12,16],[0,7],[17,14],[26,1]]){ctx.beginPath();ctx.arc(xx,yy,1.6,0,7);ctx.fill();}
    }
    ctx.strokeStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-20,-24);ctx.lineTo(-16,25);ctx.stroke();
    // Friendly face sits on the food, separate from the rocket harness.
    ctx.fillStyle='#27313b';for(const xx of [14,26]){ctx.beginPath();ctx.arc(xx,1,2.4,0,7);ctx.fill();}
    ctx.strokeStyle='#573d32';ctx.lineWidth=2;ctx.beginPath();ctx.arc(20,7,5,0,Math.PI);ctx.stroke();
    ctx.restore();return;
  }else if(settings.animal==='hotdog'){
    // Toasted bun, sausage, mustard, and a colorful strapped-on rocket pack.
    polygon(ctx,[[-30,-5],[-75,7+flap*6],[-52,-9],[-76,-23-flap*6],[-29,-22]],'#f69945');
    polygon(ctx,[[-31,-9],[-59,-7],[-44,-15],[-31,-18]],'#ffe898');
    ctx.fillStyle=color;ctx.fillRect(-33,-31,29,33);
    ctx.fillStyle='#d4e9ee';ctx.fillRect(-29,-27,7,23);
    ctx.fillStyle='#3b4c5e';ctx.fillRect(-36,-22,6,17);
    ctx.fillStyle='#b6783e';ctx.beginPath();ctx.ellipse(0,7,47,21,0,0,7);ctx.fill();
    ctx.fillStyle='#efbd78';ctx.beginPath();ctx.ellipse(0,10,44,15,0,0,7);ctx.fill();
    ctx.fillStyle='#a64a35';ctx.beginPath();ctx.ellipse(2,-3,46,12,0,0,7);ctx.fill();
    ctx.fillStyle='#d77b52';ctx.beginPath();ctx.ellipse(0,-7,39,5,0,0,7);ctx.fill();
    ctx.strokeStyle='#f8d75a';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    for(let i=0;i<9;i++){const xx=-29+i*6,yy=-4+(i%2?4:-3);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();
    ctx.strokeStyle='#536b83';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-16,-16);ctx.lineTo(-15,23);ctx.stroke();
    ctx.fillStyle='#fff1cf';for(const xx of [-27,-5,12]){ctx.beginPath();ctx.ellipse(xx,15,2,1,-.4,0,7);ctx.fill();}
    ctx.strokeStyle='#65392e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(34,1,5,.1,2.5);ctx.stroke();
  }else if(settings.animal==='cat'||settings.animal==='dog'){
    const cat=settings.animal==='cat';
    // A curved cat tail or a wagging dog tail, behind the rocket pack.
    ctx.strokeStyle=color;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-20,11);
    ctx.quadraticCurveTo(-48,cat?30:5+flap*8,-42,cat?-5:0+flap*8);ctx.stroke();
    polygon(ctx,[[-28,0],[-68,10+flap*6],[-48,-5],[-72,-16-flap*6],[-28,-17]],'#f69945');
    polygon(ctx,[[-28,-3],[-53,-1],[-42,-10],[-28,-13]],'#ffe898');
    ctx.fillStyle='#536b83';ctx.fillRect(-32,-30,22,36);
    ctx.fillStyle='#b9d5df';ctx.fillRect(-29,-27,7,28);
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(-1,6,27,19,0,0,7);ctx.ellipse(24,-7,19,18,0,0,7);
    ctx.ellipse(-10,23,8,5,0,0,7);ctx.ellipse(16,22,8,5,0,0,7);ctx.fill();
    if(cat){
      polygon(ctx,[[9,-17],[9,-38],[23,-22]],color);
      polygon(ctx,[[27,-22],[41,-35],[40,-12]],color);
      polygon(ctx,[[12,-22],[12,-31],[19,-23]],'#edabb4');
      polygon(ctx,[[31,-22],[38,-29],[37,-19]],'#edabb4');
      ctx.fillStyle='#fff0dc';ctx.beginPath();ctx.ellipse(35,1,10,7,0,0,7);ctx.fill();
      polygon(ctx,[[36,-2],[42,-2],[39,2]],'#d57e92');
      ctx.strokeStyle='#453e48';ctx.lineWidth=1.5;
      for(const dy of [-4,3]){ctx.beginPath();ctx.moveTo(33,3);ctx.lineTo(20,3+dy);ctx.moveTo(42,3);ctx.lineTo(53,3+dy);ctx.stroke();}
    }else{
      ctx.fillStyle='#ffffff35';ctx.beginPath();ctx.ellipse(39,2,15,10,0,0,7);ctx.fill();
      ctx.fillStyle='#5d4339';ctx.beginPath();ctx.ellipse(11,-10,9,20,-.3,0,7);ctx.fill();
      ctx.fillStyle='#26323d';ctx.beginPath();ctx.ellipse(49,-1,5,4,0,0,7);ctx.fill();
      ctx.fillStyle='#eb9bab';ctx.beginPath();ctx.ellipse(41,13,4,7,-.15,0,7);ctx.fill();
    }
    ctx.strokeStyle='#536b83';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10,-12);ctx.lineTo(-7,20);ctx.stroke();
    ctx.strokeStyle='#e6b65d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(16,9);ctx.lineTo(24,12);ctx.stroke();
  }else if(settings.animal==='capybara'){
    // Rounded snout, little ears and paws, with twin metal rocket tanks.
    polygon(ctx,[[-28,5],[-64,12+flap*5],[-43,-2],[-70,-9-flap*5],[-27,-12]],'#f69945');
    polygon(ctx,[[-28,1],[-52,4],[-36,-7],[-27,-8]],'#ffe898');
    ctx.fillStyle='#536b83';ctx.fillRect(-32,-27,21,38);
    ctx.fillStyle='#b9d5df';ctx.fillRect(-29,-24,7,29);
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(-1,4,30,22,0,0,7);ctx.ellipse(27,-5,22,19,0,0,7);ctx.fill();
    ctx.beginPath();ctx.ellipse(16,-23,7,8,-.3,0,7);ctx.ellipse(-9,24,8,6,0,0,7);ctx.ellipse(20,22,8,6,0,0,7);ctx.fill();
    ctx.fillStyle='#ffffff35';ctx.beginPath();ctx.ellipse(37,1,12,10,0,0,7);ctx.fill();
    ctx.fillStyle='#41332c';ctx.beginPath();ctx.arc(44,-3,3,0,7);ctx.fill();
    ctx.strokeStyle='#654e40';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(34,8);ctx.lineTo(43,8);ctx.stroke();
    ctx.strokeStyle='#536b83';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,-15);ctx.lineTo(-9,18);ctx.stroke();
  }else if(settings.animal==='dragon'){
    polygon(ctx,[[-5,0],[-28,-12],[-69,-35-flap*15],[-48,-34-flap*18],[-22,-60-flap*18],[4,-12]],color);
    polygon(ctx,[[-15,-8],[-53,-32-flap*14],[-36,-27-flap*13],[-21,-48-flap*15],[-1,-12]],'#f7ba737f');
    polygon(ctx,[[-22,5],[-56,18],[-75,8],[-57,26],[-13,13]],color);
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,5,29,13,-.1,0,7);ctx.ellipse(29,-1,18,10,.2,0,7);ctx.fill();
    polygon(ctx,[[30,-8],[23,-23],[36,-10]],'#e7dcb8');polygon(ctx,[[41,0],[55,5],[39,8]],color);
    polygon(ctx,[[-8,11],[-13,23],[-3,20],[3,10]],color);polygon(ctx,[[14,10],[12,22],[22,18],[22,8]],color);
  }else{
    const eagle=settings.animal==='eagle';
    polygon(ctx,[[-10,4],[-55,eagle?18:8],[-38,26],[0,13]],eagle?'#f4eee2':color);
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,3,28,15,-.16,0,7);ctx.fill();
    polygon(ctx,[[-14,2],[-39,-25-flap*20],[-20,-58-flap*15],[-8,-48-flap*15],[4,-18],[9,3]],color);
    ctx.strokeStyle='#ffffff66';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-8+i*4,0);ctx.lineTo(-27+i*4,-38-flap*16);ctx.stroke();}
    ctx.fillStyle=eagle?'#fff3db':color;ctx.beginPath();ctx.ellipse(24,-8,16,14,0,0,7);ctx.fill();
    polygon(ctx,eagle?[[34,-10],[48,-5],[42,5],[40,-2],[33,-2]]:[[35,-9],[68,-17],[36,-5]],eagle?'#e9bc51':'#293344');
    if(!eagle){ctx.fillStyle='#3454a699';ctx.beginPath();ctx.ellipse(23,-1,10,9,0,0,7);ctx.fill();}
  }
  ctx.fillStyle='#172939';ctx.beginPath();ctx.arc(29,-9,2.8,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(30,-10,1,0,7);ctx.fill();ctx.restore();
}
function drawPipe(ctx,p,s){
  const top=p.center-s.level.gap/2,bottom=p.center+s.level.gap/2,c=s.settings.pipeColor;
  if(s.settings.pipe==='coral'){
    for(const [y,h] of [[0,top],[bottom,FLIGHT_FLOOR-bottom]]){
      ctx.save();ctx.beginPath();ctx.rect(p.x-7,y,p.width+14,h);ctx.clip();
      ctx.fillStyle=c;ctx.fillRect(p.x-7,y,p.width+14,h);
      ctx.fillStyle='#00000022';ctx.fillRect(p.x+p.width-10,y,17,h);
      ctx.strokeStyle='#fff0dd88';ctx.lineWidth=5;ctx.lineCap='round';
      for(let yy=y+22;yy<y+h;yy+=44){
        const xx=p.x+20+(Math.floor(yy/44)%2)*20;
        ctx.beginPath();ctx.moveTo(xx,yy+24);ctx.lineTo(xx,yy-10);ctx.moveTo(xx,yy+9);ctx.lineTo(xx-14,yy);ctx.lineTo(xx-16,yy-10);ctx.moveTo(xx,yy);ctx.lineTo(xx+14,yy-10);ctx.stroke();
      }
      ctx.fillStyle='#ffffff44';
      for(let yy=y+9;yy<y+h;yy+=21)for(let xx=p.x+4;xx<p.x+p.width;xx+=19){ctx.beginPath();ctx.arc(xx,yy,2,0,7);ctx.fill();}
      ctx.strokeStyle='#753e6266';ctx.lineWidth=2;ctx.strokeRect(p.x-7,y,p.width+14,h);
      ctx.restore();
    }
    return;
  }
  for(const [y,h,edge] of [[0,top,top-20],[bottom,FLIGHT_FLOOR-bottom,bottom]]){
    ctx.fillStyle=c;ctx.fillRect(p.x,y,p.width,h);ctx.fillStyle='#ffffff26';ctx.fillRect(p.x+8,y,12,h);ctx.fillStyle='#00000020';ctx.fillRect(p.x+p.width-12,y,12,h);
    if(s.settings.pipe==='stone'){ctx.strokeStyle='#25343955';ctx.lineWidth=2;for(let yy=y+28;yy<y+h;yy+=35){ctx.beginPath();ctx.moveTo(p.x,yy);ctx.lineTo(p.x+p.width,yy);ctx.moveTo(p.x+((Math.floor(yy/35)%2)?22:47),yy);ctx.lineTo(p.x+((Math.floor(yy/35)%2)?22:47),Math.min(yy+35,y+h));ctx.stroke();}}
    if(s.settings.pipe==='vines'){ctx.strokeStyle='#234c42';ctx.lineWidth=4;ctx.beginPath();for(let yy=y;yy<y+h;yy+=8){const xx=p.x+35+Math.sin(yy/25)*20;yy===y?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy);}ctx.stroke();ctx.fillStyle='#b9d68b';for(let yy=y+15;yy<y+h;yy+=45){ctx.beginPath();ctx.ellipse(p.x+30+Math.sin(yy/25)*20,yy,10,5,-.6,0,7);ctx.fill();}}
    if(s.settings.pipe==='crystal'){polygon(ctx,[[p.x+20,y],[p.x+50,y+h*.5],[p.x+35,y+h],[p.x+5,y+h*.4]],'#ffffff36');}
    ctx.fillStyle=c;ctx.fillRect(p.x-7,edge,p.width+14,20);ctx.strokeStyle='#26374566';ctx.lineWidth=2;ctx.strokeRect(p.x-7,edge,p.width+14,20);
  }
}
// The same obstacle coordinates and physics drive both camera views.
export function projectFlightGate(s,pipe){
  const front=pipe.x-7-s.x,back=pipe.x+pipe.width+7-s.x;
  const scale=z=>260/Math.max(65,260+z);
  const project=k=>({left:270-340*k,right:270+340*k,top:360+(pipe.center-s.level.gap/2-s.y)*k,bottom:360+(pipe.center+s.level.gap/2-s.y)*k,ceiling:360-s.y*k,floor:360+(FLIGHT_FLOOR-s.y)*k,scale:k});
  return {front:project(scale(front)),back:project(scale(back)),behind:back< -s.radius};
}
export function drawFirstPersonFlight(ctx,s,width,height,reducedMotion=false){
  drawFlight(ctx,s,width,height,reducedMotion,true);
  ctx.save();ctx.scale(width/540,height/720);
  // Perspective lines mark the flight corridor and make forward motion visible.
  ctx.strokeStyle='#ffffff35';ctx.lineWidth=2;
  for(const x of [-500,0,540,1040]){ctx.beginPath();ctx.moveTo(270,360);ctx.lineTo(x,720);ctx.stroke();}
  for(let i=0;i<6;i++){
    const z=(i*150+s.distance%150),k=260/(260+z),y=360+(FLIGHT_FLOOR-s.y)*k;
    ctx.beginPath();ctx.moveTo(270-340*k,y);ctx.lineTo(270+340*k,y);ctx.stroke();
  }
  for(const pipe of [...s.pipes].reverse()){
    const gate=projectFlightGate(s,pipe);if(gate.behind)continue;
    const f=gate.front,b=gate.back,c=s.settings.pipeColor;
    for(const upper of [true,false]){
      const edge=upper?f.top:f.bottom,farEdge=upper?b.top:b.bottom;
      const outer=upper?Math.min(-200,f.ceiling):Math.max(920,f.floor);
      const farOuter=upper?Math.min(-200,b.ceiling):Math.max(920,b.floor);
      ctx.fillStyle=c;ctx.fillRect(f.left,Math.min(edge,outer),f.right-f.left,Math.abs(outer-edge));
      polygon(ctx,[[f.left,edge],[f.right,edge],[b.right,farEdge],[b.left,farEdge]],c);
      polygon(ctx,[[f.left,edge],[f.right,edge],[b.right,farEdge],[b.left,farEdge]],upper?'#142c4655':'#ffffff44');
      polygon(ctx,[[f.right,outer],[f.right,edge],[b.right,farEdge],[b.right,farOuter]],'#142c4655');
      const cap=12*f.scale;
      ctx.fillStyle=c;ctx.fillRect(f.left-5*f.scale,upper?edge-cap:edge,f.right-f.left+10*f.scale,cap);
      ctx.strokeStyle='#243f4b99';ctx.lineWidth=Math.max(1,2*f.scale);ctx.strokeRect(f.left-5*f.scale,upper?edge-cap:edge,f.right-f.left+10*f.scale,cap);
      ctx.save();ctx.beginPath();ctx.rect(f.left,Math.min(edge,outer),f.right-f.left,Math.abs(outer-edge));ctx.clip();
      ctx.fillStyle='#ffffff24';ctx.fillRect(f.left+22*f.scale,Math.min(edge,outer),28*f.scale,Math.abs(outer-edge));
      if(s.settings.pipe==='stone'){
        ctx.strokeStyle='#25343955';ctx.lineWidth=2;
        for(let row=0;row<12;row++){const y=edge+(upper?-1:1)*row*34*f.scale;ctx.beginPath();ctx.moveTo(f.left,y);ctx.lineTo(f.right,y);ctx.moveTo(270+(row%2?40:-40)*f.scale,y);ctx.lineTo(270+(row%2?40:-40)*f.scale,y+(upper?-1:1)*34*f.scale);ctx.stroke();}
      }else if(s.settings.pipe==='vines'||s.settings.pipe==='coral'){
        ctx.strokeStyle=s.settings.pipe==='coral'?'#f6b6bb':'#234c42';ctx.lineWidth=5*f.scale;
        for(const side of [-1,1]){
          const x=270+side*190*f.scale;ctx.beginPath();ctx.moveTo(x,edge);ctx.bezierCurveTo(x-30*f.scale,edge-70*f.scale,x+30*f.scale,edge-120*f.scale,x,outer);ctx.stroke();
          for(let i=1;i<5;i++){const y=edge+(upper?-1:1)*i*35*f.scale;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+side*28*f.scale,y-18*f.scale);ctx.stroke();}
        }
      }else if(s.settings.pipe==='crystal')polygon(ctx,[[f.left,edge],[270,edge+(upper?-1:1)*150*f.scale],[f.right,edge],[270,outer]],'#ffffff33');
      ctx.restore();
    }
  }
  const next=s.pipes.find(pipe=>!projectFlightGate(s,pipe).behind);
  // The reticle is the animal's collision center. Keep it inside the opening.
  ctx.strokeStyle='#fff8d6';ctx.lineWidth=2;ctx.beginPath();ctx.arc(270,360,s.radius,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(263,360);ctx.lineTo(277,360);ctx.moveTo(270,353);ctx.lineTo(270,367);ctx.stroke();
  // First-person paws or wings: no external side-view animal in this camera.
  const animal=s.settings.animal,color=s.settings.color,bird=['duck','eagle','hummingbird','dragon'].includes(animal);
  const bob=reducedMotion?0:Math.sin(s.time*10)*6;
  for(const side of [-1,1]){
    ctx.save();ctx.translate(270+side*185,660+bob);ctx.scale(side,1);
    if(bird){
      polygon(ctx,[[-22,45],[14,-40],[105,-70],[75,-20],[100,-30],[60,20],[80,14],[28,55]],color);
      if(animal==='dragon')polygon(ctx,[[10,-22],[84,-55],[55,-10],[68,-13],[25,27]],'#f5b37c');
      else{ctx.strokeStyle='#ffffff66';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(5+i*12,30);ctx.lineTo(55+i*15,-35-i*8);ctx.stroke();}}
    }else{
      ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,20,37,58,-.25,0,7);ctx.fill();
      ctx.fillStyle=animal==='cat'?'#efb3bf':'#f5d4a1';ctx.beginPath();ctx.ellipse(-3,-2,14,18,0,0,7);ctx.fill();
      for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(-21+i*16,-26,6,8,0,0,7);ctx.fill();}
    }
    ctx.restore();
  }
  ctx.fillStyle='#20374ce8';ctx.fillRect(15,15,510,86);ctx.fillStyle='#fff1d1';ctx.textAlign='center';ctx.font='bold 32px sans-serif';ctx.fillText(String(s.passed),270,49);
  ctx.font='15px sans-serif';ctx.fillText(s.level.name+' · '+s.level.reward+' coins per pipe · 3D view',270,79);
  ctx.fillStyle='#20374ce8';ctx.fillRect(60,108,420,36);ctx.fillStyle='#fff1d1';ctx.font='15px sans-serif';
  const aligned=next&&s.y-s.radius>next.center-s.level.gap/2&&s.y+s.radius<next.center+s.level.gap/2;
  ctx.fillText(s.status==='lost'?'BONK! Coming in for a landing…':aligned?'Lined up — keep the circle in the gap':next&&s.y>next.center?'Tap to rise toward the opening':'Let yourself fall toward the opening',270,131);
  if(s.status==='lost'){
    ctx.strokeStyle='#edb681';ctx.lineWidth=8;ctx.strokeRect(4,4,532,712);
    ctx.fillStyle='#20374ce8';ctx.fillRect(115,295,310,60);ctx.fillStyle='#fff1d1';ctx.font='bold 28px sans-serif';ctx.fillText('What a flight!',270,335);
  }
  ctx.restore();
}
export function drawFlight(ctx,s,width,height,reducedMotion=false,backgroundOnly=false){
  if(s.settings.view==='firstperson'&&!backgroundOnly){drawFirstPersonFlight(ctx,s,width,height,reducedMotion);return;}
  ctx.save();ctx.scale(width/FLIGHT_WIDTH,height/FLIGHT_HEIGHT);
  const dragon=s.settings.animal==='dragon',eagle=s.settings.animal==='eagle',background=s.settings.background;
  const underwater=background==='underwater',night=background==='stars',city=background==='city',sunset=background==='sunset';
  const freePalettes={underwater:['#469fbb','#123d68','#27758b','#20546e'],ocean:['#70bfdc','#d9f0ee','#56adbf','#368fa9'],meadow:['#92cae5','#eff2c9','#a2c58b','#78a66c'],desert:['#e6b67c','#fae3ae','#d7a06b','#bc8157'],snow:['#8caeca','#e6f2f5','#b5cddd','#8daac5']};
  const colors=freePalettes[background]||(night?['#151e45','#626b9f','#384973','#293b60']:city?['#849cc4','#f8cda7','#6b7d9d','#445c79']:sunset?['#d86c86','#ffdb8b','#b17791','#785f82']:[dragon?'#d98883':eagle?'#96b6d3':'#97d3d1',dragon?'#ffe4ac':'#e2efd5',dragon?'#ad8c9c':'#93b8ad',dragon?'#8d8799':'#77a597']);
  const sky=ctx.createLinearGradient(0,0,0,FLIGHT_HEIGHT);sky.addColorStop(0,colors[0]);sky.addColorStop(1,colors[1]);ctx.fillStyle=sky;ctx.fillRect(0,0,540,720);
  if(!underwater){ctx.fillStyle=night?'#edf3ff':'#fff0c7';ctx.beginPath();ctx.arc(420,125,night?34:53,0,7);ctx.fill();}
  if(underwater){
    for(let i=0;i<4;i++)polygon(ctx,[[i*150-50,0],[i*150+3,0],[i*150+170,550],[i*150+30,550]],'#b5f4ec0d');
    for(let i=0;i<19;i++){
      const x=((i*73-s.distance*.1)%540+540)%540,y=70+((i*67-s.time*12)%550+550)%550;
      ctx.strokeStyle='#c0eff35c';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,3+i%5,0,7);ctx.stroke();
    }
    for(let i=0;i<7;i++){
      const x=((i*97-s.distance*.18)%620+620)%620-40,y=240+(i*67)%280;
      ctx.fillStyle=i%2?'#79c0be88':'#e7be8e88';ctx.beginPath();ctx.ellipse(x,y,11,5,0,0,7);ctx.fill();
      polygon(ctx,[[x-9,y],[x-17,y-6],[x-17,y+6]],ctx.fillStyle);
    }
  }else if(night){
    for(let i=0;i<55;i++){const x=((i*97-s.distance*.06)%540+540)%540,y=35+(i*73)%440;ctx.fillStyle=i%3?'#dce9ff':'#fff2bd';ctx.fillRect(x,y,i%3?2:3,i%3?2:3);}
  }else{
    for(let i=0;i<5;i++){const x=((i*170-s.distance*.15)%850+850)%850-150;ctx.fillStyle='#ffffff66';ctx.beginPath();ctx.ellipse(x,140+i%3*70,70,18,0,0,7);ctx.fill();}
  }
  if(underwater){
    polygon(ctx,[[0,620],[90,570],[180,625],[300,585],[440,610],[540,565],[540,720],[0,720]],'#245773');
    for(let i=0;i<14;i++){
      const x=i*43-10;ctx.strokeStyle=i%2?'#57a99a':'#3d8c8c';ctx.lineWidth=5;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(x,680);ctx.bezierCurveTo(x-18,645,x+18,622,x+Math.sin(i)*15,590+i%3*15);ctx.stroke();
      if(i%3===0){ctx.strokeStyle='#bf829a';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x+15,680);ctx.lineTo(x+15,638);ctx.moveTo(x+15,658);ctx.lineTo(x+1,647);ctx.moveTo(x+15,649);ctx.lineTo(x+29,635);ctx.stroke();}
    }
  }else if(background==='ocean'){
    ctx.fillStyle=colors[2];ctx.fillRect(0,440,540,240);
    for(let row=0;row<6;row++){
      ctx.strokeStyle=row%2?'#bce9ea':'#6ec3d1';ctx.lineWidth=3;ctx.beginPath();
      for(let x=0;x<=540;x+=10){const y=460+row*35+Math.sin((x-s.distance*.15)/40+row)*5;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    }
    polygon(ctx,[[70,510],[122,470],[170,510]],'#e9d4a0');
    ctx.strokeStyle='#85664b';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(122,485);ctx.lineTo(125,439);ctx.stroke();
    for(const side of [-1,1])polygon(ctx,[[125,439],[125+side*32,433],[125+side*44,453],[125+side*18,445]],'#4c8e67');
  }else if(background==='desert'){
    for(let layer=0;layer<2;layer++){
      ctx.fillStyle=colors[2+layer];ctx.beginPath();ctx.moveTo(0,720);
      for(let x=0;x<=540;x+=10)ctx.lineTo(x,510+layer*80+Math.sin(x/100+layer)*35);
      ctx.lineTo(540,720);ctx.closePath();ctx.fill();
    }
    ctx.strokeStyle='#668168';ctx.lineWidth=9;ctx.lineCap='round';
    for(const x of [70,360]){ctx.beginPath();ctx.moveTo(x,620);ctx.lineTo(x,550);ctx.moveTo(x,587);ctx.lineTo(x-18,587);ctx.lineTo(x-18,566);ctx.moveTo(x,575);ctx.lineTo(x+19,575);ctx.lineTo(x+19,555);ctx.stroke();}
  }else if(background==='meadow'){
    for(let layer=0;layer<2;layer++){
      ctx.fillStyle=colors[2+layer];ctx.beginPath();ctx.moveTo(0,720);
      for(let x=0;x<=540;x+=10)ctx.lineTo(x,520+layer*70+Math.sin(x/140+layer*2)*40);
      ctx.lineTo(540,720);ctx.closePath();ctx.fill();
    }
    for(let i=0;i<22;i++){const x=(i*71)%540,y=610+(i*17)%60;ctx.fillStyle=i%2?'#f8dea1':'#f0b2c2';ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();}
  }else if(city){
    for(let layer=0;layer<2;layer++)for(let i=0;i<12;i++){
      const x=((i*72-s.distance*(.08+layer*.06))%864+864)%864-100,h=100+(i*43+layer*57)%180,y=FLIGHT_FLOOR-h;
      ctx.fillStyle=colors[2+layer];ctx.fillRect(x,y,58,h);
      ctx.fillRect(x+25,y-16,8,16);
      ctx.fillStyle=layer?'#f6d492':'#b9d5e9';
      for(let yy=y+18;yy<FLIGHT_FLOOR;yy+=26)for(let xx=x+10;xx<x+48;xx+=17)ctx.fillRect(xx,yy,7,10);
    }
  }else{
    polygon(ctx,[[0,560],[100,360],[230,550],[340,330],[540,530],[540,720],[0,720]],colors[2]);
    polygon(ctx,[[0,610],[180,480],[370,600],[540,460],[540,720],[0,720]],colors[3]);
    if(sunset||background==='snow'){polygon(ctx,[[77,405],[100,360],[134,410],[106,399],[96,408]],'#ffe9d1');polygon(ctx,[[311,387],[340,330],[374,385],[344,374],[333,388]],'#ffe9d1');}
  }
  if(backgroundOnly){ctx.restore();return;}
  for(const p of s.pipes)drawPipe(ctx,p,s);
  ctx.fillStyle=background==='snow'?'#edf6fb':'#e6d8af';ctx.fillRect(0,FLIGHT_FLOOR,540,40);ctx.fillStyle=background==='snow'?'#b3cedd':'#688575';ctx.fillRect(0,FLIGHT_FLOOR,540,6);
  const crash=s.status==='lost',t=s.crashTime;
  const flyerY=crash&&!reducedMotion?Math.min(FLIGHT_FLOOR-24,Math.max(30,s.y)+240*t*t-100*t):s.y;
  drawFlyer(ctx,s.x,flyerY,45,s.settings,s.time,crash?(reducedMotion?0:Math.min(1.5,t*3)):Math.max(-.35,Math.min(.8,s.velocity/650)));
  if(crash){
    ctx.strokeStyle='#fff3c8';ctx.lineWidth=4;ctx.globalAlpha=Math.max(0,1-t*2);
    ctx.beginPath();ctx.arc(s.x,s.y,22+(reducedMotion?0:t*120),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    for(let i=0;i<7;i++){
      const angle=i*Math.PI*2/7+(reducedMotion?0:t*2),r=35+(reducedMotion?0:Math.min(t,.5)*40);
      ctx.fillStyle=i%2?'#fff2ba':'#e9ab43';ctx.font='bold 20px sans-serif';
      ctx.fillText('✦',s.x+Math.cos(angle)*r,flyerY+Math.sin(angle)*r);
    }
    ctx.fillStyle=(night||underwater)?'#f6edcf':'#233747';ctx.font='bold 28px sans-serif';ctx.fillText(t<.65?'BONK!':'What a flight!',270,280);
  }
  ctx.textAlign='center';ctx.font='bold 38px monospace';ctx.fillStyle=(night||underwater)?'#f6edcf':'#233747';ctx.fillText(String(s.passed),270,62);ctx.font='15px monospace';ctx.fillText(`${s.level.name} · ${s.level.reward} coin${s.level.reward===1?'':'s'} per pipe`,270,90);
  ctx.restore();
}
export function drawFlightPreview(canvas,character){const ctx=canvas.getContext('2d');if(!ctx)return;const s=createFlightState(character.flight);s.pipes=[{x:380,width:70,center:330}];drawFlight(ctx,s,canvas.width,canvas.height);}
export function createSkyFlight({canvas,character,onHud,onFinish}){
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser does not support canvas.');
  let settings=validateFlightSettings(character.flight),state=createFlightState(settings),active=false,paused=false,destroyed=false,last=0,frame;
  const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  let flapSoundAt=-Infinity;
  const audio=createMazeAudio(),controller=new AbortController(),options={signal:controller.signal};
  function flap(){
    if(!active||paused||document.hidden||state.status!=='playing')return;
    audio.unlock();flapFlight(state);
    if(state.time-flapSoundAt>=.08){
      audio.play({dragon:'flap',hummingbird:'chirp',eagle:'whoosh',duck:'flap',capybara:'jet',cat:'jet',dog:'jet',hotdog:'jet',burger:'jet',pizza:'jet',taco:'jet'}[state.settings.animal]);
      flapSoundAt=state.time;
    }
  }
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus();flap();},options);
  canvas.addEventListener('keydown',e=>{if([' ','ArrowUp','w','W'].includes(e.key)){e.preventDefault();if(!e.repeat)flap();}},options);
  function hud(){onHud({text:`${state.level.name} · ${state.passed} pipes passed · ✦ ${state.earned} coins`});}
  function finish(){if(!active)return;active=false;onFinish(state.earned,{title:state.status==='lost'?'A brave flight!':'Flight saved.',detail:`${state.passed} pipes × ${state.level.reward} coins · ${state.level.name}`});}
  function tick(now){if(destroyed)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
    if(active&&!paused&&!document.hidden){
      if(state.status==='lost'){
        const before=state.crashTime;state.crashTime+=dt;
        if(before<.55&&state.crashTime>=.55)audio.play('bounce');
        if(before<1.15&&state.crashTime>=1.15)audio.play('flightEnd');
        if(state.crashTime>=2)finish();
      }else{
        tickFlight(state,dt,()=>audio.play('flightCoin'));hud();
        if(state.status==='lost'){audio.play('crash');onHud({text:'Bonk! Coming in for a landing…'});}
      }
    }
    drawFlight(ctx,state,canvas.width,canvas.height,reducedMotion);frame=requestAnimationFrame(tick);
  }
  document.addEventListener?.('visibilitychange',()=>{last=0;if(document.hidden)audio.stop();},options);
  frame=requestAnimationFrame(tick);
  return {setView(view){if(destroyed||!['side','firstperson'].includes(view))return false;settings={...settings,view};state.settings={...state.settings,view};return true;},start(){audio.stop();audio.unlock();state=createFlightState(settings);state.status='playing';active=true;paused=false;last=0;flapSoundAt=-Infinity;flap();hud();canvas.focus();},pause(value){paused=value;last=0;if(value)audio.stop();},input:flap,setMuted:value=>audio.setMuted(value),setCharacter(value){settings=validateFlightSettings(value.flight);if(!active)state=createFlightState(settings);},destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);controller.abort();audio.destroy();finish();}};
}
