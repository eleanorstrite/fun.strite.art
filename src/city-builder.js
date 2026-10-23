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
export function createCityState(raw) {
  let data; try { data=JSON.parse(raw); } catch {}
  return {tiles:Array.from({length:CITY_SIZE*CITY_SIZE},(_,i)=>Object.hasOwn(CITY_ITEMS,data?.tiles?.[i])?data.tiles[i]:null),history:[]};
}
export function cityPlace(state,x,y,tool) {
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=CITY_SIZE||y>=CITY_SIZE||(tool!==null&&!Object.hasOwn(CITY_ITEMS,tool)))return false;
  const index=y*CITY_SIZE+x;
  if(state.tiles[index]===tool)return false;
  state.history.push({index,before:state.tiles[index]});
  if(state.history.length>300)state.history.shift();
  state.tiles[index]=tool;return true;
}
export function cityUndo(state) {
  const edit=state.history.pop();if(!edit)return false;
  state.tiles[edit.index]=edit.before;return true;
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
export function drawCityPreview(canvas){const s=createCityState();for(let i=1;i<11;i++){s.tiles[6*12+i]='road';s.tiles[i*12+6]='road';}for(const [x,y,id] of [[4,4,'glass'],[5,3,'skyline'],[3,5,'office'],[7,7,'cottage'],[8,7,'townhouse'],[9,8,'cottage'],[7,4,'park'],[8,4,'pond'],[4,7,'cafe'],[4,8,'flowers'],[5,8,'market']])s.tiles[y*12+x]=id;drawCity(canvas,s);}
export function createCityBuilder({canvas,onHud}){
  let storage,state,saveError=false;
  try{storage=window.localStorage;state=createCityState(storage.getItem(CITY_KEY));}catch{state=createCityState();saveError=true;}
  const abort=new AbortController(),options={signal:abort.signal};
  const panel=document.querySelector('#city-controls'),categories=panel.querySelector('#city-categories'),items=panel.querySelector('#city-items'),status=panel.querySelector('#city-status');
  let category='homes',tool='cottage',active=false,paused=false,hover=null,pointer=null,last=null,frame=0,lastFrame=0;
  function report(){const count=state.tiles.filter(Boolean).length;status.textContent=saveError?'Saving unavailable in this browser. Keep this game open to keep your city.':`${count} / 144 plots used · Saved on this device`;onHud({text:`City Builder · ${count} plots · All buildings are free`});panel.querySelector('#city-undo').disabled=!state.history.length;}
  function save(){try{if(!storage)throw Error();storage.setItem(CITY_KEY,JSON.stringify({tiles:state.tiles}));saveError=false;}catch{saveError=true;}report();}
  function choose(){for(const button of items.children)button.setAttribute('aria-pressed',String(button.dataset.item===tool));panel.querySelector('#city-erase').setAttribute('aria-pressed',String(tool===null));panel.querySelector('#city-selected').textContent=tool?`Selected: ${CITY_ITEMS[tool].name}`:'Eraser: tap a plot to remove it';}
  function renderItems(){items.replaceChildren();for(const [id,item] of Object.entries(CITY_ITEMS))if(item.category===category){const b=document.createElement('button');b.type='button';b.className='button outline';b.dataset.item=id;b.textContent=item.name;b.addEventListener('click',()=>{tool=id;choose();},options);items.append(b);}choose();}
  categories.replaceChildren();for(const [id,name] of Object.entries(CITY_CATEGORIES)){const b=document.createElement('button');b.type='button';b.className='button outline';b.textContent=name;b.setAttribute('aria-pressed',String(category===id));b.addEventListener('click',()=>{category=id;tool=Object.keys(CITY_ITEMS).find(key=>CITY_ITEMS[key].category===id);for(const button of categories.children)button.setAttribute('aria-pressed',String(button===b));renderItems();},options);categories.append(b);}
  panel.querySelector('#city-erase').addEventListener('click',()=>{tool=null;choose();},options);
  panel.querySelector('#city-undo').addEventListener('click',()=>{if(active&&!paused&&cityUndo(state))save();},options);
  panel.querySelector('#city-clear').addEventListener('click',()=>{if(!active||paused||!confirm('Clear your entire city?'))return;for(let y=0;y<12;y++)for(let x=0;x<12;x++)cityPlace(state,x,y,null);save();},options);
  function locate(e){const r=canvas.getBoundingClientRect();return cityCell((e.clientX-r.left)*900/r.width,(e.clientY-r.top)*650/r.height);}
  function place(cell){if(!active||paused)return;if(cityPlace(state,cell.x,cell.y,tool))save();}
  canvas.addEventListener('pointerdown',e=>{if(!active||paused||pointer!==null||e.button>0)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);hover=locate(e);last=hover;place(hover);},options);
  canvas.addEventListener('pointermove',e=>{hover=locate(e);if(e.pointerId!==pointer)return;e.preventDefault();if(tool==='road'||tool===null){const dx=hover.x-last.x,dy=hover.y-last.y,steps=Math.max(Math.abs(dx),Math.abs(dy));for(let i=1;i<=Math.min(steps,24);i++)place({x:Math.round(last.x+dx*i/steps),y:Math.round(last.y+dy*i/steps)});}last=hover;},options);
  const release=e=>{if(pointer===e.pointerId){pointer=null;last=null;}};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release,options);
  canvas.addEventListener('pointerleave',()=>{if(pointer===null)hover=null;},options);
  canvas.addEventListener('keydown',e=>{if(!active||paused)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' '].includes(e.key)){e.preventDefault();hover??={x:5,y:5};if(e.key==='ArrowUp')hover.y--;if(e.key==='ArrowDown')hover.y++;if(e.key==='ArrowLeft')hover.x--;if(e.key==='ArrowRight')hover.x++;hover.x=Math.max(0,Math.min(11,hover.x));hover.y=Math.max(0,Math.min(11,hover.y));if(e.key==='Enter'||e.key===' ')place(hover);}},options);
  function loop(now){if(now-lastFrame>32){drawCity(canvas,state,hover,tool,paused?0:now/1000);lastFrame=now;}frame=requestAnimationFrame(loop);}
  renderItems();report();drawCity(canvas,state);frame=requestAnimationFrame(loop);
  return {start(){active=true;paused=false;canvas.focus({preventScroll:true});},pause(value){paused=value;pointer=null;},destroy(){abort.abort();cancelAnimationFrame(frame);},setMuted(){}};
}
