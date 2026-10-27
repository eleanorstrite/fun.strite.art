import {CITY_FIRE_FAILURE_SECONDS,CITY_FIRE_FAILURE_LINE,CITY_FIRE_VICTORY_SECONDS,CITY_FIRE_VICTORY_LINE,cityFireTripWon,cityNearTruck,createCityFireTrip,cityTickFireTrip} from './city-fire.js';
import {CITY_ANIMALS,cityChooseAnimal,createCityPowers,cityGrantPower,cityTickPowers,cityPowerMessage} from './city-powers.js';
import { createCityAudio } from './city-audio.js';
import { cityBedReaction, cityRoomRoute } from './city-life.js';
import { CITY_FOOD, cityFoodUnlocked, restoreCityOrders, CITY_SHOPS, CITY_HOLD_SECONDS, createCityShop, cityAtRegister, cityCarriedFood, cityOrderFood, cityPickUpFood, cityPlaceFood, cityEatOrderedFood, cityCanLeaveShop } from './city-shop.js';
import { cityFurnitureAt, cityNearbyMealSeat, cityHomeStyle } from './city-interiors.js';
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
  return {shopOrders:data?.shopOrders&&typeof data.shopOrders==='object'&&!Array.isArray(data.shopOrders)?data.shopOrders:{},size,theme:data?.theme==='country'?'country':'city',person,tiles:Array.from({length:size*size},(_,i)=>Object.hasOwn(CITY_ITEMS,data?.tiles?.[i])?data.tiles[i]:null),history:[]};
}
export function cityPlace(state,x,y,tool) {
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=state.size||y>=state.size||(tool!==null&&!Object.hasOwn(CITY_ITEMS,tool)))return false;
  const index=y*state.size+x;
  if(state.tiles[index]===tool)return false;
  state.history.push({index,before:state.tiles[index]});
  if(state.history.length>500)state.history.shift();
  delete state.shopOrders[`${x},${y}`];state.tiles[index]=tool;return true;
}
export function cityUndo(state) {
  const edit=state.history.pop();if(!edit)return false;
  delete state.shopOrders[`${edit.index%state.size},${Math.floor(edit.index/state.size)}`];state.tiles[edit.index]=edit.before;return true;
}
export function cityResize(state,size,allowCrop=false) {
  if(!CITY_SIZES.includes(size))return false;
  if(!allowCrop&&state.tiles.some((id,i)=>id&&(i%state.size>=size||Math.floor(i/state.size)>=size)))return false;
  const tiles=Array(size*size).fill(null);
  for(let y=0;y<Math.min(size,state.size);y++)for(let x=0;x<Math.min(size,state.size);x++)tiles[y*size+x]=state.tiles[y*state.size+x];
  for(const key of Object.keys(state.shopOrders)){const [x,y]=key.split(',').map(Number);if(x>=size||y>=size)delete state.shopOrders[key];}state.size=size;state.tiles=tiles;state.history=[];return true;
}
export function citySerialize(state){return JSON.stringify({shopOrders:state.shopOrders,size:state.size,theme:state.theme,person:state.person,tiles:state.tiles});}
export function cityDoor(state,index){return {x:(index%state.size)*5+2.5,z:Math.floor(index/state.size)*5+4.55};}
export function citySpawn(state){const index=state.tiles.findIndex(id=>CITY_ITEMS[id]?.height);return index<0?{x:state.size*2.5,z:state.size*5-.5}:cityDoor(state,index);}
// Enter the exit mat from the room or either side, without exiting at spawn.
export function cityLeavingRoom(from,to){
  const onMat=p=>Math.abs(p.x)<.85&&p.z>=5.25;
  return !onMat(from)&&onMat(to);
}
export function cityWalkCamera(player,yaw){return {target:{x:player.x,y:1.2+(player.altitude||0),z:player.z},position:{x:player.x+Math.sin(yaw)*5,y:3.2+(player.altitude||0),z:player.z+Math.cos(yaw)*5}};}
export function cityCanWalk(state,x,z,room=null) {
  if(room)return x> -6.6&&x<6.6&&z> -5.6&&z<5.6&&!room.some(b=>Math.abs(x-b.x)<b.w/2+.22&&Math.abs(z-b.z)<b.d/2+.22);
  if(x<.3||z<.3||x>state.size*5-.3||z>state.size*5-.3)return false;
  const tx=Math.floor(x/5),tz=Math.floor(z/5),id=state.tiles[tz*state.size+tx];
  return !CITY_ITEMS[id]?.height||Math.abs(x%5-2.5)>1.85||Math.abs(z%5-2.5)>1.85;
}
export function cityIsSwimming(state,player,interior=null){
  const {x,z}=player;if(interior||(player.altitude||0)>.1||!Number.isFinite(x)||!Number.isFinite(z)||x<0||z<0||x>=state.size*5||z>=state.size*5)return false;
  return state.tiles[Math.floor(z/5)*state.size+Math.floor(x/5)]==='pond'&&Math.abs(x%5-2.5)<1.75&&Math.abs(z%5-2.5)<1.75;
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
export function createCityBuilder({canvas,onHud,wallet=null,openFoodShop=()=>{},loadScene=()=>import('./city-3d.js')}){
  let storage,state,saveError=false;
  try{storage=window.localStorage;state=createCityState(storage.getItem(CITY_KEY));}catch{state=createCityState();saveError=true;}
  const abort=new AbortController(),options={signal:abort.signal},panel=document.querySelector('#city-controls'),$=id=>panel.querySelector('#city-'+id);
  const shopMenu=$('shop-menu'),shopChoices=$('shop-choices'),shopTitle=$('shop-title'),shopStatus=$('shop-status');
  const orderMessage=$('order-message'),orderPickup=$('order-pickup'),orderEat=$('order-eat');
  const walletBox=$('wallet'),walletBalance=$('wallet-balance');
  let walletState=wallet?.snapshot()??{coins:0,upgrades:[]};
  const unsubscribeWallet=wallet?.subscribe(()=>{walletState=wallet.snapshot();syncShopUI();});
  const computer={open:false,pulse:0,keys:0,zoom:0},computerPanel=$('computer'),computerScreen=$('computer-screen'),computerStatus=$('computer-status');let computerFrame=null,frameAbort=null,computerSave=null;
  const audio=createCityAudio(),powers=createCityPowers(),powerHud=$('power-hud'),powerText=$('power-text'),powerButton=$('power-button');
  const animalChoices=document.createElement('div');animalChoices.className='city-animal-choices';animalChoices.hidden=true;powerHud.append(animalChoices);
  for(const animal of CITY_ANIMALS){const button=document.createElement('button');button.type='button';button.className='button outline';button.dataset.animal=animal;button.textContent=animal[0].toUpperCase()+animal.slice(1);button.addEventListener('click',()=>{if(active&&!paused&&!fire&&cityChooseAnimal(powers,animal)){audio.magic?.('shapeshift');canvas.focus({preventScroll:true});}},options);animalChoices.append(button);}

  let flowerCooldown=0,flowerIndex=0,lastSafe=null,fire=null;
  const fireHud=$('fire-hud'),fireStatus=$('fire-status'),fireBoard=$('fire-board'),fireDrive=$('fire-drive'),fireReturn=$('fire-return'),fireSpray=$('fire-spray');
  let focused=true,roomTheme=null,shop=null,shopMessage='',hold=null;
  let category='homes',tool='cottage',active=false,paused=false,hover=null,pointer=null,last=null,frame=0,previous=0,view=null,destroyed=false,mode='build',interior=null,obstacles=null,resting=null,standOrigin=null,path=[],destinationBuilding=null,moving=false;
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
  function resetTravel(){path=[];destinationBuilding=null;moving=false;}
  function resetInput(){audio.stop();keys.clear();hold=null;pointer=null;last=null;resetTravel();}
  function shopNotice(message){shopMessage=message;shopStatus.textContent=message;updateRestControls(message);}
  function syncShopUI(){
    const station=Boolean(interior&&state.tiles[interior.index]==='fire'&&mode==='walk'),nearTruck=station&&cityNearTruck(player);
    fireHud.dataset.station=String(!fire);fireHud.hidden=!active||paused||mode!=='walk'||(!station&&!fire);fireBoard.hidden=Boolean(fire)||!nearTruck;fireDrive.hidden=fire?.phase!=='cab';fireReturn.hidden=!fire||['victory','failure'].includes(fire.phase);fireSpray.hidden=fire?.phase!=='drive';
    fireStatus.textContent=fire?.phase==='failure'?`${CITY_FIRE_FAILURE_LINE} Returning to the station…`:fire?.phase==='victory'?`${CITY_FIRE_VICTORY_LINE} Returning to the station…`:fire?.phase==='drive'?`Firefighting · ${Math.ceil(fire.trip.remaining)}s · ${fire.trip.extinguished}/${fire.trip.fires.length} fires out. Arrows / WASD drive and steer. Hold Space or Spray water. Aim through the windshield at fires ahead.`:fire?'Inside the fire engine · Press Drive for a fresh one-minute firefighting trip.':nearTruck?'Enter the fire engine, then press Drive.':'Walk to the fire engine’s cab door to get in.';

    animalChoices.hidden=powers.shapeshift<=0;for(const button of animalChoices.children)button.setAttribute('aria-pressed',String(button.dataset.animal===powers.animal));
    const magicText=fire?'':cityPowerMessage(powers,!interior);powerHud.hidden=!active||paused||mode!=='walk'||!magicText;powerText.textContent=magicText;powerButton.hidden=Boolean(interior)||!(powers.flight>0||powers.flowers>0);powerButton.textContent=powers.flight>0?'Hold to fly / Space':powers.flowers>0?'Hold to grow flowers / Space':'';
    walletBox.hidden=!active;walletBalance.textContent=walletState.unlimitedCoins?'∞ coins':`${walletState.coins} coins`;
    const visible=Boolean(active&&!paused&&mode==='walk'&&shop&&interior);
    shopMenu.hidden=!visible||!cityAtRegister(shop,player);
    const bedCue=active&&!paused&&mode==='walk'&&interior?cityBedReaction(roomTheme,resting):null;shopStatus.hidden=!visible&&!bedCue;
    if(bedCue){shopStatus.textContent=bedCue==='dog'?'Woof! The dog is barking. Get out of the bed to calm it down.':bedCue==='cat'?'Meow! The cat is protesting. Get out of the bed to calm it down.':'Hey, get out of the bed!';return;}
    if(!visible)return;
    const carried=cityCarriedFood(shop);
    const counter=shop.items.find(item=>!item.carried&&item.surface==='counter');
    orderPickup.hidden=!counter||Boolean(carried);orderEat.hidden=!counter&&!carried;
    for(const button of shopChoices.children){const reason=orderProblem(button.dataset.food);button.disabled=false;button.foodLock.textContent=reason;button.title=reason||'Order this food';button.dataset.unavailable=String(Boolean(reason));}
    orderMessage.textContent=shopMessage||(counter?`${CITY_FOOD[counter.kind].name} is waiting on the counter. Pick it up or eat it to clear space.`:!walletState.unlimitedCoins&&walletState.coins<1?'Your shared wallet has 0 coins. Earn coins by playing games, then come back to order.':'Choose a food to order. The price comes from your shared wallet.');

    shopStatus.textContent=shop.items.length>=6?'Six orders are already out. Eat an item before ordering more.':hold&&!hold.cancelled&&!hold.done?`Keep holding… ${Math.min(100,Math.round(hold.elapsed/CITY_HOLD_SECONDS*100))}%`:shopMessage||(carried?`Carrying ${CITY_FOOD[carried.kind].name}. Hold a clear spot on a table to put it down, or press Space to eat.`:'Walk to the register to order. Hold food to pick it up. Press Space to eat nearby food.');
  }
  function orderProblem(kind){
    const food=CITY_FOOD[kind];if(!wallet)return 'Shared wallet unavailable. Reopen City Builder from the home screen.';
    if(!cityFoodUnlocked(kind,walletState.upgrades))return 'Unlock this recipe in the main shop first.';
    if(!walletState.unlimitedCoins&&walletState.coins<food.price){const needed=food.price-walletState.coins;return `You need ${needed} more coin${needed===1?'':'s'}. Earn coins by playing games.`;}
    const counter=shop?.items.find(item=>!item.carried&&item.surface==='counter');if(counter)return `Collect or eat your ${CITY_FOOD[counter.kind].name.toLowerCase()} first.`;
    if(shop?.items.length>=6)return 'Eat an existing order to make room.';return '';
  }
  orderPickup.addEventListener('click',()=>{if(!active||paused||!interior||!cityAtRegister(shop,player))return;const counter=shop.items.find(item=>!item.carried&&item.surface==='counter');if(counter&&cityPickUpFood(shop,counter.id,player)){saveOrders();shopNotice(`Picked up ${CITY_FOOD[counter.kind].name}. The counter is ready for another order.`);}else shopNotice('Move closer to your order on the counter to pick it up.');syncShopUI();canvas.focus({preventScroll:true});},options);
  orderEat.addEventListener('click',()=>{if(!active||paused||!interior||!cityAtRegister(shop,player))return;const item=cityCarriedFood(shop)??shop.items.find(item=>item.surface==='counter');if(item&&(item.carried||Math.hypot(item.x-player.x,item.z-player.z)<=2.4))eat();else shopNotice('Move closer to your order on the counter to eat it.');syncShopUI();canvas.focus({preventScroll:true});},options);
  function saveOrders(){if(shop&&interior){state.shopOrders[`${interior.index%state.size},${Math.floor(interior.index/state.size)}`]={id:shop.id,items:shop.items.map(item=>({...item,carried:false}))};save();}}
  $('food-shop').addEventListener('click',()=>{if(active&&!paused&&mayLeave())openFoodShop();},options);
  function prepareShop(id){
    shop=createCityShop(id,view.shopSurfaces?.()??[]);shopMessage='';hold=null;shopChoices.replaceChildren();const saved=state.shopOrders[`${interior.index%state.size},${Math.floor(interior.index/state.size)}`];if(saved?.id===id)restoreCityOrders(shop,saved.items);
    if(shop){shopTitle.textContent=CITY_SHOPS[id].name;for(const kind of CITY_SHOPS[id].menu){const button=document.createElement('button');button.type='button';button.className='button outline';button.dataset.food=kind;const food=CITY_FOOD[kind];
      if(food.photo){const picture=document.createElement('span');picture.className='city-food-photo';const grid=food.photo.grid??4;picture.style.backgroundPosition=`${(food.photo.column??0)*100/(grid-1)}% ${(food.photo.row??0)*100/(grid-1)}%`;if(grid===2){picture.style.backgroundImage="url('./assets/city-food-feast.png')";picture.style.backgroundSize='200% 200%';}if(food.photo.src){picture.style.backgroundImage=`url('${food.photo.src}')`;picture.style.backgroundSize='contain';picture.style.backgroundPosition='center';}picture.setAttribute('aria-hidden','true');button.append(picture);}
      for(const [className,label] of [['city-food-name',`${food.icon??''} ${food.name}`],['city-food-price',`${food.price} coin${food.price===1?'':'s'}`],['city-food-type',food.upgrade?`Fancy food · ${kind==='whiteCake'?'Shapeshifting':kind==='cake'?'Rainbow flowers':kind==='galaxyShake'?'Flight':'Golden speed'}`:'Available · no recipe needed']]){const line=document.createElement('span');line.className=className;line.textContent=label;button.append(line);}button.foodLock=document.createElement('span');button.foodLock.className='city-food-lock';button.append(button.foodLock);
      button.addEventListener('click',()=>{if(!active||paused||!interior||!cityAtRegister(shop,player))return;
        try{const reason=orderProblem(kind);if(reason)throw Error(reason);if(cityOrderFood(shop,kind,player,food=>{if(!wallet)throw Error('Shared wallet unavailable. Reopen City Builder from the home screen.');wallet.buyFood(food);})){saveOrders();resetInput();shopNotice(`Bought ${CITY_FOOD[kind].name} for ${CITY_FOOD[kind].price} coin${CITY_FOOD[kind].price===1?'':'s'}! Your order is on the counter. Pick it up or eat it below.`);}else shopNotice('Clear the counter before ordering again.');}catch(error){shopNotice(error.message);}syncShopUI();canvas.focus({preventScroll:true});
      },options);shopChoices.append(button);}}
    syncShopUI();
  }
  function mayLeave(){if(fire)return false;if(computer.open)closeComputer();if(cityCanLeaveShop(shop))return true;resetInput();shopNotice('Please eat your food or put it on a table before leaving.');return false;}
  function availableComputer(preferred=null){return obstacles?.filter(item=>item.use?.computer&&!item.use.occupied).map(item=>item.use).sort((a,b)=>Math.hypot(a.x-(preferred?.x??player.x),a.z-(preferred?.z??player.z))-Math.hypot(b.x-(preferred?.x??player.x),b.z-(preferred?.z??player.z)))[0]??null;}
  function walkTo(p){
    stand();destinationBuilding=p.building??null;
    if(interior&&p.computerSeat){const seat=availableComputer(p.computerSeat);if(!seat){updateRestControls('All desks are occupied. Try another computer.');return;}const blockers=obstacles.filter(item=>item.use!==seat).map(item=>item.actor?{...item,actor:false}:item);path=cityRoomRoute(player,seat,blockers);if(!path.length){updateRestControls('Walk closer to the computer chair, then tap it again.');return;}updateRestControls('Walking to an available computer…');return;}
    const target=destinationBuilding!==null?cityDoor(state,destinationBuilding):p;path=interior?[{x:Math.max(-6.5,Math.min(6.5,p.x)),z:Math.max(-5.5,Math.min(5.5,p.z))}]:cityPath(state,player,target);
  }

  function advanceHold(dt){
    if(!hold||hold.done||hold.cancelled)return;hold.elapsed+=dt;if(hold.elapsed<CITY_HOLD_SECONDS)return;hold.done=true;
    if(hold.hit.orderId!==undefined){
      const picked=cityPickUpFood(shop,hold.hit.orderId,player);
      shopNotice(picked?`Carrying ${CITY_FOOD[cityCarriedFood(shop).kind].name}. Hold a clear tabletop to set it down. Space eats it.`:cityCarriedFood(shop)?'Put down or eat the food you are already carrying.':'Walk closer to the food, then hold it again.');
    }else if(cityPlaceFood(shop,hold.hit.surfaceId,hold.hit,player))shopNotice('Food placed on the table. Hold it to pick it up again, or press Space nearby to eat.');
    else shopNotice('Choose a clear spot near you, away from the table edge and other food.');saveOrders();
  }
  function typeAtComputer(typed=true){
    if(!active||paused||!resting?.computer)return;if(typed){computer.pulse=.3;computer.keys++;}computerStatus.textContent=typed?`Typing · ${computer.keys} key presses · Click the website to play. Back to city returns to your desk.`:'Choose a game on your website to play here. Back to city returns to your desk.';
    if(computer.open)return;resetInput();computer.open=true;computer.zoom=0;
    try{computerSave=storage?.getItem(CITY_KEY);}catch{}
    computerFrame=document.createElement('iframe');computerFrame.title='Sidequest website on your office computer';computerFrame.src='./index.html?city-computer=1';computerFrame.className='city-computer-frame';frameAbort=new AbortController();
    computerFrame.addEventListener('load',()=>{try{computerFrame.contentWindow.addEventListener('keydown',event=>{if(event.key===' '&&!event.repeat){computer.pulse=.3;computer.keys++;computerStatus.textContent=`Typing · ${computer.keys} key presses`;}if(event.key==='Escape'&&!computerFrame.contentDocument.querySelector('dialog[open]')){event.preventDefault();closeComputer();}}, {signal:frameAbort.signal});}catch{}},{signal:frameAbort.signal});computerScreen.append(computerFrame);
  }
  function closeComputer(){
    if(!computer.open)return;computer.open=false;computer.zoom=0;computerPanel.hidden=true;frameAbort?.abort();computerScreen.replaceChildren();computerFrame=null;resetInput();
    // A nested visit to City Builder may have edited the same saved map.
    try{const raw=storage?.getItem(CITY_KEY);if(raw&&raw!==computerSave){const restored=createCityState(raw),oldId=interior&&state.tiles[interior.index],x=interior?.index%state.size,z=Math.floor(interior?.index/state.size);Object.assign(state,restored);view.rebuild();if(interior&&x<state.size&&z<state.size&&state.tiles[z*state.size+x]===oldId){interior.index=z*state.size+x;interior.outside=cityDoor(state,interior.index);obstacles=view.furnish(oldId,interior.index);}else{interior=null;obstacles=null;resting=null;Object.assign(player,citySpawn(state));}}}catch{}
    focused=true;canvas.focus({preventScroll:true});updateRestControls();report();
  }
  $('computer-close').addEventListener('click',closeComputer,options);
  $('computer-type').addEventListener('click',()=>{if(!active||paused||mode!=='walk')return;if(resting?.computer)typeAtComputer(false);else{const seat=availableComputer();if(seat)walkTo({computerSeat:seat});}canvas.focus({preventScroll:true});},options);
  canvas.closest('dialog').addEventListener('cancel',event=>{if(computer.open){event.preventDefault();closeComputer();}},options);
  function updateRestControls(message=''){
    $('stand').hidden=!resting;$('eat').hidden=!interior;$('computer-type').hidden=!(interior&&CITY_ITEMS[state.tiles[interior.index]]?.category==='towers');
    $('action').textContent=message||(resting?.computer?'Office desk · Your website opens when you sit down. Press Space to reopen it or type. Move to stand up.':resting?(resting.pose==='lie'?'Lying down. Move or tap Stand up to get up.':resting.mealId!==undefined?'Seated at a table. Press Space or Eat food. Move to stand up.':'Sitting. Move or tap Stand up to get up.'):'');
  }
  function stand(){if(!resting)return;closeComputer();if(!resting)return;audio.stop();standOrigin={...resting.outside,seat:resting};Object.assign(player,resting.outside);resting=null;updateRestControls();}
  function sit(seat){
    resting={...seat,outside:{x:player.x,z:player.z,angle:player.angle}};
    player.x=seat.x;player.z=seat.z;player.angle=seat.angle;resetInput();updateRestControls();if(seat.computer)typeAtComputer(false);
  }
  function eat(){
    if(fire)return;
    if(active&&!paused&&!resting&&interior&&CITY_ITEMS[state.tiles[interior.index]]?.category==='towers'){const seat=availableComputer();if(seat)walkTo({computerSeat:seat});return;}
    if(resting?.computer){typeAtComputer();return;}
    if(!active||paused||!interior)return;
    const ordered=cityEatOrderedFood(shop,player);if(ordered){hold=null;saveOrders();view.eatOrder?.(ordered.kind);const power=cityGrantPower(powers,ordered.kind);if(power)audio.magic?.(power);shopNotice(`Yum! You ate the ${CITY_FOOD[ordered.kind].name.toLowerCase()}.`);syncShopUI();return;}
    if(!resting){const seat=cityNearbyMealSeat(obstacles,player);if(seat)sit(seat);}
    if(resting?.mealId===undefined){updateRestControls('Walk up to a food table, then press Space or Eat food.');return;}
    if(view.eat(resting.mealId))updateRestControls('Yum! Move to stand up.');
    else updateRestControls('That plate is empty. Move to stand up.');
  }
  $('eat').addEventListener('click',()=>{eat();canvas.focus({preventScroll:true});},options);
  $('stand').addEventListener('click',()=>{if(!active||paused)return;stand();resetInput();canvas.focus({preventScroll:true});},options);
  function setMode(next){if(!active||paused||!view||!mayLeave())return;shop=null;shopMessage='';syncShopUI();resetInput();resting=null;standOrigin=null;updateRestControls();mode=next;canvas.closest('dialog').classList.toggle('city-walking',mode==='walk');interior=null;obstacles=null;Object.assign(player,citySpawn(state),{altitude:0});lastSafe={x:player.x,z:player.z};$('build-tools').disabled=mode!=='build';$('build-tools').hidden=mode==='walk';$('person-customizer').open=mode==='build';$('walk-tools').hidden=mode!=='walk';$('play').textContent=mode==='walk'?'Back to building':'Play — explore your city';$('play').setAttribute('aria-pressed',String(mode==='walk'));for(const id of ['zoom-in','zoom-out'])$(id).disabled=mode==='walk';canvas.focus({preventScroll:true});canvas.closest('dialog').scrollTop=0;report();}
  $('play').disabled=true;$('play').addEventListener('click',()=>setMode(mode==='build'?'walk':'build'),options);
  function enter(index){
    if((player.altitude||0)>.1||index===null||!CITY_ITEMS[state.tiles[index]]?.height)return;
    obstacles=view.furnish(state.tiles[index],index);roomTheme=CITY_ITEMS[state.tiles[index]].category==='homes'?cityHomeStyle(state.size,index).theme:null;
    interior={index,outside:cityDoor(state,index)};resting=null;standOrigin=null;updateRestControls();
    player.altitude=0;player.x=0;player.z=5;player.angle=Math.PI;view.faceDoor();
    prepareShop(state.tiles[index]);
    // Preserve held keys and touch buttons across the doorway.
    resetTravel();report();
  }
  function interact(){if(!active||paused||mode!=='walk')return;if(fire)return;if(interior&&state.tiles[interior.index]==='fire'&&cityNearTruck(player)){boardTruck();return;}if(interior){if(!mayLeave())return;audio.stop();shop=null;shopMessage='';syncShopUI();resting=null;standOrigin=null;updateRestControls();player.x=interior.outside.x;player.z=interior.outside.z;interior=null;obstacles=null;updateRestControls();resetTravel();report();}else if(nearby!==null)enter(nearby);canvas.focus({preventScroll:true});}
  function boardTruck(){if(!active||paused||fire||!interior||state.tiles[interior.index]!=='fire'||!cityNearTruck(player))return;resetInput();resting=null;fire={phase:'cab',trip:null};syncShopUI();canvas.focus({preventScroll:true});}
  function returnTruck(){if(!fire)return;const count=fire.trip?.extinguished??0;fire=null;resetInput();player.x=0;player.z=3.6;player.altitude=0;player.angle=Math.PI;view.faceDoor();updateRestControls(`Back at the station · ${count} fires extinguished.`);syncShopUI();}
  fireBoard.addEventListener('click',boardTruck,options);fireDrive.addEventListener('click',()=>{if(!active||paused||fire?.phase!=='cab')return;resetInput();fire={phase:'drive',trip:createCityFireTrip()};syncShopUI();canvas.focus({preventScroll:true});},options);fireReturn.addEventListener('click',()=>{if(active&&!paused)returnTruck();},options);
  fireSpray.addEventListener('pointerdown',e=>{if(!active||paused||fire?.phase!=='drive')return;e.preventDefault();fireSpray.setPointerCapture(e.pointerId);keys.add('magic');},options);for(const event of ['pointerup','pointercancel','lostpointercapture'])fireSpray.addEventListener(event,()=>keys.delete('magic'),options);
  $('enter').addEventListener('click',interact,options);
  for(const [id,action] of [['rotate-left',()=>view?.turn(-1)],['rotate-right',()=>view?.turn(1)],['zoom-in',()=>view?.zoom(-.15)],['zoom-out',()=>view?.zoom(.15)]])$(id).addEventListener('click',()=>{action();canvas.focus({preventScroll:true});},options);
  const keyName=key=>({w:'up',a:'left',s:'down',d:'right',ArrowUp:'up',ArrowLeft:'left',ArrowDown:'down',ArrowRight:'right'}[key.length===1?key.toLowerCase():key]);
  window.addEventListener('keydown',e=>{if(!active||paused||!view||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
    audio.unlock();
    if(computer.open){if(e.key==='Escape'){e.preventDefault();closeComputer();}else if(e.key===' '){e.preventDefault();if(!e.repeat)typeAtComputer();}return;}
    if(e.target?.dataset?.food&&[' ','Enter'].includes(e.key))return;
    if(mode==='walk'){const name=keyName(e.key);if(name){e.preventDefault();if(resting&&e.repeat)return;stand();keys.add(name);path=[];destinationBuilding=null;}if(e.code==='Space'||e.key===' '){e.preventDefault();keys.add('magic');if(!e.repeat)eat();}if(e.key.toLowerCase()==='e'&&!e.repeat){e.preventDefault();interact();}}
    else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' '].includes(e.key)&&e.target===canvas){e.preventDefault();hover??={x:0,y:0};if(e.key==='ArrowUp')hover.y--;if(e.key==='ArrowDown')hover.y++;if(e.key==='ArrowLeft')hover.x--;if(e.key==='ArrowRight')hover.x++;hover.x=Math.max(0,Math.min(state.size-1,hover.x));hover.y=Math.max(0,Math.min(state.size-1,hover.y));if(e.key==='Enter'||e.key===' ')place(hover);}
  },options);
  window.addEventListener('keyup',e=>{keys.delete(keyName(e.key));if(e.code==='Space'||e.key===' ')keys.delete('magic');},options);
  powerButton.addEventListener('pointerdown',e=>{if(!active||paused)return;e.preventDefault();audio.unlock();powerButton.setPointerCapture(e.pointerId);keys.add('magic');},options);for(const name of ['pointerup','pointercancel','lostpointercapture'])powerButton.addEventListener(name,()=>keys.delete('magic'),options);window.addEventListener('blur',()=>{focused=false;resetInput();},options);window.addEventListener('focus',()=>{focused=true;},options);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInput();},options);
  for(const direction of ['up','down','left','right']){const b=$('walk-'+direction);b.addEventListener('pointerdown',e=>{if(!active||paused)return;e.preventDefault();audio.unlock();b.setPointerCapture(e.pointerId);stand();keys.add(direction);path=[];destinationBuilding=null;},options);for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>keys.delete(direction),options);}
  function place(cell){if(!active||paused||mode!=='build')return;if(cityPlace(state,cell.x,cell.y,tool))refresh();}
  function hit(e){const p=view.pick(e.clientX,e.clientY,Boolean(interior));if(!p)return null;return {...p,cell:p.building!==undefined?{x:p.building%state.size,y:Math.floor(p.building/state.size)}:{x:Math.floor(p.x/5),y:Math.floor(p.z/5)}};}
  function bindCanvas(){canvas.addEventListener('pointerdown',e=>{if(!active||paused||pointer!==null||e.button>0)return;e.preventDefault();audio.unlock();canvas.focus({preventScroll:true});pointer=e.pointerId;canvas.setPointerCapture(pointer);const p=hit(e);if(!p)return;
    if(fire||computer.open)return;if(mode==='walk'){if(shop&&(p.orderId!==undefined||(cityCarriedFood(shop)&&p.surfaceId!==undefined))){resetTravel();keys.clear();hold={hit:p,x:e.clientX,y:e.clientY,elapsed:0,done:false,cancelled:false};}else walkTo(p);}
    else{hover=p.cell;last=hover;place(hover);}},options);
    canvas.addEventListener('pointermove',e=>{if(hold&&e.pointerId===pointer){if(Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>12)hold.cancelled=true;return;}if(mode!=='build')return;const p=hit(e);if(!p)return;hover=p.cell;if(e.pointerId!==pointer||!last)return;e.preventDefault();if(tool==='road'||tool===null){const dx=hover.x-last.x,dy=hover.y-last.y,steps=Math.max(Math.abs(dx),Math.abs(dy));for(let i=1;i<=Math.min(steps,state.size*2);i++)place({x:Math.round(last.x+dx*i/steps),y:Math.round(last.y+dy*i/steps)});}last=hover;},options);
    const release=e=>{if(pointer===e.pointerId){const gesture=hold;hold=null;pointer=null;last=null;if(e.type==='pointerup'&&gesture&&!gesture.done&&!gesture.cancelled)walkTo(gesture.hit);}};for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release,options);
    canvas.addEventListener('contextmenu',e=>{if(active&&mode==='walk')e.preventDefault();},options);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;resetInput();$('loading').hidden=false;$('loading').textContent='The 3D view was interrupted. Close and reopen City Builder to restore your saved city.';},options);
  }
  function airCanWalk(x,z){
    if(x<.3||z<.3||x>state.size*5-.3||z>state.size*5-.3)return false;
    if(cityCanWalk(state,x,z))return true;
    const item=CITY_ITEMS[state.tiles[Math.floor(z/5)*state.size+Math.floor(x/5)]];
    return (player.altitude||0)>(item?.height?Math.max(2.6,item.height*.1)+2.4:.7);
  }
  function step(dt){moving=false;if(!active||paused||!focused||mode!=='walk')return;
    if(computer.open)return;
    if(fire){if(fire.phase==='drive'){cityTickFireTrip(fire.trip,dt,{up:keys.has('up'),down:keys.has('down'),left:keys.has('left'),right:keys.has('right'),spray:keys.has('magic')});if(cityFireTripWon(fire.trip)){resetInput();fire.phase='victory';fire.clipTime=0;fire.trip.speed=0;fire.trip.spraying=false;audio.cheer?.();}else if(fire.trip.remaining<=0){resetInput();fire.phase='failure';fire.clipTime=0;audio.tryAgain?.();}}else if(fire.phase==='victory'||fire.phase==='failure'){fire.clipTime+=dt;if(fire.clipTime>=(fire.phase==='failure'?CITY_FIRE_FAILURE_SECONDS:CITY_FIRE_VICTORY_SECONDS))returnTruck();}return;}
    cityTickPowers(powers,dt,!interior&&mode==='walk');flowerCooldown=Math.max(0,flowerCooldown-dt);
    if(!interior){
      if(cityCanWalk(state,player.x,player.z))lastSafe={x:player.x,z:player.z};
      const rising=powers.flight>0&&keys.has('magic'),oldAltitude=player.altitude||0;
      player.altitude=Math.max(0,Math.min(20,oldAltitude+(rising?7:-5)*dt));
      if(player.altitude<oldAltitude&&!airCanWalk(player.x,player.z)&&lastSafe){player.x=lastSafe.x;player.z=lastSafe.z;}
      if(powers.flowers>0&&keys.has('magic')&&flowerCooldown===0){const a=player.angle+flowerIndex*2.399,r=.9+(flowerIndex%6)*.4;flowerIndex++;flowerCooldown=.65;const x=player.x+Math.sin(a)*r,z=player.z+Math.cos(a)*r;if(cityCanWalk(state,x,z)){view.growFlower?.(x,z);audio.magic?.('bloom');}}
    }
    if(resting)return;let dx=0,dz=0;
    if(path.length){const target=path[0],distance=Math.hypot(target.x-player.x,target.z-player.z);if(distance<.14)path.shift();else{dx=(target.x-player.x)/distance;dz=(target.z-player.z)/distance;}}
    else{const right=Number(keys.has('right'))-Number(keys.has('left')),forward=Number(keys.has('up'))-Number(keys.has('down')),yaw=view.yaw();dx=right*Math.cos(yaw)-forward*Math.sin(yaw);dz=-right*Math.sin(yaw)-forward*Math.cos(yaw);const length=Math.hypot(dx,dz);if(length){dx/=length;dz/=length;}}
    if(dx||dz){const beforeX=player.x,beforeZ=player.z,speed=interior?3.1:cityIsSwimming(state,player)?2.3:powers.speed>0?10.5:(player.altitude||0)>.1?7:4.2;const nx=player.x+dx*speed*dt,nz=player.z+dz*speed*dt;if(interior&&cityLeavingRoom(player,{x:nx,z:nz})){interact();return;}if(!interior&&(player.altitude||0)<.1&&dz<0){const index=state.tiles.findIndex((id,i)=>{if(!CITY_ITEMS[id]?.height)return false;const door=cityDoor(state,i);return Math.abs(nx-door.x)<.5&&player.z>=door.z-.15&&nz<door.z-.15;});if(index>=0){enter(index);return;}}const seat=interior?cityFurnitureAt(obstacles,player,{x:nx,z:nz}):null;if(seat&&!(standOrigin&&seat.x===standOrigin.seat.x&&seat.z===standOrigin.seat.z)){sit(seat);return;}if(interior?cityCanWalk(state,nx,player.z,obstacles):airCanWalk(nx,player.z))player.x=nx;if(interior?cityCanWalk(state,player.x,nz,obstacles):airCanWalk(player.x,nz))player.z=nz;moving=Math.hypot(player.x-beforeX,player.z-beforeZ)>.001;if(moving)player.angle=Math.atan2(dx,dz);else path=[];}
    if(moving&&interior&&state.tiles[interior.index]==='fire'&&cityNearTruck(player)){boardTruck();return;}
    if(standOrigin&&Math.hypot(player.x-standOrigin.x,player.z-standOrigin.z)>.6)standOrigin=null;
    nearby=null;if(!interior&&(player.altitude||0)<.1){let distance=2.6;state.tiles.forEach((id,index)=>{if(!CITY_ITEMS[id]?.height)return;const door=cityDoor(state,index),d=Math.hypot(player.x-door.x,player.z-door.z);if(d<distance){nearby=index;distance=d;}});if(destinationBuilding!==null&&!path.length&&nearby===destinationBuilding)enter(destinationBuilding);}
    const text=interior?'Exit building (or walk through door)':nearby!==null?'Enter '+CITY_ITEMS[state.tiles[nearby]].name:'Walk to a front door';if($('enter').textContent!==text)$('enter').textContent=text;$('enter').disabled=!interior&&nearby===null;
  }
  function loop(now){const dt=Math.min(.04,(now-previous)/1000||0);previous=now;if(view&&!document.hidden){if(active&&!paused)advanceHold(dt);step(dt);if(active&&!paused&&focused)audio.tick(dt,cityBedReaction(roomTheme,resting));syncShopUI();if(computer.open&&!paused){computer.zoom+=dt;computerPanel.hidden=computer.zoom<.25;computer.pulse=Math.max(0,computer.pulse-dt);computerPanel.dataset.typing=String(computer.pulse>0);}view.render({mode,player,hover,time:now/1000,moving,interior,resting,shop,powers,fire,computer,dt:paused||!active||(!focused&&!computer.open)?0:dt});}frame=requestAnimationFrame(loop);}
  canvas.closest('dialog').classList.remove('city-walking');$('build-tools').disabled=false;$('build-tools').hidden=false;$('walk-tools').hidden=true;$('person-customizer').open=true;$('play').textContent='Play — explore your city';$('play').setAttribute('aria-pressed','false');for(const id of ['zoom-in','zoom-out'])$(id).disabled=false;updateRestControls();renderItems();report();$('loading').hidden=false;$('loading').textContent='Preparing your 3D city…';
  loadScene().then(({createCityScene})=>{if(destroyed)return;view=createCityScene(canvas,state);canvas=view.canvas;canvas.parentElement?.append(shopMenu,shopStatus,walletBox,powerHud,fireHud,computerPanel);bindCanvas();view.portrait($('portrait'));$('loading').hidden=true;$('play').disabled=!active;frame=requestAnimationFrame(loop);}).catch(error=>{if(destroyed)return;$('loading').hidden=false;$('loading').textContent='The 3D city could not load. Try reopening the game in a browser with WebGL enabled.';console.error(error);});
  return {start(){audio.unlock();active=true;paused=false;$('play').disabled=!view;canvas.focus({preventScroll:true});},pause(value){if(value)closeComputer();paused=value;resetInput();syncShopUI();},destroy(){animalChoices.remove?.();canvas.closest('dialog')?.classList.remove('city-walking');destroyed=true;frameAbort?.abort();computerScreen.replaceChildren();computerPanel.hidden=true;unsubscribeWallet?.();audio.destroy();walletBox.hidden=true;powerHud.hidden=true;fireHud.hidden=true;panel.append(shopMenu,shopStatus,walletBox,powerHud,fireHud,computerPanel);shopMenu.hidden=true;shopStatus.hidden=true;abort.abort();cancelAnimationFrame(frame);view?.dispose();},setMuted(value){audio.setMuted(value);}};
}
