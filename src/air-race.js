import { AIR_DIFFICULTIES } from './system.js';
import { createMazeAudio } from './maze-audio.js';

export const AIR_WIDTH=900, AIR_HEIGHT=650;
export const AIR_COURSE=[
  [0,0],[-.55,-.25],[.35,-.45],[.65,.2],[-.3,.4],[-.7,-.2],
  [.15,-.5],[.7,-.1],[.2,.45],[-.6,.2],[-.2,-.35],[0,0],
].map(([x,y],index)=>({x,y,z:500+index*400}));
export const HOOP_RADIUS=.38;
// About 15 screen pixels of edge forgiveness at the hoop crossing.
// Wings and tail may clip the rim without turning a close pass into a crash.
export const HOOP_EDGE_GRACE=15/230;
const airClamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const formatRaceTime=ms=>ms==null?'—':(ms/1000).toFixed(2)+'s';

export function createAirCourse(difficulty='sloth',random=Math.random){
  const config=AIR_DIFFICULTIES[difficulty]||AIR_DIFFICULTIES.sloth;
  let previous={x:0,y:0};
  return AIR_COURSE.map((gate,index)=>{
    const jitter=()=>config.random*(random()*2-1);
    // Limit travel between successive gates so every course remains flyable at boost speed.
    const x=index===0?0:airClamp(gate.x*config.spread+jitter(),Math.max(-1.15,previous.x-1.3),Math.min(1.15,previous.x+1.3));
    const y=index===0?0:airClamp(gate.y*config.spread+jitter(),Math.max(-.75,previous.y-.85),Math.min(.75,previous.y+.85));
    previous={x,y};
    return {...gate,x,y,angle:config.tilt?(random()*2-1)*config.tilt:0,squash:config.tilt ? .78+random()*.18 : 1};
  });
}
export function insideAirHoop(s,gate){
  const config=AIR_DIFFICULTIES[s.difficulty]||AIR_DIFFICULTIES.sloth,angle=gate.angle||0;
  const dx=s.x-gate.x,dy=s.y-gate.y;
  const across=dx*Math.cos(angle)+dy*Math.sin(angle),along=-dx*Math.sin(angle)+dy*Math.cos(angle);
  return Math.hypot(across/(config.radius*(gate.squash||1)+HOOP_EDGE_GRACE),along/(config.radius+HOOP_EDGE_GRACE))<=1;
}
export function createAirState(difficulty='sloth'){
  if(!Object.hasOwn(AIR_DIFFICULTIES,difficulty))difficulty='sloth';
  return {difficulty,course:createAirCourse(difficulty),x:0,y:0,bank:0,distance:0,time:0,energy:100,passed:0,earned:0,status:'ready',fallTime:0,flash:0,boost:false};
}
export function tickAirRace(s,dt,controls={},emit=()=>{}){
  if(s.status==='falling'){
    s.fallTime=Math.min(1.8,s.fallTime+airClamp(dt,0,.1));
    if(s.fallTime>=1.8)s.status='lost';
    return;
  }
  if(s.status!=='playing')return;
  let remaining=airClamp(dt,0,.1);
  while(remaining>1e-8&&s.status==='playing'){
    const config=AIR_DIFFICULTIES[s.difficulty],speed=controls.boost?config.boost:config.speed,gate=s.course[s.passed];
    // Split exactly at each hoop plane so race times do not depend on frame rate.
    const untilGate=(gate.z-s.distance)/speed;
    const step=Math.min(remaining,1/120,Math.max(0,untilGate));
    const dx=controls.target?airClamp((controls.target.x-s.x)*6,-2.2,2.2):airClamp(controls.x||0,-1,1)*2.2;
    const dy=controls.target?airClamp((controls.target.y-s.y)*6,-2.2,2.2):airClamp(controls.y||0,-1,1)*2.2;
    s.x=airClamp(s.x+dx*step,-1.45,1.45);s.y=airClamp(s.y+dy*step,-.95,.95);
    s.bank=dx*.25;s.boost=Boolean(controls.boost);s.time+=step;s.distance+=speed*step;
    s.energy=Math.max(0,s.energy-(controls.boost?32:14)*step);
    s.flash=Math.max(0,s.flash-step);remaining-=step;
    if(s.distance>=gate.z-1e-7){
      if(!insideAirHoop(s,gate)){
        s.energy=0;s.status='falling';emit('crash');break;
      }
      s.passed++;s.earned=s.passed*config.coins;s.energy=100;s.flash=.3;emit('flightCoin');
      if(s.passed===s.course.length){s.status='won';emit('win');break;}
    }else if(s.energy<=0){s.status='falling';emit('crash');break;}
  }
}
function shape(ctx,points,color){
  ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
}
function drawPlaneAccessories(ctx,look,time=0,sideView=false){
  const color=look.accessoryColor||'#d34c65';
  ctx.save();ctx.strokeStyle='#293d4b';ctx.lineWidth=1.4;ctx.lineJoin='round';
  const panel=(points,fill)=>{shape(ctx,points,fill);ctx.stroke();};
  if(look.scarf&&look.scarf!=='none'){
    const length=look.scarf==='long'?47:25,flutter=Math.sin(time*7)*4;
    if(sideView){
      panel([[-13,-16],[-length-25,-9+flutter],[-length-18,-2+flutter],[-length-26,3+flutter],[-12,-7]],color);
      panel([[-16,-25],[-6,-23],[-7,16],[-17,14]],color);
    }else{
      panel([[-7,0],[-length,14+flutter],[-length+8,18+flutter],[-length,23+flutter],[1,8]],color);
      panel([[-11,-3],[11,-3],[11,5],[-11,5]],color);
    }
  }
  ctx.translate(0,sideView?-29:-22);
  if(look.hat==='cap'){
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,-3,13,Math.PI,Math.PI*2);ctx.closePath();ctx.fill();ctx.stroke();
    panel([[-15,-3],[21,-3],[24,1],[-15,1]],color);
    ctx.strokeStyle='#ffffff88';ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(0,-3);ctx.stroke();
  }else if(look.hat==='tophat'){
    panel([[-11,0],[-10,-25],[10,-25],[11,0]],'#344052');
    ctx.fillStyle=color;ctx.fillRect(-10,-8,20,6);
    panel([[-18,0],[18,0],[18,4],[-18,4]],'#344052');
  }else if(look.hat==='crown'){
    panel([[-14,1],[-17,-18],[-7,-10],[0,-23],[7,-10],[17,-18],[14,1]],'#edc45e');
    ctx.fillStyle=color;for(const x of [-9,0,9]){ctx.beginPath();ctx.arc(x,-5,2.5,0,7);ctx.fill();}
  }else if(look.hat==='beanie'){
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,-6,14,16,0,Math.PI,Math.PI*2);ctx.fill();ctx.stroke();
    panel([[-15,-7],[15,-7],[15,1],[-15,1]],color);
    ctx.fillStyle='#fff0d7';ctx.beginPath();ctx.arc(0,-25,5,0,7);ctx.fill();ctx.stroke();
  }
  ctx.restore();
}
export function drawAirplane(ctx,x,y,size,look={},bank=0,time=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(bank);ctx.scale(size/100,size/100);
  const color=look.color||'#ed6e40',jet=look.style==='jet',swept=look.style==='swept'||look.style==='stealth',biplane=look.style==='biplane';
  // Chase camera: foreshortened fuselage, broad horizontal wings, and the
  // nearest tail in front of the cabin. The nose points away into the course.
  ctx.strokeStyle='#263b48';ctx.lineWidth=1.4;ctx.lineJoin='round';
  const panel=(points,fill)=>{shape(ctx,points,fill);ctx.stroke();};
  const oval=(cx,cy,rx,ry,fill)=>{
    ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  };
  if(!jet){
    ctx.save();ctx.translate(0,-8);ctx.rotate(time*55);
    ctx.fillStyle='#d8eff766';ctx.fillRect(-17,-1,34,2);ctx.restore();
  }
  if(look.style==='glider')panel([[-6,-2],[-83,1],[-83,5],[0,6],[83,5],[83,1],[6,-2]],'#f6f3e8');
  if(look.style==='seaplane')for(const side of [-1,1]){
    panel([[side*20,5],[side*20,17],[side*23,17],[side*23,5]],'#405365');
    oval(side*22,21,13,5,'#d4e0e6');
  }
  if(look.style==='stealth')panel([[-6,-15],[-67,15],[-26,10],[0,19],[26,10],[67,15],[6,-15]],'#354858');
  if(look.style==='rocket'){
    for(const side of [-1,1]){
      oval(side*17,7,7,11,'#dce9ef');
      panel([[side*17-4,16],[side*17,28+Math.sin(time*18)*3],[side*17+4,16]],'#f7ae54');
    }
  }
  // The distant cabin sits above the wings; the nearer tail hides its center.
  oval(0,-3,jet?10:8,12,jet?'#f5f8fa':color);
  oval(0,-10,jet?6:5,4,'#79b8d0');
  const wingColor=jet?'#f5f8fa':color;
  panel(swept||jet?
    [[-7,-2],[-61,8],[-59,13],[-6,6],[6,6],[59,13],[61,8],[7,-2]]:
    [[-7,-1],[-59,1],[-59,7],[-7,6],[7,6],[59,7],[59,1],[7,-1]],wingColor);
  for(const side of [-1,1]){
    panel([[side*48,3],[side*57,4],[side*57,8],[side*48,7]],jet?color:'#fff0cc');
    if(jet){
      // Circular exhausts face the chase camera under each wing.
      oval(side*25,10,7,7,'#e5edf2');
      oval(side*25,10,4.5,4.5,'#344455');
      oval(side*25,10,2,2,'#758b9d');
      panel([[side*58,9],[side*62,-1],[side*64,0],[side*62,12]],color);
    }
  }
  if(biplane){
    for(const side of [-1,1]){
      ctx.beginPath();ctx.moveTo(side*37,3);ctx.lineTo(side*37,-11);ctx.stroke();
    }
    panel([[-56,-13],[56,-13],[56,-8],[-56,-8]],color);
  }
  oval(0,7,7,8,jet?'#e0e9ee':color);
  panel([[-3,6],[-24,11],[-24,15],[0,12],[24,15],[24,11],[3,6]],wingColor);
  // Upright vertical stabilizer, closest to the viewer.
  panel([[-2,10],[-3,-15],[0,-24],[3,-15],[2,10]],color);
  ctx.strokeStyle='#ffffff99';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(0,7);ctx.stroke();
  oval(0,13,2.5,2,'#40586b');
  drawPlaneAccessories(ctx,look,time);
  ctx.restore();
}

export function drawAirScenery(ctx,background='valley',distance=0){
  const palettes={
    valley:['#77b8d4','#d9e9d9','#f4dfb5','#739c9c','#638f7b','#7eb5bf'],
    sunset:['#685c9e','#f3a16c','#ffdfa0','#ac6d91','#875f86','#e9aa86'],
    ocean:['#489dc8','#b3e8ed','#8ecdd7','#6aa8a5','#408f99','#4ca5c1'],
    desert:['#75b8cf','#f8dfad','#e9b17b','#cb895f','#ac6d4e','#deb07b'],
    snow:['#77a5cf','#e2edf7','#eef4fa','#8da6bd','#b6ccd9','#90bacd'],
    meadow:['#77c7d5','#d9f1c9','#b5d58e','#80ad7a','#578e60','#a7ce78'],
    aurora:['#172c50','#29586d','#5b8992','#29465e','#263c55','#45727b'],
    city:['#484679','#c28fbc','#efb8a1','#6c6889','#4a536f','#7587a4'],
  };
  const colors=palettes[background]||palettes.valley,night=background==='aurora'||background==='city';
  const sky=ctx.createLinearGradient(0,0,0,650);sky.addColorStop(0,colors[0]);sky.addColorStop(.65,colors[1]);sky.addColorStop(1,colors[2]);
  ctx.fillStyle=sky;ctx.fillRect(0,0,900,650);
  if(night)for(let i=0;i<50;i++){ctx.fillStyle='#fff5cf';ctx.fillRect((i*137)%900,85+(i*53)%270,2,2);}
  ctx.fillStyle=night?'#e4e9ee':'#fff2c8';ctx.beginPath();ctx.arc(740,130,night?29:48,0,7);ctx.fill();
  if(background==='meadow'){
    ctx.fillStyle='#ffe59c33';ctx.beginPath();ctx.arc(740,130,65,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#ffe6a0';ctx.lineWidth=4;
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(740+Math.cos(a)*60,130+Math.sin(a)*60);ctx.lineTo(740+Math.cos(a)*74,130+Math.sin(a)*74);ctx.stroke();
    }
    ctx.fillStyle='#fff4b8';ctx.beginPath();ctx.arc(740,130,44,0,Math.PI*2);ctx.fill();
  }
  if(background==='aurora'){
    for(let band=0;band<3;band++){
      ctx.strokeStyle=['#7be4bd55','#83bee855','#c08fe855'][band];ctx.lineWidth=28;
      ctx.beginPath();ctx.moveTo(0,170+band*35);ctx.bezierCurveTo(260,40+band*35,550,290,900,130+band*35);ctx.stroke();
    }
  }
  for(let i=0;i<7;i++){
    const x=((i*173-distance*.025)%1100+1100)%1100-100,y=130+(i%3)*63;
    ctx.fillStyle=night?'#cddce51a':'#ffffff88';ctx.beginPath();ctx.ellipse(x,y,65,14,0,0,7);ctx.ellipse(x+20,y-8,32,18,0,0,7);ctx.fill();
  }
  if(background==='meadow'){
    const field=ctx.createLinearGradient(0,420,0,650);field.addColorStop(0,'#a6cf83');field.addColorStop(1,'#5d9e54');ctx.fillStyle=field;ctx.fillRect(0,420,900,230);
    ctx.fillStyle='#bbd99a';ctx.fillRect(0,420,900,8);
  }else{
  shape(ctx,[[0,490],[100,340],[250,490],[410,350],[600,495],[770,370],[900,460],[900,650],[0,650]],colors[3]);
  shape(ctx,[[0,550],[170,450],[350,560],[570,450],[770,530],[900,480],[900,650],[0,650]],colors[4]);
  shape(ctx,[[390,470],[480,470],[720,650],[220,650]],colors[5]);
  }
  if(background==='snow')for(const [x,y] of [[100,340],[410,350],[770,370]])shape(ctx,[[x,y],[x-32,y+48],[x-8,y+35],[x+8,y+45],[x+33,y+49]],'#f4fafb');
  if(background==='ocean'){
    ctx.fillStyle=colors[5];ctx.fillRect(0,490,900,160);
    for(let i=0;i<6;i++){
      ctx.fillStyle='#e8d69a';ctx.beginPath();ctx.ellipse(i*175,520+(i%2)*60,65,12,0,0,7);ctx.fill();
      shape(ctx,[[i*175-46,521+(i%2)*60],[i*175,495+(i%2)*60],[i*175+42,521+(i%2)*60]],'#578b69');
    }
  }
  if(background==='desert')for(const x of [90,690,810])shape(ctx,[[x-40,570],[x-25,460],[x+25,460],[x+45,570]],'#b87953');
  if(background==='meadow')for(let i=0;i<90;i++){
    const x=(i*137+31)%900,y=438+(i*67)%205,r=2+(y-438)/65;
    ctx.strokeStyle='#407f48';ctx.lineWidth=Math.max(1,r*.45);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+r*3);ctx.stroke();
    ctx.fillStyle='#75b660';ctx.beginPath();ctx.ellipse(x+r,y+r*2,r*1.3,r*.5,-.5,0,7);ctx.fill();
    ctx.fillStyle=['#fff4d4','#f6a8c6','#bba7ec','#ffe196','#ef8eaa'][i%5];
    for(let petal=0;petal<5;petal++){
      const a=petal*Math.PI*2/5;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r,y+Math.sin(a)*r,r*.85,r*.65,a,0,7);ctx.fill();
    }
    ctx.fillStyle='#edb747';ctx.beginPath();ctx.arc(x,y,r*.55,0,7);ctx.fill();
  }
  if(background==='city')for(let i=0;i<18;i++){
    const x=i*53,h=65+(i*37)%120;ctx.fillStyle=i%2?'#3f4864':'#53617a';ctx.fillRect(x,580-h,46,h+70);
    ctx.fillStyle='#ffdfa7';for(let y=590-h;y<600;y+=18)for(let wx=8;wx<42;wx+=14)ctx.fillRect(x+wx,y,5,7);
  }
}

export function drawAirRace(ctx,s,look,width,height,bestMs=null,reducedMotion=false){
  ctx.save();ctx.scale(width/AIR_WIDTH,height/AIR_HEIGHT);
  drawAirScenery(ctx,look.background,s.distance);
  const config=AIR_DIFFICULTIES[s.difficulty],course=s.course,next=course[s.passed];
  // Far hoops are smaller; their centers converge toward the horizon.
  for(let index=course.length-1;index>=s.passed;index--){
    const gate=course[index],z=gate.z-s.distance;if(z>1900)continue;
    const scale=420/(420+Math.max(0,z)),x=450+gate.x*230*scale,y=315+gate.y*230*scale,r=config.radius*230*scale;
    ctx.strokeStyle=index===s.passed?'#fce494':'#d6ecda99';ctx.lineWidth=Math.max(2,10*scale);
    ctx.beginPath();ctx.ellipse(x,y,r*gate.squash,r,gate.angle,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=index===s.passed?'#b87b38':'#648a8e';ctx.lineWidth=Math.max(1,3*scale);
    ctx.beginPath();ctx.ellipse(x,y,(r+5*scale)*gate.squash,r+5*scale,gate.angle,0,Math.PI*2);ctx.stroke();
    if(index===s.passed){ctx.font=`bold ${Math.max(11,19*scale)}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#2b4652';ctx.fillText(String(index+1),x,y-r-12);}
  }
  if(next&&s.status!=='falling'&&s.status!=='lost'){
    const aligned=insideAirHoop(s,next);
    ctx.fillStyle='#203f4dd9';ctx.fillRect(245,92,410,34);
    ctx.fillStyle=aligned?'#c0f0b4':'#fff1ce';ctx.textAlign='center';ctx.font='15px sans-serif';
    ctx.fillText(aligned?'LINED UP — keep your heading!':'Steer toward the gold hoop',450,114);
  }
  const falling=s.status==='falling'||s.status==='lost';
  const drop=falling?(reducedMotion?s.fallTime*90:s.fallTime*s.fallTime*135):0;
  drawAirplane(ctx,450+s.x*230,315+s.y*230+drop,90,look,falling?(reducedMotion?0:s.fallTime*1.8):s.bank,reducedMotion?0:s.time+s.fallTime);
  ctx.fillStyle='#183e51e8';ctx.fillRect(20,18,860,61);ctx.fillStyle='#f2f0d8';ctx.font='bold 23px sans-serif';ctx.textAlign='left';
  ctx.fillText(formatRaceTime(Math.round(s.time*1000)),38,46);
  ctx.font='13px sans-serif';ctx.fillText('BEST '+formatRaceTime(bestMs),38,65);
  ctx.textAlign='center';ctx.font='bold 18px sans-serif';ctx.fillText(`HOOPS ${s.passed} / ${AIR_COURSE.length}`,450,44);
  ctx.font='12px sans-serif';ctx.fillText(config.name.toUpperCase()+' · '+(s.boost?'BOOSTING':'CRUISING'),450,65);
  ctx.textAlign='right';ctx.font='13px sans-serif';ctx.fillText('ENERGY',858,39);
  ctx.fillStyle='#102e3e';ctx.fillRect(698,49,160,12);
  ctx.fillStyle=s.energy>30?'#9cdaa5':'#ef9870';ctx.fillRect(698,49,160*s.energy/100,12);
  if(s.flash>0){ctx.fillStyle='#163f4f';ctx.textAlign='center';ctx.font='bold 20px sans-serif';ctx.fillText('ENERGY RESTORED +'+config.coins+(config.coins===1?' COIN':' COINS'),450,560);}
  if(falling){ctx.fillStyle='#213d50';ctx.textAlign='center';ctx.font='bold 28px sans-serif';ctx.fillText('MISSED HOOP — OUT OF ENERGY!',450,205);}
  if(s.status==='won'){ctx.fillStyle='#183e51e8';ctx.fillRect(210,190,480,100);ctx.fillStyle='#ffeba7';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText('FINISH!',450,232);ctx.font='22px sans-serif';ctx.fillText(formatRaceTime(Math.round(s.time*1000)),450,270);}
  ctx.restore();
}
function drawAirPassenger(ctx,x,y,{color,time=0,parachuting=false,bust=false}){
  ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.lineJoin='round';
  const outline='#293947',skin='#efbc93';
  const oval=(x,y,rx,ry,fill,stroke=true)=>{
    ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
    if(stroke){ctx.strokeStyle=outline;ctx.lineWidth=1.4;ctx.stroke();}
  };
  const panel=(points,fill)=>{shape(ctx,points,fill);ctx.strokeStyle=outline;ctx.lineWidth=1.4;ctx.stroke();};
  const limb=(points,fill,width)=>{
    for(const [paint,size] of [[outline,width+2],[fill,width]]){
      ctx.strokeStyle=paint;ctx.lineWidth=size;ctx.beginPath();
      points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    }
  };
  if(parachuting){
    ctx.fillStyle='#695447';ctx.beginPath();ctx.roundRect(-17,16,34,32,7);ctx.fill();ctx.strokeStyle=outline;ctx.lineWidth=2;ctx.stroke();
  }
  if(!bust){
    limb([[-7,42],[-9,57],[-15,67]],'#425b7b',9);
    limb([[7,42],[11,55],[17,65]],'#425b7b',9);
    oval(-17,69,8,4,'#293947');oval(20,67,8,4,'#293947');
    limb([[-21,71],[-11,71]],'#d6dfdf',1.5);limb([[14,69],[26,69]],'#d6dfdf',1.5);
  }
  panel([[-7,14],[-15,20],[-12,44],[12,44],[15,20],[7,14]],color);
  panel([[-7,14],[0,26],[7,14]],'#fff5df');
  limb([[0,27],[0,42]],'#ffffff99',1.5);
  if(parachuting){
    limb([[-12,22],[-23,14],[-26,1]],color,8);
    limb([[12,22],[23,14],[26,1]],color,8);
    oval(-26,-1,4.5,5,skin);oval(26,-1,4.5,5,skin);
    limb([[-9,17],[-5,41]],'#354454',3);limb([[9,17],[5,41]],'#354454',3);
    limb([[-12,37],[12,37]],'#354454',3);
    ctx.fillStyle='#e5bd65';ctx.fillRect(-3,34,6,6);ctx.fillStyle='#354454';ctx.fillRect(-1,36,2,2);
  }else{
    limb([[-12,21],[-21,29],[-25,24]],color,7);oval(-26,23,4,4,skin);
    const wave=Math.sin(time*7)*4;
    limb([[12,21],[24,10],[26+wave,-3]],color,7);oval(26+wave,-8,5,6,skin);
    for(let i=0;i<3;i++)limb([[23+wave+i*3,-10],[22+wave+i*3,-16]],skin,2);
  }
  oval(0,13,5,6,skin);
  oval(-15,0,4,6,skin);oval(15,0,4,6,skin);
  oval(0,-2,15,18,skin);
  oval(-5,-5,7,11,'#ffcfaa',false);
  // Swept hair, eyebrows, eye highlights, cheeks and an open smiling mouth.
  panel([[-15,0],[-17,-13],[-11,-21],[2,-23],[14,-18],[17,-8],[13,-2],[10,-13],[2,-12],[-7,-15],[-11,-6]],'#684332');
  limb([[-11,-15],[-4,-19],[5,-19]],'#986746',2);
  for(const side of [-1,1]){
    oval(side*6,-3,4,4.8,'#fffaf0',false);
    oval(side*6+1,-2,2.2,3,'#344c57',false);
    oval(side*6+1.5,-3,0.8,1,'#ffffff',false);
    limb([[side*6-3,-10],[side*6+3,-10]],'#684332',1.5);
    oval(side*10,5,3,1.6,'#df8f7d',false);
  }
  limb([[0,0],[-1,4],[2,4]],'#ca8d6c',1.2);
  oval(1,9,5,3.5,'#743f3a',false);
  ctx.fillStyle='#fff7e7';ctx.fillRect(-3,6.5,8,2);
  ctx.restore();
}
// Short canvas movies keep the selected paint and work offline on GitHub Pages.
export const AIR_ENDING_SECONDS=6;
export function drawAirEnding(ctx,won,time,look,width,height,reducedMotion=false){
  ctx.save();ctx.scale(width/900,height/650);
  const t=reducedMotion?4.5:time,color=look.color||'#ed6e40';
  drawAirScenery(ctx,look.background,t*100);
  if(won){
    // A checkered finish arch remains behind the airplane after it crosses.
    ctx.fillStyle='#496072';ctx.fillRect(420,150,9,400);ctx.fillRect(735,150,9,400);
    for(let row=0;row<3;row++)for(let col=0;col<16;col++){
      ctx.fillStyle=(row+col)%2?'#263b48':'#fff9e9';ctx.fillRect(420+col*20,150+row*16,20,16);
    }
    ctx.fillStyle='#263b48';ctx.textAlign='center';ctx.font='bold 27px sans-serif';ctx.fillText('FINISH',580,130);
  }
  // Side-on cinematic view, flying toward the right.
  const progress=airClamp(t/2.4,0,1);
  const px=won?120+progress*460:240+Math.min(t,3)*105;
  const py=won?330-Math.sin(progress*Math.PI)*40:270+Math.max(0,t-.8)**2*65;
  ctx.save();ctx.translate(px,py);ctx.rotate(won?-.06:Math.min(t*.25,1.15));
  ctx.strokeStyle='#263b48';ctx.lineWidth=3;ctx.lineJoin='round';
  const panel=(points,fill)=>{shape(ctx,points,fill);ctx.stroke();};
  panel([[-88,-12],[-108,-70],[-84,-70],[-48,-12]],color);
  ctx.fillStyle='#f6fafb';ctx.beginPath();ctx.ellipse(0,0,112,29,0,0,7);ctx.fill();ctx.stroke();
  panel([[-20,7],[-80,58],[-44,62],[42,11]],color);
  ctx.fillStyle=color;ctx.fillRect(-65,13,140,6);
  ctx.fillStyle='#315572';
  for(let i=0;i<6;i++)ctx.fillRect(-55+i*23,-13,12,14);
  panel([[79,-22],[95,-15],[103,-4],[79,-4]],'#63c2e1');
  drawPlaneAccessories(ctx,look,t,true);
  if(won&&t>2.5){
    const rise=airClamp((t-2.5)*3,0,1);
    ctx.save();
    // Reveal the clothed passenger from the window as they rise and wave.
    ctx.beginPath();ctx.rect(5,-110,90,100);ctx.clip();
    drawAirPassenger(ctx,43,8-rise*59,{color,time:t,bust:true});
    ctx.restore();
  }
  ctx.restore();
  if(!won&&t>1){
    const escape=airClamp((t-1)/1.2,0,1),deployed=t>=2.2;
    const personX=390+escape*110,personY=290-escape*50+Math.max(0,t-2.2)*24;
    if(deployed){
      const open=airClamp((t-2.2)*3,0,1),r=80*open;
      ctx.strokeStyle='#40536a';ctx.lineWidth=2;
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(personX+side*r,personY-110);ctx.lineTo(personX+side*35,personY-1);ctx.stroke();
      }
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(personX,personY-110,r,Math.PI,Math.PI*2);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#fff4ca';ctx.beginPath();ctx.ellipse(personX,personY-110,r*.28,r,0,Math.PI,Math.PI*2);ctx.fill();
    }
    ctx.save();ctx.translate(personX,personY);ctx.scale(1.35,1.35);
    drawAirPassenger(ctx,0,0,{color,time:t,parachuting:true});
    ctx.restore();
  }
  if(t>=3.2){
    ctx.fillStyle='#fffdf2';ctx.strokeStyle='#263b48';ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect(300,45,300,74,22);ctx.fill();ctx.stroke();
    shape(ctx,[[480,117],[500,142],[505,117]],'#fffdf2');
    ctx.textAlign='center';ctx.fillStyle='#263b48';ctx.font='bold 38px sans-serif';ctx.fillText(won?'You win!':'You lose.',450,95);
    ctx.font='18px sans-serif';ctx.fillText(won?'A first-class finish!':'Passenger safely parachuting!',450,588);
  }
  ctx.restore();
}
export function drawAirPreview(canvas,character){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const s=createAirState(character.plane?.difficulty);s.distance=300;drawAirRace(ctx,s,character.plane,canvas.width,canvas.height);
}
export function createAirRace({canvas,character,bestTimeMs=null,bestTimes={},onHud,onFinish}){
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser does not support canvas.');
  const audio=createMazeAudio(),controller=new AbortController(),options={signal:controller.signal},keys=new Set();
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  let state=createAirState(character.plane?.difficulty),active=false,paused=false,destroyed=false,frame,last=0,target=null,touchBoost=false,pointer=null;
  let look={...character.plane},best=bestTimes[state.difficulty]??bestTimeMs,ending=null;
  function clearInput(){keys.clear();target=null;pointer=null;touchBoost=false;state.boost=false;}
  function hud(){onHud({raceBoost:state.boost&&state.status==='playing',text:`${AIR_DIFFICULTIES[state.difficulty].name} · ${state.earned} coins · Hoops ${state.passed}/${AIR_COURSE.length} · ${formatRaceTime(Math.round(state.time*1000))} · Best ${formatRaceTime(best)} · Energy ${Math.ceil(state.energy)}%`});}
  function finish(){
    if(!active)return;active=false;
    const timeMs=state.status==='won'?Math.max(1,Math.round(state.time*1000)):null,newBest=timeMs!==null&&(best===null||timeMs<best);
    if(newBest){best=timeMs;bestTimes[state.difficulty]=timeMs;}
    onFinish(state.earned,{title:state.status==='won'?(newBest?'New personal best!':'Course complete!'):state.status==='lost'?'Your plane ran out of energy.':'Flight saved.',
      timeMs,detail:`${state.passed}/${AIR_COURSE.length} hoops · ${state.status==='won'?'Finish':'Attempt'} ${formatRaceTime(Math.round(state.time*1000))} · Best ${formatRaceTime(best)}`});
  }
  canvas.addEventListener('keydown',e=>{
    const key=e.key.length===1?e.key.toLowerCase():e.key;
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' '].includes(key))return;
    e.preventDefault();if(active&&!paused&&state.status==='playing'){keys.add(key);if(key!==' ')target=null;audio.unlock();}
  },options);
  globalThis.window?.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key),options);
  canvas.addEventListener('blur',clearInput,options);
  const aim=e=>{const rect=canvas.getBoundingClientRect();target={x:airClamp(((e.clientX-rect.left)/rect.width*900-450)/230,-1.45,1.45),y:airClamp(((e.clientY-rect.top)/rect.height*650-315)/230,-.95,.95)};};
  canvas.addEventListener('pointerdown',e=>{
    if(!active||paused||state.status!=='playing')return;
    e.preventDefault();canvas.focus();audio.unlock();pointer=e.pointerId;canvas.setPointerCapture?.(e.pointerId);aim(e);
  },options);
  canvas.addEventListener('pointermove',e=>{if(e.pointerId===pointer)aim(e);},options);
  canvas.addEventListener('pointerup',()=>{pointer=null;target=null;},options);
  canvas.addEventListener('pointercancel',()=>{pointer=null;target=null;},options);
  document.addEventListener?.('visibilitychange',()=>{last=0;clearInput();if(document.hidden)audio.stop();},options);
  function tick(now){
    if(destroyed)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
    if(active&&!paused&&!document.hidden){
      const controls={x:Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),y:Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w')),target,boost:keys.has(' ')||touchBoost};
      if(!ending){
        tickAirRace(state,dt,controls,event=>audio.play(event));
        if(state.status==='won'||state.status==='falling'){
          ending={won:state.status==='won',time:0,spoken:false};clearInput();
          if(!ending.won)state.status='lost';
        }
      }else{
        ending.time=Math.min(AIR_ENDING_SECONDS,ending.time+dt);
        if(ending.time>=3.2&&!ending.spoken){
          ending.spoken=true;audio.say(ending.won?'You win!':'You lose.',ending.won?1.15:1);
        }
        if(ending.time>=AIR_ENDING_SECONDS)finish();
      }
      hud();
    }
    if(ending)drawAirEnding(ctx,ending.won,ending.time,look,canvas.width,canvas.height,reduced);
    else drawAirRace(ctx,state,look,canvas.width,canvas.height,best,reduced);frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  return {
    start(){audio.stop();audio.unlock();clearInput();ending=null;state=createAirState(look.difficulty);best=bestTimes[state.difficulty]??(state.difficulty==='sloth'?bestTimeMs:null);state.status='playing';active=true;paused=false;last=0;hud();canvas.focus();},
    pause(value){paused=value;last=0;clearInput();if(value)audio.stop();},
    setBoost(value){if(active&&!paused&&state.status==='playing'){touchBoost=Boolean(value);canvas.focus({preventScroll:true});}},
    setCharacter(value){look={...value.plane};if(!active&&state.difficulty!==(look.difficulty??'sloth')){state=createAirState(look.difficulty);ending=null;best=bestTimes[state.difficulty]??(state.difficulty==='sloth'?bestTimeMs:null);}},
    setMuted:value=>audio.setMuted(value),
    destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);controller.abort();audio.destroy();finish();}
  };
}
