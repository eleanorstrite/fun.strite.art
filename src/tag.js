import { createMazeAudio } from './maze-audio.js';

export const TAG_ROUND_SECONDS=60;
export const TAG_LAYOUTS={
  park:{name:'Playground',platforms:[[100,430,180],[620,430,180],[330,335,240],[65,240,190],[645,240,190]],trampolines:[360,540]},
  towers:{name:'Twin towers',platforms:[[85,440,160],[655,440,160],[180,345,170],[550,345,170],[340,245,220],[30,155,180],[690,155,180]],trampolines:[80,820]},
  steps:{name:'Sky steps',platforms:[[60,445,160],[265,365,160],[475,285,160],[680,365,160],[690,175,170],[160,185,190]],trampolines:[450,785]},
};
export const TAG_BACKGROUNDS={forest:'Forest',sunset:'Sunset hills',city:'City rooftops',snow:'Snowy mountains'};
export const TAG_ANIMALS={person:'Person',dragon:'Dragon',cat:'Cat',dog:'Dog'};
export const TAG_OUTFITS={shirt:'T-shirt',hoodie:'Hoodie',stripes:'Striped sweater',cape:'Hero cape'};
export const TAG_HATS={none:'No hat',cap:'Cap',crown:'Crown',beanie:'Beanie'};
export const TAG_ACCESSORIES={none:'No accessory',glasses:'Glasses',scarf:'Scarf',wings:'Wings'};
export function defaultTagSettings(){return {mode:'computer',layout:'park',background:'forest',players:[{animal:'person',color:'#ed6e40',outfit:'hoodie',hat:'cap',accessory:'none'},{animal:'dragon',color:'#8a78d1',outfit:'shirt',hat:'none',accessory:'scarf'}]};}
export function validateTagSettings(value){
  const result=defaultTagSettings();
  if(!value||typeof value!=='object')return result;
  if(['computer','local'].includes(value.mode))result.mode=value.mode;
  if(Object.hasOwn(TAG_LAYOUTS,value.layout))result.layout=value.layout;
  if(Object.hasOwn(TAG_BACKGROUNDS,value.background))result.background=value.background;
  for(let i=0;i<2;i++){
    const look=value.players?.[i];if(!look)continue;
    for(const [key,options] of Object.entries({animal:TAG_ANIMALS,outfit:TAG_OUTFITS,hat:TAG_HATS,accessory:TAG_ACCESSORIES}))if(Object.hasOwn(options,look[key]))result.players[i][key]=look[key];
    if(typeof look.color==='string'&&/^#[0-9a-f]{6}$/i.test(look.color))result.players[i].color=look.color;
  }
  return result;
}
const tagClamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function createTagState(settings=defaultTagSettings(),tagger=0){return {settings:validateTagSettings(settings),status:'ready',countdown:3,time:0,tagger,grace:0,flash:0,winner:null,players:[180,720].map(x=>({x,y:540,vx:0,vy:0,grounded:true,jumpHeld:false,facing:1,aiWait:0,aiThink:.2,aiInput:{}}))};}
export function tagComputerInput(s){
  const p=s.players[1],other=s.players[0],chasing=s.tagger===1;
  let direction=Math.sign(chasing?other.x-p.x:p.x-other.x);
  if(!chasing&&(p.x<65||p.x>835))direction=p.x<450?1:-1;
  const above=other.y<p.y-40;
  if(chasing&&above){
    const steps=TAG_LAYOUTS[s.settings.layout].platforms.filter(([x,y,w])=>y<p.y-5&&p.y-y<=125);
    steps.sort((a,b)=>Math.abs(tagClamp(other.x,a[0]+20,a[0]+a[2]-20)-other.x)+Math.abs(a[0]+a[2]/2-p.x)*.25-(Math.abs(tagClamp(other.x,b[0]+20,b[0]+b[2]-20)-other.x)+Math.abs(b[0]+b[2]/2-p.x)*.25));
    if(steps.length){const [x,,w]=steps[0];direction=Math.sign(tagClamp(other.x,x+22,x+w-22)-p.x);}
  }
  if(chasing&&p.grounded&&other.y>p.y+45){
    const ledge=TAG_LAYOUTS[s.settings.layout].platforms.find(([x,y,w])=>Math.abs(p.y-y)<1&&p.x>=x-15&&p.x<=x+w+15);
    if(ledge){const [x,,w]=ledge;direction=p.x-x<x+w-p.x?-1:1;}
  }
  const platformAhead=TAG_LAYOUTS[s.settings.layout].platforms.some(([x,y,w])=>y<p.y&&p.y-y<145&&p.x+direction*85>x-20&&p.x+direction*85<x+w+20);
  return {left:direction<0,right:direction>0,jump:p.grounded&&p.aiWait<=0&&(chasing?above:platformAhead||Math.abs(p.x-other.x)<170)};
}
export function tickTag(s,seconds,inputs=[{},{}],emit=()=>{}){
  const dt=tagClamp(seconds,0,.05);
  if(s.status==='countdown'){const before=Math.ceil(s.countdown);s.countdown=Math.max(0,s.countdown-dt);if(Math.ceil(s.countdown)!==before)emit(s.countdown===0?'win':'gem');if(s.countdown===0)s.status='playing';return;}
  if(s.status!=='playing')return;
  s.time=Math.min(TAG_ROUND_SECONDS,s.time+dt);s.grace=Math.max(0,s.grace-dt);s.flash=Math.max(0,s.flash-dt);
  const layout=TAG_LAYOUTS[s.settings.layout];
  for(let i=0;i<2;i++){
    const p=s.players[i],computer=i===1&&s.settings.mode==='computer';
    if(computer){
      p.aiThink=Math.max(0,p.aiThink-dt);
      if(p.aiThink===0){p.aiInput=tagComputerInput(s);p.aiThink=.25;}
    }
    const input=computer?p.aiInput:inputs[i]||{};
    p.aiWait=Math.max(0,p.aiWait-dt);
    const direction=Number(Boolean(input.right))-Number(Boolean(input.left));
    p.vx+=(direction*(computer?230:270)-p.vx)*Math.min(1,dt*(computer?(p.grounded?10:6):(p.grounded?15:8)));if(direction)p.facing=direction;
    if(input.jump&&!p.jumpHeld&&p.grounded){p.vy=-540;p.grounded=false;p.aiWait=.35;emit('bounce');}p.jumpHeld=Boolean(input.jump);
    const oldY=p.y;p.vy+=1200*dt;p.x=tagClamp(p.x+p.vx*dt,24,876);p.y+=p.vy*dt;p.grounded=false;
    const surfaces=[...layout.platforms,[0,540,900]].sort((a,b)=>a[1]-b[1]);
    if(p.vy>=0)for(const [x,y,w] of surfaces){
      if(oldY<=y+.01&&p.y>=y&&p.x+15>x&&p.x-15<x+w){
        p.y=y;p.vy=0;p.grounded=true;
        if(y===540&&layout.trampolines.some(tx=>Math.abs(tx-p.x)<38)){p.vy=-860;p.grounded=false;emit('bounce');}
        break;
      }
    }
    if(p.y<75){p.y=75;p.vy=Math.max(0,p.vy);}
  }
  const [a,b]=s.players;
  if(s.grace===0&&Math.abs(a.x-b.x)<35&&Math.abs(a.y-b.y)<45){s.tagger=1-s.tagger;s.grace=1.5;s.flash=.7;emit('gem');}
  if(s.time>=TAG_ROUND_SECONDS){s.status='finished';s.winner=1-s.tagger;emit('win');}
}
function tagOval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function tagShape(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function tagRound(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function tagGradient(c,y1,y2,colors){
  const g=c.createLinearGradient(0,y1,0,y2);if(!g?.addColorStop)return colors[0];
  colors.forEach((color,i)=>g.addColorStop(i/(colors.length-1),color));return g;
}
function tagCloud(c,x,y,scale=1){
  c.save();c.translate(x,y);c.scale(scale,scale);
  for(const [xx,yy,rx,ry] of [[0,0,49,13],[-24,-9,22,18],[3,-18,27,24],[28,-7,23,16]])tagOval(c,xx,yy,rx,ry,'#ffffff70');c.restore();
}
function tagPine(c,x,y,size,color){
  c.fillStyle='#465d6344';c.fillRect(x-3*size,y-58*size,6*size,62*size);
  for(let i=0;i<3;i++)tagShape(c,[[x,y-(110-i*24)*size],[x-(21+i*6)*size,y-(51-i*24)*size],[x+(21+i*6)*size,y-(51-i*24)*size]],color);
}
function drawTagBackdrop(c,theme,time){
  const skies={forest:['#74b8c0','#c7e5d1','#f3edcd'],sunset:['#786caf','#e9a2ad','#ffddb1'],city:['#354773','#788abd','#d3c1d5'],snow:['#729ab7','#c2ddeb','#f0f5ef']};
  c.fillStyle=tagGradient(c,0,540,skies[theme]);c.fillRect(0,0,900,600);
  for(let i=3;i>0;i--)tagOval(c,742,125,45+i*16,45+i*16,'#fff1c514');
  tagOval(c,742,125,40,40,theme==='city'?'#f7edda':'#fff2c4');
  for(let i=0;i<5;i++)tagCloud(c,(i*221+time*2)%1120-80,100+(i*47)%100,.65+i%3*.18);
  if(theme==='city'){
    for(let layer=0;layer<2;layer++)for(let i=0;i<13;i++){
      const x=i*83-layer*31,h=100+(i*73+layer*37)%220,y=540-h;
      tagRound(c,x,y,65,h,3,layer?'#536380':'#7e8cac');
      c.fillStyle=layer?'#75839a':'#a7afc2';c.fillRect(x-3,y,71,6);c.fillRect(x+9,y-13,30,13);
      c.strokeStyle='#b6bed155';c.lineWidth=2;c.beginPath();c.moveTo(x+20,y-12);c.lineTo(x+20,y-35);c.stroke();
      c.fillStyle=layer?'#f1d2a5':'#c4c9d5';for(let yy=y+20;yy<530;yy+=25)for(let j=0;j<3;j++)if((i+j+yy)%4)c.fillRect(x+10+j*17,yy,7,12);
    }
  }else{
    for(let layer=0;layer<3;layer++){
      c.fillStyle=(theme==='snow'?['#b2ccd9','#8eafc3','#7096ad']:theme==='sunset'?['#bea4bd','#a38fae','#817f9b']:['#acc9ba','#8bb7a4','#6d9e90'])[layer];
      c.beginPath();c.moveTo(0,540);
      for(let x=-100;x<=1050;x+=150){const y=310+layer*65+Math.sin(x*.013+layer*2)*40;c.lineTo(x,y);if(theme==='snow')c.lineTo(x+75,y-110);else c.quadraticCurveTo(x+75,y-65,x+150,y);}
      c.lineTo(1000,550);c.closePath();c.fill();
      if(theme==='snow')for(let i=0;i<7;i++){const x=-100+i*150,y=310+layer*65+Math.sin(x*.013+layer*2)*40;tagShape(c,[[x+41,y-58],[x+75,y-110],[x+112,y-54],[x+83,y-67],[x+68,y-57]],'#e6f1f3bb');}
    }
    if(theme==='forest')for(let i=0;i<10;i++){
      const x=i*108-20,y=532,sz=.75+(i%3)*.23;
      c.fillStyle='#526e62';c.fillRect(x-6,355,12,185);
      c.strokeStyle='#526e62';c.lineWidth=6;c.beginPath();c.moveTo(x,440);c.lineTo(x-26,401);c.moveTo(x,410);c.lineTo(x+24,370);c.stroke();
      for(const [dx,dy,r,color] of [[-22,-155,34,'#4f8d77'],[22,-170,40,'#5b9d80'],[0,-200,46,'#70ab88'],[-14,-214,23,'#8abc96']])tagOval(c,x+dx,y+dy*sz,r*sz,r*sz,color);
    }
    else for(let i=0;i<16;i++)tagPine(c,i*67,540,.35+(i%4)*.12,theme==='snow'?'#527d8b':'#686c89');
  }
  if(theme==='snow')for(let i=0;i<36;i++)tagOval(c,(i*139+Math.sin(time*.4+i)*10)%900,(i*83+time*9)%540,1.5+i%2,1.5+i%2,'#ffffffaa');
  if(theme==='sunset')for(let i=0;i<4;i++){const x=190+i*26,y=155+Math.sin(i)*9;c.strokeStyle='#6b637b';c.lineWidth=2;c.beginPath();c.moveTo(x-7,y);c.quadraticCurveTo(x-3,y-6,x,y);c.quadraticCurveTo(x+3,y-6,x+7,y);c.stroke();}
}
function drawTagPlatform(c,x,y,w,theme){
  tagRound(c,x+5,y+10,w,25,9,'#28354625');
  tagRound(c,x,y,w,24,6,tagGradient(c,y,y+24,theme==='city'?['#72859c','#3c526a']:['#a38265','#695545']));
  c.save();c.beginPath();c.rect(x+4,y+6,w-8,16);c.clip();
  c.strokeStyle=theme==='city'?'#b8d7eb66':'#d9b58b66';c.lineWidth=2;
  for(let xx=x+12;xx<x+w;xx+=31){c.beginPath();c.moveTo(xx,y+7);c.lineTo(xx-4,y+22);c.moveTo(xx+2,y+15);c.lineTo(xx+25,y+15);c.stroke();}
  c.restore();
  tagRound(c,x-2,y,w+4,7,3,theme==='snow'?'#f2fbff':theme==='city'?'#9cd4dc':'#a3c87c');
  c.fillStyle=theme==='snow'?'#ffffff':theme==='city'?'#d1f3f5':'#d4e6a2';c.fillRect(x+3,y,w-6,2);
  if(theme==='snow')for(let xx=x+15;xx<x+w;xx+=35)tagShape(c,[[xx,y+24],[xx+9,y+24],[xx+3,y+38]],'#b5deeb');
  if(theme==='forest')for(let xx=x+20;xx<x+w;xx+=65){c.strokeStyle='#678b57';c.lineWidth=2;c.beginPath();c.moveTo(xx,y+23);c.quadraticCurveTo(xx-9,y+42,xx+3,y+48);c.stroke();tagOval(c,xx-4,y+34,5,2,'#8eb67a');tagOval(c,xx+1,y+43,5,2,'#8eb67a');}
}
export function drawTagCharacter(c,p,look,time=0){
  c.save();c.translate(p.x,p.y);c.scale(p.facing,1);
  const stride=p.grounded?Math.sin(time*15)*Math.min(5,Math.abs(p.vx)/40):3;
  if(look.outfit==='cape')tagShape(c,[[-12,-40],[-30,-15],[-19,-4],[3,-16]],'#f2bf57');
  if(look.accessory==='wings'||look.animal==='dragon'){
    tagShape(c,[[-12,-35],[-37,-53],[-31,-21],[-15,-19]],look.color);tagShape(c,[[12,-35],[34,-49],[29,-18],[15,-19]],'#f2c985');
  }
  if(look.animal!=='person'){c.strokeStyle=look.color;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(-9,-16);c.quadraticCurveTo(-35,-8,-28,-32);c.stroke();}
  c.strokeStyle='#293848';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(-7,-15);c.lineTo(-9-stride,-3);c.moveTo(7,-15);c.lineTo(9+stride,-3);c.stroke();
  tagRound(c,-16,-40,32,28,9,'#283c5044');
  tagRound(c,-15,-39,30,26,8,tagGradient(c,-39,-13,[look.color,look.color,'#344357']));
  tagOval(c,-8,-34,4,7,'#ffffff22');
  if(look.outfit==='hoodie'){c.strokeStyle='#ffffff77';c.lineWidth=2;c.strokeRect(-8,-26,16,9);c.beginPath();c.moveTo(-5,-38);c.lineTo(-5,-29);c.moveTo(5,-38);c.lineTo(5,-29);c.stroke();}
  if(look.outfit==='stripes'){c.fillStyle='#fff4dc';for(let y=-35;y<-17;y+=7)c.fillRect(-14,y,28,3);}
  c.strokeStyle=look.color;c.lineWidth=6;c.beginPath();c.moveTo(-13,-34);c.lineTo(-20,-19+stride);c.moveTo(13,-34);c.lineTo(20,-19-stride);c.stroke();
  const skin=look.animal==='person'?'#f3c39c':look.color;
  if(look.animal==='cat'){tagShape(c,[[-18,-47],[-17,-72],[-3,-59]],skin);tagShape(c,[[18,-47],[17,-72],[3,-59]],skin);}
  if(look.animal==='dog'){tagOval(c,-17,-53,7,16,'#514555');tagOval(c,17,-53,7,16,'#514555');}
  if(look.animal==='dragon'){tagShape(c,[[-16,-57],[-14,-75],[-4,-60]],'#ffe19a');tagShape(c,[[16,-57],[14,-75],[4,-60]],'#ffe19a');}
  tagOval(c,0,-51,18,18,skin);
  tagOval(c,-7,-59,9,7,'#ffffff20');tagOval(c,-11,-44,4,2,'#ef9a8a66');tagOval(c,12,-44,4,2,'#ef9a8a66');
  if(look.animal==='cat'){tagShape(c,[[-15,-58],[-15,-67],[-8,-59]],'#efb1b2');tagShape(c,[[15,-58],[15,-67],[8,-59]],'#efb1b2');}
  if(look.animal==='person')tagOval(c,0,-65,17,6,'#4c3a3a');
  if(['dog','dragon'].includes(look.animal))tagOval(c,6,-44,13,8,'#ffe3bd');
  tagOval(c,-6,-53,4,5,'#fff7e4');tagOval(c,7,-53,4,5,'#fff7e4');
  tagOval(c,-5,-52,2.5,3.5,'#283347');tagOval(c,8,-52,2.5,3.5,'#283347');tagOval(c,-6,-54,1,1,'#fff');tagOval(c,7,-54,1,1,'#fff');
  if(look.animal==='dog')tagOval(c,14,-46,3.5,2.5,'#3a3544');
  if(look.animal==='dragon'){tagOval(c,16,-46,1.5,1,'#806b67');tagShape(c,[[-26,-24],[-32,-32],[-22,-28]],'#f7d184');}
  c.strokeStyle='#583f49';c.lineWidth=2;c.beginPath();c.arc(2,-46,6,0,Math.PI);c.stroke();
  if(look.animal==='cat'){c.beginPath();for(const side of [-1,1]){c.moveTo(side*10,-44);c.lineTo(side*24,-46);c.moveTo(side*10,-41);c.lineTo(side*23,-39);}c.stroke();}
  if(look.accessory==='glasses'){c.strokeStyle='#293848';c.lineWidth=2;c.strokeRect(-12,-58,11,10);c.strokeRect(3,-58,11,10);}
  if(look.accessory==='scarf'){tagRound(c,-15,-37,30,7,3,'#ffce6c');tagRound(c,8,-33,7,17,2,'#ffce6c');}
  if(look.hat==='cap'){tagRound(c,-18,-71,35,11,5,'#304c6e');tagRound(c,-1,-63,27,4,2,'#f8d274');}
  if(look.hat==='beanie'){tagOval(c,0,-66,19,11,'#f2bd64');tagOval(c,0,-79,5,5,'#fff0d0');}
  tagRound(c,-14-stride,-6,12,6,3,'#354a60');tagRound(c,4+stride,-6,13,6,3,'#354a60');
  c.fillStyle='#eee7d9';c.fillRect(-13-stride,-2,11,2);c.fillRect(5+stride,-2,11,2);
  if(look.hat==='crown')tagShape(c,[[-17,-63],[-19,-80],[-7,-71],[0,-83],[8,-71],[19,-80],[17,-63]],'#ffd36a');
  c.restore();
}
export function drawTagScene(c,s,width,height,reduced=false){
  c.save();c.scale(width/900,height/600);
  const theme=s.settings.background;
  drawTagBackdrop(c,theme,reduced?0:s.time);
  const layout=TAG_LAYOUTS[s.settings.layout];
  for(const [x,y,w] of layout.platforms)drawTagPlatform(c,x,y,w,theme);
  c.fillStyle=tagGradient(c,540,600,theme==='snow'?['#eaf5f9','#a6c8d9']:theme==='city'?['#536577','#344352']:['#bbab86','#8d8066']);c.fillRect(0,540,900,60);
  c.fillStyle=theme==='snow'?'#ffffff':theme==='city'?'#b1d3db':'#a8c884';c.fillRect(0,540,900,7);
  for(let i=0;i<45;i++){const x=(i*83)%900,y=554+(i*17)%43;tagOval(c,x,y,3+i%4,1,theme==='snow'?'#ffffff66':'#e9ddbb33');}
  for(const x of layout.trampolines){
    tagOval(c,x,565,44,7,'#223b4a33');
    c.strokeStyle='#445769';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(x-30,541);c.lineTo(x-34,562);c.moveTo(x+30,541);c.lineTo(x+34,562);c.stroke();
    c.strokeStyle='#b4c6d0';c.lineWidth=2;for(const dx of [-23,0,23]){c.beginPath();c.moveTo(x+dx-5,559);c.lineTo(x+dx+5,552);c.lineTo(x+dx-5,545);c.lineTo(x+dx+5,539);c.stroke();}
    tagRound(c,x-40,531,80,12,6,'#8f406a');tagRound(c,x-40,529,80,8,4,tagGradient(c,529,537,['#ffc4dd','#e777ab']));
    tagOval(c,x,531,29,3,'#51465e');c.strokeStyle='#ffdf7f';c.lineWidth=2;c.beginPath();c.moveTo(x-7,533);c.lineTo(x,529);c.lineTo(x+7,533);c.stroke();
  }
  for(let i=0;i<2;i++){
    const p=s.players[i];
    if(i===s.tagger&&s.grace>0){c.strokeStyle='#fff3a9bb';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y-35,30,46,0,0,Math.PI*2);c.stroke();}
    tagOval(c,p.x,p.y+2,22,5,'#253f5022');drawTagCharacter(c,p,s.settings.players[i],reduced?0:s.time);
    c.textAlign='center';c.font='bold 12px sans-serif';c.fillStyle='#283e50';c.fillText(i===1&&s.settings.mode==='computer'?'CPU':'P'+(i+1),p.x,p.y-86);
    if(i===s.tagger){tagRound(c,p.x-25,p.y-123,50,26,10,'#e65f72');c.fillStyle='#fff';c.font='bold 16px sans-serif';c.fillText('Tag',p.x,p.y-105);}
  }
  tagRound(c,18,14,864,44,12,'#253e50');c.fillStyle='#fff3d6';c.textAlign='left';c.font='bold 20px sans-serif';c.fillText('TAG · '+layout.name,34,43);c.textAlign='right';c.fillText(Math.ceil(TAG_ROUND_SECONDS-s.time)+'s',862,43);
  if(s.status==='ready'||s.status==='countdown'||s.time<.65&&s.status==='playing'){
    const text=s.status==='ready'?'Ready to run?':s.status==='countdown'?String(Math.ceil(s.countdown)):'GO!';
    tagRound(c,305,190,290,125,24,'#fff5e8ed');c.textAlign='center';c.fillStyle='#35495c';c.font='bold '+(s.status==='ready'?32:70)+'px sans-serif';c.fillText(text,450,272);
  }
  if(s.flash>0){c.textAlign='center';c.fillStyle='#c33f66';c.font='bold 34px sans-serif';c.fillText('TAG! Your turn!',450,103);}
  c.restore();
}
export function drawTagPreview(canvas){const c=canvas.getContext('2d');if(c){const s=createTagState();s.status='playing';s.time=5;s.players[0].x=310;s.players[1].x=570;drawTagScene(c,s,canvas.width,canvas.height,true);}}

export function createTagGame({canvas,onHud,onFinish,controls=document.querySelector('#tag-controls'),modeControls=document.querySelector('#tag-mode')}){
  const c=canvas.getContext('2d');if(!c)throw Error('Canvas is unavailable.');
  const audio=createMazeAudio(),controller=new AbortController(),events={signal:controller.signal},keys=new Set(),touch=[new Set(),new Set()];
  let settings=defaultTagSettings();try{settings=validateTagSettings(JSON.parse(localStorage.getItem('sidequest.tag.settings.v1')));}catch{}
  let s=createTagState(settings),active=false,paused=false,destroyed=false,last=0,frame;
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const save=()=>{try{localStorage.setItem('sidequest.tag.settings.v1',JSON.stringify(settings));}catch{}s=createTagState(settings);};
  const clear=()=>{keys.clear();touch.forEach(set=>set.clear());};
  const modeButtons=[];modeControls.replaceChildren();
  const modeLabel=document.createElement('p');modeLabel.textContent='Who would you like to play?';modeControls.append(modeLabel);
  for(const [id,label] of [['computer','Against the computer'],['local','Multiplayer · 2 on this keyboard']]){
    const b=document.createElement('button');b.type='button';b.className='button outline';b.textContent=label;
    b.onclick=()=>{if(active)return;settings.mode=id;save();sync();};modeControls.append(b);modeButtons.push([id,b]);
  }
  const form=document.createElement('fieldset');form.className='tag-customizer';
  function select(parent,label,values,value,change,type='select'){
    const wrapper=document.createElement('label');wrapper.textContent=label;const input=document.createElement(type==='select'?'select':'input');
    if(type==='select')for(const [id,name] of Object.entries(values)){const option=document.createElement('option');option.value=id;option.textContent=name;input.append(option);}else input.type=type;
    input.value=value;input.onchange=()=>{if(active)return;change(input.value);save();};wrapper.append(input);parent.append(wrapper);return input;
  }
  select(form,'Background',TAG_BACKGROUNDS,settings.background,value=>settings.background=value);
  select(form,'Arena layout',Object.fromEntries(Object.entries(TAG_LAYOUTS).map(([id,v])=>[id,v.name])),settings.layout,value=>settings.layout=value);
  for(let i=0;i<2;i++){
    const group=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=i===0?'Player 1':'Player 2 / computer';group.append(legend);
    for(const [field,label,options] of [['animal','Character',TAG_ANIMALS],['outfit','Outfit',TAG_OUTFITS],['hat','Hat',TAG_HATS],['accessory','Accessory',TAG_ACCESSORIES]])select(group,label,options,settings.players[i][field],value=>settings.players[i][field]=value);
    select(group,'Color',{},settings.players[i].color,value=>settings.players[i].color=value,'color');form.append(group);
  }
  const tip=document.createElement('p');tip.textContent='P1: A / D to run, W to jump. P2: ← / → to run, ↑ to jump. Against the computer you can use either set. Keep moving in midair; pink trampolines launch you high! Whoever is tagged at 60 seconds loses. There is a short shield after each tag. Finish a round for 5 shared coins.';
  const pads=document.createElement('div');pads.className='tag-pads';const padGroups=[];
  for(let i=0;i<2;i++){
    const group=document.createElement('div');group.setAttribute('aria-label','Player '+(i+1)+' touch controls');const label=document.createElement('strong');label.textContent='P'+(i+1);group.append(label);padGroups.push(group);
    for(const [action,label] of [['left','←'],['jump','↑ Jump'],['right','→']]){
      const b=document.createElement('button');b.type='button';b.className='button outline';b.textContent=label;b.setAttribute('aria-label','Player '+(i+1)+' '+action);
      b.addEventListener('pointerdown',e=>{if(!active||paused)return;e.preventDefault();b.setPointerCapture?.(e.pointerId);touch[i].add(action);},events);
      for(const name of ['pointerup','pointercancel','lostpointercapture','blur'])b.addEventListener(name,()=>touch[i].delete(action),events);
      b.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();touch[i].add(action);}},events);
      b.addEventListener('keyup',()=>touch[i].delete(action),events);group.append(b);
    }
    pads.append(group);
  }
  controls.replaceChildren(tip,pads,form);
  function sync(){form.disabled=active;for(const [id,b] of modeButtons){b.disabled=active;b.setAttribute('aria-pressed',String(settings.mode===id));}padGroups[1].hidden=settings.mode!=='local';}
  const allowed=['KeyA','KeyD','KeyW','ArrowLeft','ArrowRight','ArrowUp'];
  canvas.addEventListener('keydown',e=>{if(allowed.includes(e.code)){e.preventDefault();if(active&&!paused)keys.add(e.code);}},events);
  globalThis.window?.addEventListener('keyup',e=>keys.delete(e.code),events);
  canvas.addEventListener('blur',clear,events);
  globalThis.window?.addEventListener('blur',clear,events);
  document.addEventListener('visibilitychange',()=>{last=0;clear();if(document.hidden)audio.stop();},events);
  const input=i=>{const computer=settings.mode==='computer',codes=i===0?['KeyA','KeyD','KeyW']:['ArrowLeft','ArrowRight','ArrowUp'];return Object.fromEntries(['left','right','jump'].map((action,n)=>[action,touch[i].has(action)||keys.has(codes[n])||(i===0&&computer&&keys.has(['ArrowLeft','ArrowRight','ArrowUp'][n]))]));};
  function finish(){if(!active)return;active=false;clear();sync();const name=s.winner===1&&settings.mode==='computer'?'Computer':'Player '+(s.winner+1);onFinish(5,{title:name+' wins!',detail:'The other player was tagged when the timer ran out.'});}
  function tick(now){
    if(destroyed)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
    if(active&&!paused&&!document.hidden){tickTag(s,dt,[input(0),input(1)],cue=>audio.play(cue));if(s.status==='finished')finish();}
    drawTagScene(c,s,canvas.width,canvas.height,reduced);
    onHud({text:s.status==='finished'?'Round complete! Choose another look or arena, then play again.':s.status==='ready'?'Choose computer or multiplayer, customize, then press Start.':s.status==='countdown'?'Get ready…':Math.ceil(TAG_ROUND_SECONDS-s.time)+'s · '+(s.tagger===1&&settings.mode==='computer'?'Computer':'Player '+(s.tagger+1))+' is Tag'+(s.grace>0?' · tag shield':'' )});
    frame=requestAnimationFrame(tick);
  }
  sync();frame=requestAnimationFrame(tick);
  return {start(){clear();s=createTagState(settings,Math.random()<.5?0:1);s.status='countdown';active=true;paused=false;last=0;audio.unlock();audio.play('gem');sync();canvas.focus();},pause(value){paused=value;last=0;clear();if(value)audio.stop();},setMuted:value=>audio.setMuted(value),destroy(){if(destroyed)return;destroyed=true;active=false;clear();controller.abort();audio.destroy();cancelAnimationFrame(frame);controls.replaceChildren();modeControls.replaceChildren();}};
}
