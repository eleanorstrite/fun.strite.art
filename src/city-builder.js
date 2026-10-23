export const CITY_SIZE = 12;
export const CITY_KEY = 'sidequest.city.v1';
export const CITY_CATEGORIES = {
  homes:'Houses', towers:'Skyscrapers', shops:'Shops', services:'City services', nature:'Parks & water', roads:'Roads'
};
export const CITY_ITEMS = {
  cottage:{name:'Cozy cottage',category:'homes',color:'#efb982',height:24},
  townhouse:{name:'Townhouse',category:'homes',color:'#df8e86',height:42},
  apartments:{name:'Apartments',category:'homes',color:'#e6ca93',height:63},
  glass:{name:'Glass tower',category:'towers',color:'#79bac9',height:108},
  skyline:{name:'Skyline tower',category:'towers',color:'#99a6d6',height:134},
  office:{name:'Office tower',category:'towers',color:'#a9bdba',height:84},
  cafe:{name:'Corner café',category:'shops',color:'#f2ba9f',height:25},
  market:{name:'Market',category:'shops',color:'#a6c9a3',height:30},
  bakery:{name:'Bakery',category:'shops',color:'#e8a9be',height:25},
  school:{name:'School',category:'services',color:'#edc981',height:32},
  hospital:{name:'Hospital',category:'services',color:'#e8ece4',height:49},
  fire:{name:'Fire station',category:'services',color:'#d98674',height:32},
  park:{name:'Leafy park',category:'nature'},
  flowers:{name:'Flower garden',category:'nature'},
  pond:{name:'Pond',category:'nature'},
  road:{name:'Road',category:'roads'},
  plaza:{name:'Walking plaza',category:'roads'}
};
export const CITY_SIZES = [8,12,20];
export const CITY_PERSON = {skin:'#bc8765',hair:'#382a23',jacket:'#476c73',pants:'#344252',outfit:'jacket',pantsStyle:'jeans',accessory:'none'};
export function createCityState(raw) {
  let data; try { data=JSON.parse(raw); } catch {}
  const size=CITY_SIZES.includes(data?.size)?data.size:12;
  const person={...CITY_PERSON};
  for(const key of ['skin','hair','jacket','pants'])if(/^#[0-9a-f]{6}$/i.test(data?.person?.[key]))person[key]=data.person[key];
  if(['jacket','hoodie','coat'].includes(data?.person?.outfit))person.outfit=data.person.outfit;
  if(['jeans','trousers','shorts'].includes(data?.person?.pantsStyle))person.pantsStyle=data.person.pantsStyle;
  if(['none','cap','scarf','backpack','glasses'].includes(data?.person?.accessory))person.accessory=data.person.accessory;
  return {size,theme:data?.theme==='country'?'country':'city',person,tiles:Array.from({length:size*size},(_,i)=>Object.hasOwn(CITY_ITEMS,data?.tiles?.[i])?data.tiles[i]:null),history:[]};
}
export function cityPlace(state,x,y,tool) {
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=state.size||y>=state.size||(tool!==null&&!Object.hasOwn(CITY_ITEMS,tool)))return false;
  const index=y*state.size+x;
  if(state.tiles[index]===tool)return false;
  state.history.push({index,before:state.tiles[index]});
  if(state.history.length>500)state.history.shift();
  state.tiles[index]=tool;return true;
}
export function cityUndo(state) {
  const edit=state.history.pop();if(!edit)return false;
  state.tiles[edit.index]=edit.before;return true;
}
export function cityResize(state,size,allowCrop=false) {
  if(!CITY_SIZES.includes(size))return false;
  if(!allowCrop&&state.tiles.some((id,i)=>id&&(i%state.size>=size||Math.floor(i/state.size)>=size)))return false;
  const tiles=Array(size*size).fill(null);
  for(let y=0;y<Math.min(size,state.size);y++)for(let x=0;x<Math.min(size,state.size);x++)tiles[y*size+x]=state.tiles[y*state.size+x];
  state.size=size;state.tiles=tiles;state.history=[];return true;
}
export function citySerialize(state){return JSON.stringify({size:state.size,theme:state.theme,person:state.person,tiles:state.tiles});}
export function cityDoor(state,index){return {x:(index%state.size)*5+2.5,z:Math.floor(index/state.size)*5+4.55};}
export function citySpawn(state){const index=state.tiles.findIndex(id=>CITY_ITEMS[id]?.height);return index<0?{x:state.size*2.5,z:state.size*5-.5}:cityDoor(state,index);}
export function cityCanWalk(state,x,z,room=null) {
  if(room)return x> -6.6&&x<6.6&&z> -5.6&&z<5.6&&!room.some(b=>Math.abs(x-b.x)<b.w/2+.22&&Math.abs(z-b.z)<b.d/2+.22);
  if(x<.3||z<.3||x>state.size*5-.3||z>state.size*5-.3)return false;
  const tx=Math.floor(x/5),tz=Math.floor(z/5),id=state.tiles[tz*state.size+tx];
  if(id==='pond')return Math.abs(x%5-2.5)>1.75||Math.abs(z%5-2.5)>1.75;
  return !CITY_ITEMS[id]?.height||Math.abs(x%5-2.5)>1.85||Math.abs(z%5-2.5)>1.85;
}
// A one-metre walking grid routes taps around buildings rather than through walls.
export function cityPath(state,from,to) {
  const n=state.size*5,cell=p=>Math.max(0,Math.min(n-1,Math.floor(p))),sx=cell(from.x),sz=cell(from.z),tx=cell(to.x),tz=cell(to.z),start=sz*n+sx,end=tz*n+tx;
  const previous=new Int32Array(n*n).fill(-1),queue=[start];previous[start]=start;
  for(let head=0;head<queue.length&&previous[end]===-1;head++){
    const id=queue[head],x=id%n,z=Math.floor(id/n);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,next=zz*n+xx;if(xx<0||zz<0||xx>=n||zz>=n||previous[next]!==-1||!cityCanWalk(state,xx+.5,zz+.5))continue;previous[next]=id;queue.push(next);}
  }
  if(previous[end]===-1)return [];
  const path=[];for(let i=end;i!==start;i=previous[i])path.push({x:i%n+.5,z:Math.floor(i/n)+.5});
  return path.reverse();
}
export function cityPoint(x,y){return {x:450+(x-y)*32,y:168+(x+y)*16};}
export function cityCell(px,py){const a=(px-450)/32,b=(py-168)/16;return {x:Math.floor((a+b)/2),y:Math.floor((b-a)/2)};}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function diamond(c,x,y,color,inset=0){poly(c,[[x,y+inset],[x+32-inset,y+16],[x,y+32-inset],[x-32+inset,y+16]],color);}
function building(c,x,y,item){
  const h=item.height,w=23;
  // Two shaded walls, a roof, and windows follow the same isometric projection.
  poly(c,[[x-w,y+16-h],[x,y+28-h],[x,y+28],[x-w,y+16]],item.color);
  poly(c,[[x,y+28-h],[x+w,y+16-h],[x+w,y+16],[x,y+28]],item.color);
  poly(c,[[x,y+28-h],[x+w,y+16-h],[x+w,y+16],[x,y+28]],'#203e4935');
  poly(c,[[x,y+4-h],[x+w,y+16-h],[x,y+28-h],[x-w,y+16-h]],'#eef0dd');
  for(let floor=12;floor<h-4;floor+=15)for(const side of [-1,1])for(let col=0;col<2;col++){
    const xx=x+side*(5+col*10),yy=y+24-floor-col*5;
    poly(c,[[xx,yy],[xx+side*6,yy-3],[xx+side*6,yy-10],[xx,yy-7]],floor%3?'#e8f3d6':'#4d8195');
  }
  if(item.category==='homes'&&h<50){
    poly(c,[[x-w-3,y+16-h],[x,y-h-8],[x+w+3,y+16-h],[x,y+29-h]],'#bb6757');
    poly(c,[[x-w-3,y+16-h],[x,y-h-8],[x,y+29-h]],'#d98269');
  }
  if(item.category==='shops'){
    for(let i=0;i<5;i++)poly(c,[[x-25+i*5,y+13+i*2.5],[x-20+i*5,y+15.5+i*2.5],[x-20+i*5,y+21+i*2.5],[x-25+i*5,y+18.5+i*2.5]],i%2?'#fff5da':'#bf6061');
  }
  if(item.name==='Hospital'){c.fillStyle='#df6b66';c.fillRect(x-3,y-h+10,6,15);c.fillRect(x-7,y-h+14,14,5);}
  if(item.category==='towers'){c.strokeStyle='#52778c';c.lineWidth=2;c.beginPath();c.moveTo(x,y+10-h);c.lineTo(x,y-8-h);c.stroke();}
}
function tree(c,x,y){oval(c,x,y+5,11,5,'#36583c30');c.fillStyle='#88674b';c.fillRect(x-2,y-14,4,19);oval(c,x,y-18,12,16,'#44856a');oval(c,x-4,y-23,8,10,'#77ad79');}
export function drawCity(canvas,state,hover=null,tool='cottage',time=0){
  const c=canvas.getContext('2d');c.save();c.scale(canvas.width/900,canvas.height/650);
  const sky=c.createLinearGradient(0,0,0,650);sky.addColorStop(0,'#d9ece7');sky.addColorStop(1,'#f8ecd2');c.fillStyle=sky;c.fillRect(0,0,900,650);
  oval(c,778,80,35,35,'#fff3c2');
  for(let i=0;i<4;i++){const x=100+i*225+Math.sin(time*.1+i)*12;oval(c,x,80+i%2*30,49,12,'#ffffff80');oval(c,x-8,73+i%2*30,26,18,'#ffffff80');}
  c.fillStyle='#315b55';c.font='600 24px sans-serif';c.fillText('Your little city',35,42);c.font='14px sans-serif';c.fillStyle='#5a7970';c.fillText('Make somewhere you love.',35,66);
  poly(c,[[66,360],[450,552],[834,360],[834,384],[450,576],[66,384]],'#8eab7d');
  for(let sum=0;sum<=22;sum++)for(let y=0;y<CITY_SIZE;y++){
    const x=sum-y;if(x<0||x>=CITY_SIZE)continue;
    const p=cityPoint(x,y),id=state.tiles[y*CITY_SIZE+x],item=CITY_ITEMS[id];
    diamond(c,p.x,p.y,(x+y)%2?'#a8c58e':'#b2ce96');
    c.strokeStyle='#f3f4cc44';c.lineWidth=.7;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+32,p.y+16);c.lineTo(p.x,p.y+32);c.stroke();
    if(id==='road'){
      diamond(c,p.x,p.y,'#647579',1);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(x+dx>=0&&x+dx<12&&y+dy>=0&&y+dy<12&&state.tiles[(y+dy)*12+x+dx]==='road'){
        c.strokeStyle='#f4e4b6';c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.moveTo(p.x,p.y+16);c.lineTo(p.x+(dx-dy)*16,p.y+16+(dx+dy)*8);c.stroke();c.setLineDash([]);
      }
    }else if(id==='plaza'){diamond(c,p.x,p.y,'#d9cfb6',1);oval(c,p.x,p.y+16,12,6,'#a4bbb5');oval(c,p.x,p.y+14,8,4,'#79bfc5');}
    else if(id==='pond'){diamond(c,p.x,p.y,'#88b7a5',2);oval(c,p.x,p.y+16,23,11,'#65b4c6');oval(c,p.x-5,p.y+13,12,3,'#a5dcd8');}
    else if(id==='park'){tree(c,p.x-10,p.y+14);tree(c,p.x+10,p.y+22);}
    else if(id==='flowers'){for(let i=0;i<9;i++){const xx=p.x+Math.sin(i*8)*20,yy=p.y+10+(i%4)*4;oval(c,xx,yy,3,2,['#e9999c','#fff0ab','#b6a4d6'][i%3]);}}
    else if(item){oval(c,p.x+8,p.y+20,25,11,'#33504428');building(c,p.x,p.y,item);}
    if(hover?.x===x&&hover?.y===y){c.globalAlpha=.45;diamond(c,p.x,p.y,tool===null?'#ef9586':'#fff9ca');c.globalAlpha=1;}
  }
  c.font='13px sans-serif';c.fillStyle='#527466';c.textAlign='center';c.fillText('Tap a diamond to build · Roads connect automatically',450,620);c.restore();
}
let cityPreviewImage;
export function drawCityPreview(canvas){
  if(typeof Image!=='undefined'){
    if(!cityPreviewImage){cityPreviewImage=new Image();cityPreviewImage.src='./assets/city-builder-preview.jpg';}
    if(cityPreviewImage.complete&&cityPreviewImage.naturalWidth){canvas.getContext('2d').drawImage(cityPreviewImage,0,0,canvas.width,canvas.height);return;}
    if(!cityPreviewImage.complete)cityPreviewImage.addEventListener('load',()=>{if(canvas.isConnected)drawCityPreview(canvas);},{once:true});
  }
  const s=createCityState();for(let i=1;i<11;i++){s.tiles[6*12+i]='road';s.tiles[i*12+6]='road';}for(const [x,y,id] of [[4,4,'glass'],[5,3,'skyline'],[3,5,'office'],[7,7,'cottage'],[8,7,'townhouse'],[9,8,'cottage'],[7,4,'park'],[8,4,'pond'],[4,7,'cafe'],[4,8,'flowers'],[5,8,'market']])s.tiles[y*12+x]=id;drawCity(canvas,s);}
export function createCityBuilder({canvas,onHud}){
  let storage,state,saveError=false;
  try{storage=window.localStorage;state=createCityState(storage.getItem(CITY_KEY));}catch{state=createCityState();saveError=true;}
  const abort=new AbortController(),options={signal:abort.signal},panel=document.querySelector('#city-controls'),$=id=>panel.querySelector('#city-'+id);
  let category='homes',tool='cottage',active=false,paused=false,hover=null,pointer=null,last=null,frame=0,previous=0,view=null,destroyed=false,mode='build',interior=null,obstacles=null,path=[],destinationBuilding=null,moving=false;
  const keys=new Set(),player={x:.5,z:.5,angle:0};let nearby=null;
  function report(){const count=state.tiles.filter(Boolean).length;$('status').textContent=saveError?'Saving unavailable in this browser. Keep this game open to keep your city.':`${count} / ${state.size*state.size} plots used · Saved on this device`;onHud({text:`City Builder · ${mode==='walk'?(interior?CITY_ITEMS[state.tiles[interior.index]].name:'Exploring your '+state.theme):'Build your '+state.theme} · ${count} plots`});$('undo').disabled=!state.history.length||mode!=='build';}
  function save(){try{if(!storage)throw Error();storage.setItem(CITY_KEY,citySerialize(state));saveError=false;}catch{saveError=true;}report();}
  function refresh(){view?.rebuild();save();}
  function choose(){for(const button of $('items').children)button.setAttribute('aria-pressed',String(button.dataset.item===tool));$('erase').setAttribute('aria-pressed',String(tool===null));$('selected').textContent=tool?`Selected: ${CITY_ITEMS[tool].name}`:'Eraser: tap a plot to remove it';}
  function renderItems(){$('items').replaceChildren();for(const [id,item] of Object.entries(CITY_ITEMS))if(item.category===category){const b=document.createElement('button');b.type='button';b.className='button outline';b.dataset.item=id;b.textContent=item.name;b.addEventListener('click',()=>{tool=id;choose();},options);$('items').append(b);}choose();}
  $('categories').replaceChildren();for(const [id,name] of Object.entries(CITY_CATEGORIES)){const b=document.createElement('button');b.type='button';b.className='button outline';b.textContent=name;b.setAttribute('aria-pressed',String(category===id));b.addEventListener('click',()=>{category=id;tool=Object.keys(CITY_ITEMS).find(key=>CITY_ITEMS[key].category===id);for(const button of $('categories').children)button.setAttribute('aria-pressed',String(button===b));renderItems();},options);$('categories').append(b);}
  $('erase').addEventListener('click',()=>{tool=null;choose();},options);
  $('undo').addEventListener('click',()=>{if(active&&!paused&&mode==='build'&&cityUndo(state))refresh();},options);
  $('clear').addEventListener('click',()=>{if(!active||paused||mode!=='build'||!confirm('Clear your entire city?'))return;for(let y=0;y<state.size;y++)for(let x=0;x<state.size;x++)cityPlace(state,x,y,null);refresh();},options);
  $('size').value=String(state.size);$('theme').value=state.theme;
  $('size').addEventListener('change',()=>{const size=Number($('size').value);if(!cityResize(state,size)){if(confirm('The smaller map will remove buildings outside its edges. Shrink the map?'))cityResize(state,size,true);else{$('size').value=String(state.size);return;}}refresh();},options);
  $('theme').addEventListener('change',()=>{state.theme=$('theme').value==='country'?'country':'city';refresh();},options);
  for(const key of Object.keys(CITY_PERSON)){const input=$('person-'+key);input.value=state.person[key];input.addEventListener('input',()=>{state.person[key]=input.value;view?.person();if(view)view.portrait($('portrait'));save();},options);}
  function resetInput(){keys.clear();pointer=null;last=null;path=[];destinationBuilding=null;moving=false;}
  function setMode(next){if(!active||paused||!view)return;resetInput();mode=next;canvas.closest('dialog').classList.toggle('city-walking',mode==='walk');interior=null;obstacles=null;Object.assign(player,citySpawn(state));$('build-tools').disabled=mode!=='build';$('build-tools').hidden=mode==='walk';$('person-customizer').open=mode==='build';$('walk-tools').hidden=mode!=='walk';$('play').textContent=mode==='walk'?'Back to building':'Play — explore your city';$('play').setAttribute('aria-pressed',String(mode==='walk'));canvas.focus({preventScroll:true});canvas.closest('dialog').scrollTop=0;report();}
  $('play').disabled=true;$('play').addEventListener('click',()=>setMode(mode==='build'?'walk':'build'),options);
  function enter(index){if(index===null||!CITY_ITEMS[state.tiles[index]]?.height)return;interior={index,outside:{x:player.x,z:player.z}};obstacles=view.furnish(state.tiles[index]);player.x=0;player.z=5;resetInput();report();}
  function interact(){if(!active||paused||mode!=='walk')return;if(interior){player.x=interior.outside.x;player.z=interior.outside.z;interior=null;obstacles=null;resetInput();report();}else if(nearby!==null)enter(nearby);canvas.focus({preventScroll:true});}
  $('enter').addEventListener('click',interact,options);
  for(const [id,action] of [['rotate-left',()=>view?.turn(-1)],['rotate-right',()=>view?.turn(1)],['zoom-in',()=>view?.zoom(-.15)],['zoom-out',()=>view?.zoom(.15)]])$(id).addEventListener('click',()=>{action();canvas.focus({preventScroll:true});},options);
  const keyName=key=>({w:'up',a:'left',s:'down',d:'right',ArrowUp:'up',ArrowLeft:'left',ArrowDown:'down',ArrowRight:'right'}[key.length===1?key.toLowerCase():key]);
  window.addEventListener('keydown',e=>{if(!active||paused||!view||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
    if(mode==='walk'){const name=keyName(e.key);if(name){e.preventDefault();keys.add(name);path=[];destinationBuilding=null;}if(e.key.toLowerCase()==='e'&&!e.repeat){e.preventDefault();interact();}}
    else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' '].includes(e.key)&&e.target===canvas){e.preventDefault();hover??={x:0,y:0};if(e.key==='ArrowUp')hover.y--;if(e.key==='ArrowDown')hover.y++;if(e.key==='ArrowLeft')hover.x--;if(e.key==='ArrowRight')hover.x++;hover.x=Math.max(0,Math.min(state.size-1,hover.x));hover.y=Math.max(0,Math.min(state.size-1,hover.y));if(e.key==='Enter'||e.key===' ')place(hover);}
  },options);
  window.addEventListener('keyup',e=>keys.delete(keyName(e.key)),options);window.addEventListener('blur',resetInput,options);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInput();},options);
  for(const direction of ['up','down','left','right']){const b=$('walk-'+direction);b.addEventListener('pointerdown',e=>{if(!active||paused)return;e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(direction);path=[];destinationBuilding=null;},options);for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>keys.delete(direction),options);}
  function place(cell){if(!active||paused||mode!=='build')return;if(cityPlace(state,cell.x,cell.y,tool))refresh();}
  function hit(e){const p=view.pick(e.clientX,e.clientY,Boolean(interior));if(!p)return null;return {...p,cell:p.building!==undefined?{x:p.building%state.size,y:Math.floor(p.building/state.size)}:{x:Math.floor(p.x/5),y:Math.floor(p.z/5)}};}
  function bindCanvas(){canvas.addEventListener('pointerdown',e=>{if(!active||paused||pointer!==null||e.button>0)return;e.preventDefault();canvas.focus({preventScroll:true});pointer=e.pointerId;canvas.setPointerCapture(pointer);const p=hit(e);if(!p)return;
    if(mode==='walk'){destinationBuilding=p.building??null;const target=destinationBuilding!==null?cityDoor(state,destinationBuilding):p;path=interior?[{x:Math.max(-6.5,Math.min(6.5,p.x)),z:Math.max(-5.5,Math.min(5.5,p.z))}]:cityPath(state,player,target);}
    else{hover=p.cell;last=hover;place(hover);}},options);
    canvas.addEventListener('pointermove',e=>{if(mode!=='build')return;const p=hit(e);if(!p)return;hover=p.cell;if(e.pointerId!==pointer||!last)return;e.preventDefault();if(tool==='road'||tool===null){const dx=hover.x-last.x,dy=hover.y-last.y,steps=Math.max(Math.abs(dx),Math.abs(dy));for(let i=1;i<=Math.min(steps,state.size*2);i++)place({x:Math.round(last.x+dx*i/steps),y:Math.round(last.y+dy*i/steps)});}last=hover;},options);
    const release=e=>{if(pointer===e.pointerId){pointer=null;last=null;}};for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release,options);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;resetInput();$('loading').hidden=false;$('loading').textContent='The 3D view was interrupted. Close and reopen City Builder to restore your saved city.';},options);
  }
  function step(dt){moving=false;if(!active||paused||mode!=='walk')return;let dx=0,dz=0;
    if(path.length){const target=path[0],distance=Math.hypot(target.x-player.x,target.z-player.z);if(distance<.14)path.shift();else{dx=(target.x-player.x)/distance;dz=(target.z-player.z)/distance;}}
    else{const right=Number(keys.has('right'))-Number(keys.has('left')),forward=Number(keys.has('up'))-Number(keys.has('down')),yaw=interior?0:view.yaw();dx=right*Math.cos(yaw)-forward*Math.sin(yaw);dz=-right*Math.sin(yaw)-forward*Math.cos(yaw);const length=Math.hypot(dx,dz);if(length){dx/=length;dz/=length;}}
    if(dx||dz){const beforeX=player.x,beforeZ=player.z,speed=interior?3.1:4.2;const nx=player.x+dx*speed*dt,nz=player.z+dz*speed*dt;if(cityCanWalk(state,nx,player.z,obstacles))player.x=nx;if(cityCanWalk(state,player.x,nz,obstacles))player.z=nz;moving=Math.hypot(player.x-beforeX,player.z-beforeZ)>.001;if(moving)player.angle=Math.atan2(dx,dz);else path=[];}
    nearby=null;if(!interior){let distance=2.6;state.tiles.forEach((id,index)=>{if(!CITY_ITEMS[id]?.height)return;const door=cityDoor(state,index),d=Math.hypot(player.x-door.x,player.z-door.z);if(d<distance){nearby=index;distance=d;}});if(destinationBuilding!==null&&!path.length&&nearby===destinationBuilding)enter(destinationBuilding);}
    const text=interior?'Exit building':nearby!==null?'Enter '+CITY_ITEMS[state.tiles[nearby]].name:'Walk to a front door';if($('enter').textContent!==text)$('enter').textContent=text;$('enter').disabled=!interior&&nearby===null;
  }
  function loop(now){const dt=Math.min(.04,(now-previous)/1000||0);previous=now;if(view&&!document.hidden){step(dt);view.render({mode,player,hover,time:now/1000,moving,interior,dt});}frame=requestAnimationFrame(loop);}
  canvas.closest('dialog').classList.remove('city-walking');$('build-tools').disabled=false;$('build-tools').hidden=false;$('walk-tools').hidden=true;$('person-customizer').open=true;$('play').textContent='Play — explore your city';$('play').setAttribute('aria-pressed','false');renderItems();report();$('loading').hidden=false;$('loading').textContent='Preparing your 3D city…';
  import('./city-3d.js').then(({createCityScene})=>{if(destroyed)return;view=createCityScene(canvas,state);canvas=view.canvas;bindCanvas();view.portrait($('portrait'));$('loading').hidden=true;$('play').disabled=!active;frame=requestAnimationFrame(loop);}).catch(error=>{if(destroyed)return;$('loading').hidden=false;$('loading').textContent='The 3D city could not load. Try reopening the game in a browser with WebGL enabled.';console.error(error);});
  return {start(){active=true;paused=false;$('play').disabled=!view;canvas.focus({preventScroll:true});},pause(value){paused=value;resetInput();},destroy(){canvas.closest('dialog')?.classList.remove('city-walking');destroyed=true;abort.abort();cancelAnimationFrame(frame);view?.dispose();},setMuted(){}};
}
