// Canvas gestures use CSS pixels, so thresholds stay comfortable on small screens.
export function bindTagSwipes(canvas,{enabled,local,onTouch=()=>{}},options={}){
  const contacts=new Map(),directions=[0,0],jumps=[0,0];
  function move(e){
    const p=contacts.get(e.pointerId);if(!p)return;
    if(!enabled()){clear();return;}
    const dx=e.clientX-p.x,dy=e.clientY-p.y;
    if(Math.abs(dx)>=12){directions[p.player]=Math.sign(dx);p.x=e.clientX;p.moved=true;}
    if(dy<=-20){jumps[p.player]=.16;p.y=e.clientY;p.moved=true;}
    else if(dy>20)p.y=e.clientY;
  }
  function clear(){contacts.clear();directions.fill(0);jumps.fill(0);}
  function stop(player){directions[player]=0;jumps[player]=0;for(const [id,p] of contacts)if(p.player===player)contacts.delete(id);}
  canvas.addEventListener('pointerdown',e=>{
    if(!enabled()||e.button>0)return;
    const bounds=canvas.getBoundingClientRect(),player=local()&&e.clientX>bounds.left+bounds.width/2?1:0;
    if([...contacts.values()].some(p=>p.player===player))return;
    e.preventDefault();canvas.focus({preventScroll:true});onTouch(player);
    contacts.set(e.pointerId,{player,x:e.clientX,y:e.clientY,moved:false});canvas.setPointerCapture?.(e.pointerId);
  },options);
  canvas.addEventListener('pointermove',e=>{if(contacts.has(e.pointerId)){e.preventDefault();move(e);}},options);
  canvas.addEventListener('pointerup',e=>{
    const p=contacts.get(e.pointerId);if(!p)return;e.preventDefault();move(e);if(!p.moved)stop(p.player);contacts.delete(e.pointerId);
    // A swipe latches movement; a tap stops. Quick swipes survive finger release.
  },options);
  for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{const p=contacts.get(e.pointerId);if(p){directions[p.player]=0;jumps[p.player]=0;contacts.delete(e.pointerId);}},options);
  return {clear,stop,input:i=>({left:directions[i]<0,right:directions[i]>0,jump:jumps[i]>0}),advance(dt){for(let i=0;i<2;i++)jumps[i]=Math.max(0,jumps[i]-dt);}};
}
export function bindMazeSwipes(canvas,{enabled,turn},options={}){
  let contact=null;
  const clear=()=>contact=null;
  function move(e,release=false){
    if(!contact||contact.id!==e.pointerId||contact.sent)return;
    if(!enabled()){clear();return;}
    const dx=e.clientX-contact.x,dy=e.clientY-contact.y,ax=Math.abs(dx),ay=Math.abs(dy);
    if(Math.max(ax,ay)<18||(!release&&Math.max(ax,ay)<Math.min(ax,ay)*1.25))return;
    contact.sent=true;turn(ax>ay?(dx>0?'right':'left'):(dy>0?'down':'up'));
  }
  canvas.addEventListener('pointerdown',e=>{
    if(contact||!enabled()||e.button>0)return;e.preventDefault();canvas.focus({preventScroll:true});contact={id:e.pointerId,x:e.clientX,y:e.clientY,sent:false};canvas.setPointerCapture?.(e.pointerId);
  },options);
  canvas.addEventListener('pointermove',e=>{if(contact?.id===e.pointerId){e.preventDefault();move(e);}},options);
  canvas.addEventListener('pointerup',e=>{if(contact?.id===e.pointerId){e.preventDefault();move(e,true);clear();}},options);
  for(const name of ['pointercancel','lostpointercapture','blur'])canvas.addEventListener(name,e=>{if(name==='blur'||contact?.id===e.pointerId)clear();},options);
  return {clear};
}
