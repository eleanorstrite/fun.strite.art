import * as T from './vendor/three/three.module.min.js';
import { CITY_ITEMS, cityWalkCamera } from './city-builder.js';

export function createCityScene(original,state){
  const canvas=original.cloneNode();
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(900,650,false);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  original.replaceWith(canvas);
  const scene=new T.Scene();scene.background=new T.Color('#adcbdc');scene.fog=new T.Fog('#adcbdc',110,260);
  const camera=new T.PerspectiveCamera(47,900/650,.1,500);
  const light=new T.DirectionalLight('#fff1d8',3.2);light.position.set(-35,65,35);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.radius=3;light.shadow.bias=-.0005;light.shadow.normalBias=.035;
  light.shadow.camera.left=-80;light.shadow.camera.right=80;light.shadow.camera.top=80;light.shadow.camera.bottom=-80;light.shadow.camera.far=240;scene.add(light,light.target,new T.HemisphereLight('#dbefff','#7b7658',2.1));
  const world=new T.Group(),room=new T.Group(),avatar=new T.Group();scene.add(world,room,avatar);room.visible=false;avatar.visible=false;
  const materials=new Map(),geometries=new Map(),textures=new Set();let buildings=[],grid,selection,roomObstacles=[],doorFrame=[],yaw=.35,zoom=1,look=new T.Vector3(),initialized=false;
  const material=(key,opts)=>{if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial(opts));return materials.get(key);};
  const solid=(color,roughness=.8)=>material(color+roughness,{color,roughness});
  function texture(key,paint){if(materials.has(key))return materials.get(key);const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');paint(ctx);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;textures.add(map);return material(key,{map,roughness:.87,bumpMap:map,bumpScale:.025});}
  let seed=7;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const grass=texture('grass',c=>{c.fillStyle='#76845b';c.fillRect(0,0,256,256);for(let i=0;i<11000;i++){c.fillStyle=['#596d45','#9b9b6b','#7e925b','#63774c'][i%4];c.fillRect(random()*256,random()*256,1+random()*2,1+random()*4);}});
  const road=texture('asphalt',c=>{c.fillStyle='#454a4b';c.fillRect(0,0,256,256);for(let i=0;i<9000;i++){const g=55+Math.floor(random()*45);c.fillStyle=`rgb(${g},${g},${g})`;c.fillRect(random()*256,random()*256,1,1);}});
  const wood=texture('wood',c=>{c.fillStyle='#9c7754';c.fillRect(0,0,256,256);for(let i=0;i<256;i++){c.strokeStyle=i%32===0?'#5b4938':`rgba(55,30,15,${random()*.18})`;c.beginPath();c.moveTo(0,i);c.bezierCurveTo(65,i+random()*3,180,i-2,256,i);c.stroke();}});
  const tile=texture('tile',c=>{c.fillStyle='#c7c4b7';c.fillRect(0,0,256,256);c.strokeStyle='#aaa99e';for(let i=0;i<=256;i+=64){c.strokeRect(i,0,64,256);c.strokeRect(0,i,256,64);}});
  function geo(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
  function mesh(parent,geometry,mat,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(parent,x,y,z,w,h,d,mat){const m=mesh(parent,geo('box',()=>new T.BoxGeometry(1,1,1)),typeof mat==='string'?solid(mat):mat,x,y,z);m.scale.set(w,h,d);return m;}
  function ball(parent,x,y,z,rx,ry,rz,mat){const m=mesh(parent,geo('sphere',()=>new T.SphereGeometry(1,14,10)),typeof mat==='string'?solid(mat):mat,x,y,z);m.scale.set(rx,ry,rz);return m;}
  function cylinder(parent,x,y,z,r,h,mat){const m=mesh(parent,geo('cylinder',()=>new T.CylinderGeometry(1,1,1,16)),typeof mat==='string'?solid(mat):mat,x,y,z);m.scale.set(r,h,r);return m;}
  function text(parent,value,x,y,z,w=2){
    const key='sign:'+value;let mat=materials.get(key);
    if(!mat){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#e8e4d5';ctx.fillRect(0,0,512,128);ctx.fillStyle='#293b3a';ctx.textAlign='center';ctx.font='600 45px sans-serif';ctx.fillText(value.toUpperCase(),256,81);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;textures.add(map);mat=material(key,{map,roughness:.7});}
    box(parent,x,y,z,w,w/4,.035,mat);
  }
  function tree(parent,x,z,scale=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);cylinder(g,0,1,0,.14,2,wood);for(let i=0;i<6;i++)ball(g,Math.sin(i*2)*.48,2.3+(i%2)*.4,Math.cos(i*2)*.4,.65,.85,.65,['#526d3f','#6b804c','#435e39'][i%3]);}
  function facade(id){const item=CITY_ITEMS[id];return texture('facade:'+id,c=>{
    c.fillStyle=item.color;c.fillRect(0,0,256,256);for(let i=0;i<4000;i++){c.fillStyle=`rgba(40,35,25,${random()*.12})`;c.fillRect(random()*256,random()*256,2,1);}
    const floors=Math.max(1,Math.round(item.height/20)),fh=256/floors;
    for(let y=0;y<floors;y++)for(let x=0;x<3;x++){const xx=16+x*83,yy=y*fh+8;const g=c.createLinearGradient(xx,yy,xx+52,yy+fh-16);g.addColorStop(0,'#a9bec8');g.addColorStop(.48,'#67828c');g.addColorStop(.5,'#c2d0cc');g.addColorStop(1,'#496777');c.fillStyle='#d8d5c9';c.fillRect(xx-3,yy-3,59,Math.max(12,fh-12));c.fillStyle=g;c.fillRect(xx,yy,53,Math.max(8,fh-18));c.fillStyle='#9baba8';c.fillRect(xx+25,yy,2,fh-18);}
    if(item.category==='towers'){c.strokeStyle='#c6cdca';for(let i=0;i<256;i+=32){c.beginPath();c.moveTo(i,0);c.lineTo(i,256);c.stroke();}}
  });}
  function house(parent,id,x,z,index){const item=CITY_ITEMS[id],g=new T.Group();g.position.set(x,0,z);parent.add(g);const h=Math.max(2.6,item.height*.1);const wall=facade(id),roof=solid('#737872');
    const body=box(g,0,h/2,0,3.2,h,3.2,[wall,wall,roof,roof,wall,wall]);body.userData.building=index;buildings.push(body);
    box(g,0,.08,0,3.55,.16,3.55,tile);
    if(item.category==='homes'&&item.height<50){const r=mesh(g,geo('roof',()=>new T.ConeGeometry(2.6,1.6,4)),solid('#79584a'),0,h+.7,0);r.rotation.y=Math.PI/4;box(g,.8,h+1,0,.35,1.4,.4,solid('#9c8069'));}
    else{box(g,0,h+.1,0,3.35,.2,3.35,roof);box(g,.7,h+.35,-.5,.7,.4,.85,'#a4aaa7');}
    box(g,0,.8,1.62,.65,1.6,.06,solid('#374d51',.25));box(g,.23,.8,1.67,.04,.13,.04,'#c8b47f');box(g,0,.03,2.1,1.2,.06,1,tile);
    if(item.category==='shops'||item.category==='services'){text(g,item.name,0,2.25,1.64,2.8);box(g,0,1.93,1.95,3,.12,.7,id==='cafe'?'#56766d':'#916e57');}
    if(id==='hospital'){box(g,0,h+.5,1.65,.2,.75,.08,'#b5524d');box(g,0,h+.5,1.65,.65,.2,.09,'#b5524d');}
  }
  function batch(group){
    group.updateMatrixWorld(true);const batches=new Map();
    group.traverse(object=>{if(!object.isMesh||object===selection||doorFrame.includes(object))return;const mats=Array.isArray(object.material)?object.material:[object.material],key=object.geometry.uuid+':'+mats.map(m=>m.uuid).join(',');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(object);});
    for(const objects of batches.values()){const instanced=new T.InstancedMesh(objects[0].geometry,objects[0].material,objects.length);objects.forEach((object,i)=>{instanced.setMatrixAt(i,object.matrixWorld);object.removeFromParent();});instanced.castShadow=true;instanced.receiveShadow=true;instanced.computeBoundingSphere();group.add(instanced);}
  }
  function clear(group){group.traverse(object=>{if(object.isInstancedMesh)object.dispose();});group.clear();}
  function rebuild(){
    clear(world);buildings=[];const n=state.size*5,center=n/2;grass.map.wrapS=grass.map.wrapT=T.RepeatWrapping;grass.map.repeat.set(state.size*1.5,state.size*1.5);
    box(world,center,-.15,center,n,.3,n,grass);
    box(world,center,-.5,center,440,.4,440,solid(state.theme==='country'?'#788560':'#8a9684'));
    grid=new T.GridHelper(n,state.size,'#ccd1bd','#a6b49b');grid.position.set(center,.015,center);grid.material.transparent=true;grid.material.opacity=.35;world.add(grid);
    seed=42;
    for(let i=0;i<60;i++){const angle=i/60*Math.PI*2,r=n*1.6+random()*35;const x=center+Math.cos(angle)*r,z=center+Math.sin(angle)*r;
      if(state.theme==='country'){tree(world,x,z,1+random()*1.8);if(i%10===0){const hill=ball(world,x,-5,z,18,9,18,grass);hill.castShadow=false;}}
      else if(i%2===0){const h=8+random()*18;box(world,x,h/2,z,5+random()*6,h,6,facade(i%4?'glass':'office'));}
    }
    for(let z=0;z<state.size;z++)for(let x=0;x<state.size;x++){
      const index=z*state.size+x,id=state.tiles[index],px=x*5+2.5,pz=z*5+2.5;if(!id)continue;
      if(CITY_ITEMS[id].height)house(world,id,px,pz,index);
      else if(id==='road'){
        box(world,px,.015,pz,5,.03,5,road);
        for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])if(x+dx>=0&&x+dx<state.size&&z+dz>=0&&z+dz<state.size&&state.tiles[(z+dz)*state.size+x+dx]==='road')box(world,px+dx*1.5,.04,pz+dz*1.5,dx?1.3:.06,.015,dz?1.3:.06,'#d8cba2');
      }else if(id==='park'){tree(world,px-.7,pz-.5);tree(world,px+.7,pz+.7,.8);box(world,px,.45,pz+1.4,1.5,.15,.4,wood);}
      else if(id==='pond'){box(world,px,.02,pz,3.5,.06,3.5,material('water',{color:'#628f91',roughness:.12,metalness:.35}));for(let i=0;i<5;i++)ball(world,px-1.6+i*.8,.08,pz-1.8,.3,.18,.25,'#8c8c7d');}
      else if(id==='plaza'){box(world,px,.02,pz,4.8,.06,4.8,tile);cylinder(world,px,.3,pz,.9,.5,'#bcb9a8');cylinder(world,px,.57,pz,.74,.06,'#779c9e');}
      else if(id==='flowers')for(let i=0;i<12;i++){const xx=px-1.5+random()*3,zz=pz-1.5+random()*3;cylinder(world,xx,.15,zz,.025,.3,'#647747');ball(world,xx,.32,zz,.12,.08,.12,['#b77983','#d7bb73','#b3a1bf'][i%3]);}
    }
    selection=box(world,0,.05,0,4.95,.03,4.95,material('selection',{color:'#f3db91',transparent:true,opacity:.35,depthWrite:false}));selection.visible=false;
    batch(world);light.target.position.set(center,0,center);light.position.set(center-35,65,center+35);initialized=false;
  }
  let limbs=[],head;
  function person(){avatar.clear();limbs=[];const p=state.person,skin=solid(p.skin),jacket=solid(p.jacket),pants=solid(p.pants),hair=solid(p.hair);
    const torso=mesh(avatar,geo('torso',()=>new T.CapsuleGeometry(.24,.38,6,12)),jacket,0,1.15,0);torso.scale.z=.65;
    if(p.outfit==='coat')box(avatar,0,.82,0,.53,.55,.36,jacket);
    box(avatar,0,1.2,.18,.025,.62,.02,'#c6bd9c');
    for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.13,.77,0);avatar.add(leg);mesh(leg,geo('limb',()=>new T.CapsuleGeometry(.085,.46,5,10)),p.pantsStyle==='shorts'?skin:pants,0,-.28,0);if(p.pantsStyle==='shorts')box(leg,0,-.12,0,.2,.3,.2,pants);box(leg,0,-.64,.06,.19,.14,.34,'#333435');limbs.push(leg);
      const arm=new T.Group();arm.position.set(side*.32,1.37,0);avatar.add(arm);mesh(arm,geo('arm',()=>new T.CapsuleGeometry(.075,.4,5,10)),jacket,0,-.24,0);ball(arm,0,-.5,0,.07,.1,.07,skin);limbs.push(arm);}
    cylinder(avatar,0,1.52,0,.08,.16,skin);head=ball(avatar,0,1.76,0,.18,.23,.18,skin);ball(avatar,0,1.9,-.02,.19,.13,.18,hair);ball(avatar,0,1.76,.175,.045,.055,.05,skin);
    for(const x of [-.07,.07])ball(avatar,x,1.8,.16,.018,.022,.015,'#28332e');
    if(p.outfit==='hoodie')ball(avatar,0,1.52,-.13,.24,.21,.18,jacket);
    if(p.accessory==='cap'){ball(avatar,0,1.96,0,.2,.09,.2,jacket);box(avatar,0,1.94,.2,.36,.035,.22,jacket);}
    if(p.accessory==='backpack'){box(avatar,0,1.2,-.24,.4,.52,.2,'#98734c');for(const x of [-.18,.18])box(avatar,x,1.25,.19,.045,.4,.03,'#98734c');}
    if(p.accessory==='scarf'){cylinder(avatar,0,1.5,0,.18,.14,'#b56f4e');box(avatar,.1,1.28,.2,.13,.4,.05,'#b56f4e');}
    if(p.accessory==='glasses'){for(const x of [-.075,.075])box(avatar,x,1.8,.182,.12,.075,.025,'#252d2d');box(avatar,0,1.8,.19,.06,.02,.02,'#252d2d');}
  }
  function furnish(id){clear(room);roomObstacles=[];doorFrame=[];const category=CITY_ITEMS[id].category,accent=CITY_ITEMS[id].color;
    const palette={cafe:'#386e64',bakery:'#c86a88',market:'#508953',school:'#dba638',hospital:'#65a8b9',fire:'#bb473a',cottage:'#b77b4b',townhouse:'#876899',apartments:'#437a96',glass:'#3b8797',skyline:'#675398',office:'#476960'};const color=palette[id]||accent;
    const add=(x,z,w,h,d,mat)=>{roomObstacles.push({x,z,w,d});return box(room,x,h/2,z,w,h,d,mat);};
    box(room,0,-.1,0,14,.2,12,category==='services'?tile:wood);
    box(room,0,2,-6,14,4,.15,accent);box(room,-7,2,0,.15,4,12,'#f0e8db');
    box(room,0,.45,-5.88,14,.9,.08,color);box(room,-6.88,.45,0,.08,.9,12,color);
    box(room,0,.08,5.65,1.7,.08,.65,'#429c80');
    const frameStart=room.children.length;
    for(const x of [-1,1])box(room,x,1.4,5.8,.16,2.8,.18,color);
    box(room,0,2.85,5.8,2.2,.18,.18,color);
    text(room,'EXIT → STREET',0,3.1,5.8,2); // Visible from both sides of the open doorway.
    const sign=room.children.at(-1);sign.material.side=T.DoubleSide;doorFrame=room.children.slice(frameStart);
    for(const x of [-4,4]){cylinder(room,x,3.65,-1,.025,.7,'#575b56');cylinder(room,x,3.25,-1,.4,.22,color);cylinder(room,x,3.12,-1,.32,.035,material('lamp-glow',{color:'#fff3c4',emissive:'#ffcf74',emissiveIntensity:1}));}
    const resident=(x,z,shirt,seated=false,angle=0)=>{const g=new T.Group();room.add(g);g.position.set(x,0,z);g.rotation.y=angle;const skin=['#c58e68','#754c36','#e5b991'][Math.abs(Math.round(x))%3],hip=seated?.58:.85;
      box(g,0,hip+.3,0,.46,.6,.3,shirt);ball(g,0,hip+.85,0,.18,.23,.18,skin);ball(g,0,hip+1,0,.19,.11,.19,'#49362d');
      for(const side of [-1,1]){box(g,side*.3,hip+.22,.08,.12,.5,.14,skin);box(g,side*.13,seated?.5:.43,seated?.23:0,.17,seated?.16:.8,seated?.55:.18,'#344657');if(seated)box(g,side*.13,.27,.46,.17,.45,.17,'#344657');box(g,side*.13,.08,seated?.52:.08,.2,.14,.32,'#303638');ball(g,side*.065,hip+.88,.17,.018,.02,.015,'#252d30');}
      if(!seated)roomObstacles.push({x,z,w:.65,d:.65});};
    const art=(x,z,label,tint)=>{box(room,x,2.05,z,1.65,1.3,.12,wood);box(room,x,2.05,z+.08,1.45,1.1,.03,tint);text(room,label,x,2.05,z+.12,1.3);};

    for(const x of [-4,4]){box(room,x,2.3,-5.9,2.7,1.7,.06,material('window',{color:'#b0d2dd',emissive:'#89a8b2',emissiveIntensity:.3,roughness:.18}));for(const dx of [-1.4,0,1.4])box(room,x+dx,2.3,-5.8,.06,1.8,.06,'#faf6e8');}
    text(room,CITY_ITEMS[id].name,0,3.2,-5.85,3.7);
    const chair=(x,z)=>{roomObstacles.push({x,z,w:.65,d:.65});box(room,x,.48,z,.65,.1,.65,wood);box(room,x,.92,z-.28,.65,.85,.12,wood);for(const xx of [-.23,.23])for(const zz of [-.23,.23])box(room,x+xx,.22,z+zz,.06,.44,.06,wood);};
    const table=(x,z)=>{roomObstacles.push({x,z,w:1.5,d:1.2});box(room,x,.89,z,1.5,.09,1.2,wood);for(const xx of [-.58,.58])for(const zz of [-.43,.43])box(room,x+xx,.43,z+zz,.08,.86,.08,'#4c514c');};
    const shelf=(x,z,food=false)=>{add(x,z,2.7,1.9,.7,wood);for(let level=0;level<3;level++)for(let i=0;i<6;i++)box(room,x-1.1+i*.43,.3+level*.55,z+.4,.25,.3,.25,food?['#a75e42','#d4b969','#788d56'][i%3]:['#637a82','#b59b7d','#8f6857'][i%3]);};
    if(id==='cafe'||id==='bakery'){
      add(-3,-3.5,5,1.1,1.3,wood);box(room,-3,1.14,-3.5,5.1,.1,1.4,'#c6c2b3');box(room,-4,1.5,-3.5,.9,.65,.55,'#4a5554');cylinder(room,-3,1.3,-3,.16,.22,'#f5f0de');
      for(const x of [-3,2])for(const z of [0,3]){table(x,z);chair(x-.1,z-1);chair(x+.1,z+1);cylinder(room,x,.99,z,.1,.15,'#eee6cf');}
      text(room,id==='cafe'?'Coffee · Tea · Cake':'Bread · Pastries',-3,2.3,-5.8,3.5);
      if(id==='bakery')for(let i=0;i<8;i++)ball(room,-4.8+i*.52,1.3,-3.3,.2,.12,.12,'#b8894b');
    }else if(category==='homes'){
      add(-3,0,3.3,.65,1.2,color);box(room,-3,1, -.45,3.3,.75,.3,color);table(-3,2);add(3,-3,2.5,.5,3.4,wood);box(room,3,.65,-3,2.4,.25,3.3,'#ded8c7');box(room,3,.85,-4,2.1,.18,.65,'#f4f0e7');shelf(-4,-4.8);add(4,3,2,.85,1,wood);box(room,4,1.2,3,.9,.5,.2,'#414d4e');
    }else if(id==='market'){
      for(const x of [-4,0,4])for(const z of [-3,1])shelf(x,z,true);add(-4,4,3,1,1,wood);box(room,-4,1.25,4,.5,.4,.4,'#444e4e');
    }else if(id==='school'){
      box(room,0,2,-5.82,5,1.5,.1,'#325f54');text(room,'Learn · Imagine · Create',0,2,-5.7,4);
      for(const x of [-4,0,4])for(const z of [-2,1,4]){if(x===0&&z===4)continue;table(x,z);chair(x,z+1);}shelf(-5,-4.9);
    }else if(id==='hospital'){
      for(const x of [-4,3])for(const z of [-2,2]){add(x,z,1.8,.55,2.5,'#dfe3dc');box(room,x,.8,z,1.75,.25,2.4,color);box(room,x,1,z-.8,1.5,.2,.5,'#f2f1e8');cylinder(room,x+1.1,1.1,z,.035,2.2,'#a7aeab');}
      text(room,'Care & kindness',0,2,-5.7,3);
    }else if(id==='fire'){
      add(-2,-1,3,1.4,5,'#9d4238');box(room,-2,1.85,.5,2.8,.7,1.8,'#a34d40');box(room,-2,1.95,1.42,2.3,.5,.04,'#9bb6bb');for(const x of [-3.6,-.4])for(const z of [-2.5,.5])ball(room,x,.5,z,.25,.5,.5,'#303937');shelf(4,-4);text(room,'Ready to help',0,2.3,-5.7,3);
    }else{
      for(const x of [-4,0,4])for(const z of [-2,2]){table(x,z);chair(x,z+1);box(room,x,1.2,z,.75,.5,.08,'#3d5157');}shelf(-4,-4.8);
    }
    // Purpose-specific details keep each visit recognizable from the doorway.
    if(id==='cafe'||id==='bakery'){
      resident(-3,-4.6,id==='cafe'?'#2d6857':'#faf0df');resident(2,-1,'#d38a36',true);resident(-3,2,'#7a67ad',true);
      art(3,-5.78,id==='cafe'?'Fresh coffee':'Baked daily',color);
      for(const x of [-3,2])for(const z of [0,3]){cylinder(room,x+.35,.96,z,.22,.025,'#fff2dc');ball(room,x+.35,1.03,z,.15,.07,.12,'#bf813d');}
      if(id==='cafe'){for(const x of [-5,-4.5]){cylinder(room,x,1.32,-3.5,.13,.35,'#684332');}box(room,-4,1.55,-3.17,.7,.25,.05,'#bac5c1');}
      else {shelf(4,-4.6,true);box(room,-1.2,1.5,-3.5,1.2,.6,.75,material('pastry-glass',{color:'#c5ebee',transparent:true,opacity:.25,roughness:.1,depthWrite:false}));}
    }else if(category==='homes'){
      box(room,-3,.015,1,4.7,.025,4,color);for(const x of [-4,-2])box(room,x,.85,0,.6,.38,.65,accent);
      art(0,-5.78,id==='cottage'?'Home sweet home':id==='townhouse'?'City gallery':'Skyline living',color);
      add(5,-1,1.3,1.9,.7,'#e8e4d9');box(room,5,1,-.61,.06,.5,.05,'#616d72');resident(-3,0,'#c58b54',true);
    }else if(id==='market'){
      resident(-4,5,'#4d8f55',false,Math.PI);text(room,'Produce · Pantry · Fresh food',0,2.5,-5.75,5);
      for(const x of [-4,0,4])for(let i=0;i<5;i++)ball(room,x-.9+i*.43,2.03,-3,.16,.14,.15,['#e0aa38','#c5503b','#72a24e'][i%3]);
    }else if(id==='school'){
      resident(-4,2,'#db8444',true,Math.PI);resident(4,-1,'#6b79c1',true,Math.PI);resident(2,-4.5,'#498d76');art(5,-5.78,'A B C',color);
      for(const x of [-4,0,4])for(const z of [-2,1,4])if(x!==0||z!==4)box(room,x,.96,z,.55,.04,.4,'#f4e4a6');
    }else if(id==='hospital'){
      resident(5,-3,'#f7faf4');for(const x of [-4,3]){box(room,x,1.7,-4.7,.8,.6,.12,'#334b57');text(room,'♥ 72',x,1.7,-4.6,.65);}art(0,-5.78,'First aid',color);
    }else if(id==='fire'){
      resident(4,1,'#d7a53d');for(const x of [3,4,5]){add(x,-4.8,.8,2.2,.6,'#b94135');box(room,x,1.4,-4.46,.35,.05,.05,'#d7c9ac');}box(room,-2,2.27,.5,1.5,.12,.3,'#4e8ed2');
    }else{
      resident(-4,3,'#6674a1',true,Math.PI);resident(4,-1,'#cb8559',true,Math.PI);
      for(const x of [-4,0,4])for(const z of [-2,2]){box(room,x,1.2,z+.05,.65,.38,.025,'#75b7cb');box(room,x,.96,z+.35,.6,.04,.2,'#424e56');}
      art(3,-5.78,id==='glass'?'Design studio':id==='skyline'?'Skyline HQ':'Team workspace',color);
    }
    cylinder(room,5.6,.25,-4.7,.38,.5,color);tree(room,5.6,-4.7,.65);
    batch(room);return roomObstacles;
  }
  function render({mode,player,hover,time,moving,interior,dt}){
    const inside=Boolean(interior);world.visible=!inside;room.visible=inside;avatar.visible=mode==='walk';grid.visible=mode==='build';
    if(selection){selection.visible=!inside&&mode==='build'&&hover&&hover.x>=0&&hover.y>=0&&hover.x<state.size&&hover.y<state.size;if(selection.visible)selection.position.set(hover.x*5+2.5,.07,hover.y*5+2.5);}
    if(avatar.visible){avatar.position.set(player.x,.07,player.z);avatar.rotation.y=player.angle||0;const swing=moving?Math.sin(time*9)*.5:0;limbs.forEach((limb,i)=>limb.rotation.x=swing*(i===0||i===3?1:-1));}
    const target=new T.Vector3(),position=new T.Vector3();
    if(mode==='walk'){const pose=cityWalkCamera(player,yaw);target.set(pose.target.x,pose.target.y,pose.target.z);position.set(pose.position.x,pose.position.y,pose.position.z);}
    else{target.set(state.size*2.5,0,state.size*2.5);const distance=state.size*5*1.1*zoom;position.set(target.x+Math.sin(yaw+.5)*distance,distance*.85,target.z+Math.cos(yaw+.5)*distance);}
    const ease=mode==='walk'||!initialized?1:1-Math.exp(-dt*6);camera.position.lerp(position,ease);look.lerp(target,ease);camera.lookAt(look);initialized=true;
    for(const piece of doorFrame)piece.visible=position.z<5.6;
    scene.background.set(inside?'#d8d1c4':'#adcbdc');scene.fog.near=inside?200:110;renderer.render(scene,camera);
  }
  const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0);
  function pick(clientX,clientY,inside=false){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);const p=new T.Vector3();if(!ray.ray.intersectPlane(plane,p))return null;const hit=inside?null:ray.intersectObjects(buildings,false)[0];return {x:p.x,z:p.z,building:hit?.object.userData.building};}
  function portrait(target){const oldPosition=avatar.position.clone(),oldRotation=avatar.rotation.y,oldVisible=avatar.visible,oldWorld=world.visible,oldRoom=room.visible;world.visible=false;room.visible=false;avatar.visible=true;avatar.position.set(0,0,0);avatar.rotation.y=-.25;const cam=new T.PerspectiveCamera(30,1,.1,20);cam.position.set(0,1.3,4.5);cam.lookAt(0,1.05,0);renderer.setSize(200,200,false);renderer.render(scene,cam);const c=target.getContext('2d');c.drawImage(canvas,0,0,target.width,target.height);renderer.setSize(900,650,false);avatar.position.copy(oldPosition);avatar.rotation.y=oldRotation;avatar.visible=oldVisible;world.visible=oldWorld;room.visible=oldRoom;}
  rebuild();person();
  return {canvas,rebuild,person,render,pick,furnish,portrait,faceDoor(){yaw=0;},turn(direction){yaw+=direction*.35;},zoom(value){zoom=Math.max(.65,Math.min(1.5,zoom+value));},yaw:()=>yaw,dispose(){clear(world);clear(room);for(const m of materials.values())m.dispose();for(const g of geometries.values())g.dispose();for(const t of textures)t.dispose();renderer.dispose();renderer.forceContextLoss();canvas.replaceWith(original);}};
}
