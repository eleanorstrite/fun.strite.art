import {createFireGraphics} from './city-fire-3d.js';
import {createCityMagic} from './city-magic-3d.js';
import { createCityFirefighter, cityTickFirefighter, citySip, cityBedReaction, createCityRoutine, cityTickRoutine, createCityRoamer, cityRoam } from './city-life.js';
import { CITY_FOOD, CITY_SHOPS } from './city-shop.js';
import * as T from './vendor/three/three.module.min.js';
import { cityHomeStyle, cityActivityPose } from './city-interiors.js';
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
  const materials=new Map(),geometries=new Map(),textures=new Set();let buildings=[],grid,selection,roomObstacles=[],doorFrame=[],roomAnimations=[],roomTime=0,roomPets=[],bedAlert=null,currentRest=null,roomHome=null,fridgeDoor=null,shopSurfaces=[],orderMeshes=new Map(),celebration=null,meals=[],residents=[],biteUntil=0,reactionTarget={x:0,z:0},yaw=.35,zoom=1,look=new T.Vector3(),initialized=false;
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
    if(!mat){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#e8e4d5';ctx.fillRect(0,0,512,128);ctx.fillStyle='#293b3a';ctx.textAlign='center';ctx.font=`600 ${Math.min(45,Math.floor(760/value.length))}px sans-serif`;ctx.fillText(value.toUpperCase(),256,81);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;textures.add(map);mat=material(key,{map,roughness:.7});}
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
    group.traverse(object=>{if(!object.isMesh||object===selection||object.userData.animated||doorFrame.includes(object))return;const mats=Array.isArray(object.material)?object.material:[object.material],key=object.geometry.uuid+':'+mats.map(m=>m.uuid).join(',');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(object);});
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
  let limbs=[],knees=[],head,bite,magic;
  const fireGraphics=createFireGraphics(scene,camera,material,geo);
  function showBite(kind){bite.clear();const food=orderModel(kind);food.removeFromParent();food.name='eating-'+kind;food.scale.setScalar(['galaxyShake','fruitCup','cake'].includes(kind)?.33:.55);bite.add(food);bite.userData.kind=kind;}
  function person(){avatar.clear();limbs=[];knees=[];const p=state.person,skin=solid(p.skin),jacket=solid(p.jacket),pants=solid(p.pants),hair=solid(p.hair);
    const torso=mesh(avatar,geo('torso',()=>new T.CapsuleGeometry(.24,.38,6,12)),jacket,0,1.15,0);torso.scale.z=.65;
    if(p.outfit==='coat')box(avatar,0,.82,0,.53,.55,.36,jacket);
    box(avatar,0,1.2,.18,.025,.62,.02,'#c6bd9c');
    for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.13,.77,0);avatar.add(leg);mesh(leg,geo('thigh',()=>new T.CapsuleGeometry(.085,.17,5,10)),pants,0,-.15,0);const knee=new T.Group();leg.add(knee);knee.position.y=-.31;knees.push(knee);mesh(knee,geo('shin',()=>new T.CapsuleGeometry(.08,.17,5,10)),p.pantsStyle==='shorts'?skin:pants,0,-.15,0);box(knee,0,-.33,.06,.19,.14,.34,'#333435');limbs.push(leg);
      const arm=new T.Group();arm.position.set(side*.32,1.37,0);avatar.add(arm);mesh(arm,geo('arm',()=>new T.CapsuleGeometry(.075,.4,5,10)),jacket,0,-.24,0);ball(arm,0,-.5,0,.07,.1,.07,skin);limbs.push(arm);}
    bite=new T.Group();bite.name='eating-food';avatar.add(bite);bite.visible=false;magic?.reattach();
    cylinder(avatar,0,1.52,0,.08,.16,skin);head=ball(avatar,0,1.76,0,.18,.23,.18,skin);ball(avatar,0,1.9,-.02,.19,.13,.18,hair);ball(avatar,0,1.76,.175,.045,.055,.05,skin);
    for(const x of [-.07,.07])ball(avatar,x,1.8,.16,.018,.022,.015,'#28332e');
    if(p.outfit==='hoodie')ball(avatar,0,1.52,-.13,.24,.21,.18,jacket);
    if(p.accessory==='cap'){ball(avatar,0,1.96,0,.2,.09,.2,jacket);box(avatar,0,1.94,.2,.36,.035,.22,jacket);}
    if(p.accessory==='backpack'){box(avatar,0,1.2,-.24,.4,.52,.2,'#98734c');for(const x of [-.18,.18])box(avatar,x,1.25,.19,.045,.4,.03,'#98734c');}
    if(p.accessory==='scarf'){cylinder(avatar,0,1.5,0,.18,.14,'#b56f4e');box(avatar,.1,1.28,.2,.13,.4,.05,'#b56f4e');}
    if(p.accessory==='glasses'){for(const x of [-.075,.075])box(avatar,x,1.8,.182,.12,.075,.025,'#252d2d');box(avatar,0,1.8,.19,.06,.02,.02,'#252d2d');}
  }
  function furnish(id,index=0){clear(room);roomObstacles=[];doorFrame=[];roomAnimations=[];roomTime=0;roomPets=[];roomHome=null;fridgeDoor=null;orderMeshes.clear();celebration=null;shopSurfaces=[];meals=[];residents=[];biteUntil=0;const tables=[];const category=CITY_ITEMS[id].category,home=cityHomeStyle(state.size,index),accent=category==='homes'?home.accent:CITY_ITEMS[id].color;
    roomHome=category==='homes'?home:null;
    const animate=(group,update)=>{group.traverse(object=>object.userData.animated=true);roomAnimations.push(update);};
    const palette={cafe:'#386e64',bakery:'#c86a88',market:'#508953',school:'#dba638',hospital:'#65a8b9',fire:'#bb473a',cottage:'#b77b4b',townhouse:'#876899',apartments:'#437a96',glass:'#3b8797',skyline:'#675398',office:'#476960'};const color=category==='homes'?home.color:palette[id]||accent;
    const add=(x,z,w,h,d,mat,use=null)=>{roomObstacles.push({x,z,w,d,...(use?{use}:{})});return box(room,x,h/2,z,w,h,d,mat);};
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
    const resident=(x,z,shirt,seated=false,angle=0,activity=null)=>{
      activity??=id==='cafe'?(seated?'drink':'serve'):id==='bakery'?(seated?'eat':'serve'):id==='school'?(seated?'write':'read'):id==='hospital'?'write':id==='market'?'serve':id==='fire'?'read':category==='towers'?'type':'read';
      const g=new T.Group(),body=new T.Group();room.add(g);g.add(body);g.position.set(x,0,z);g.rotation.y=angle;
      const skin=['#c58e68','#754c36','#e5b991'][Math.abs(Math.round(x))%3],hip=seated?.58:.85;
      const firefighter=id==='fire';
      const routine=firefighter?createCityFirefighter(x,z):category==='homes'&&seated&&x<0?createCityRoutine('home',{x,z,angle},home.phase):(id==='cafe'||id==='bakery')&&seated?createCityRoutine(x>0?'laptop':'leave',{x,z,angle},home.phase):null;
      const blocker={x,z,w:.45,d:.45,actor:true};roomObstacles.push(blocker);
      const residentState={x,z,seated,shockUntil:0,routine};residents.push(residentState);g.name='city-resident';g.userData.resident=residentState;
      box(body,0,hip+.3,0,.46,.6,.3,shirt);
      const headGroup=new T.Group();body.add(headGroup);headGroup.position.y=hip+.85;
      ball(headGroup,0,0,0,.18,.23,.18,skin);ball(headGroup,0,.15,0,.19,.11,.19,'#49362d');
      if(firefighter){
        cylinder(headGroup,0,.18,0,.25,.055,'#deb331');ball(headGroup,0,.26,0,.2,.14,.2,'#e8c443');box(headGroup,0,.28,.18,.09,.12,.025,'#fff2aa');
        for(const y of [hip+.12,hip+.45])box(body,0,y,.16,.47,.045,.02,'#eeef99');
        const key='firefighter-invitation';let bubbleMat=materials.get(key);
        if(!bubbleMat){const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#fff8e9';ctx.strokeStyle='#8f6849';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(5,5,502,132,22);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(417,134);ctx.lineTo(435,158);ctx.lineTo(454,134);ctx.fill();ctx.fillStyle='#3c3830';ctx.font='600 34px sans-serif';ctx.textAlign='center';ctx.fillText('Do you want to drive it?',256,83);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;textures.add(map);bubbleMat=new T.SpriteMaterial({map,depthTest:true});materials.set(key,bubbleMat);}
        const invitation=new T.Sprite(bubbleMat);invitation.center.set(.85,.5);invitation.name='firefighter-speech-bubble';invitation.userData.text='Do you want to drive it?';invitation.position.set(0,2.55,0);invitation.scale.set(3.1,.97,1);g.add(invitation);
      }
      const arms=[],eyes=[],legs=[];
      for(const side of [-1,1]){
        const arm=new T.Group(),elbow=new T.Group(),hand=new T.Group();body.add(arm);arm.position.set(side*.3,hip+.53,0);arm.name='city-upper-arm';elbow.name='city-elbow';arm.add(elbow);elbow.position.y=-.28;elbow.add(hand);hand.position.y=-.28;arms.push({arm,elbow,hand,side});
        box(arm,0,-.14,0,.15,.28,.18,shirt);ball(arm,0,-.28,0,.075,.075,.075,skin);box(elbow,0,-.14,0,.12,.28,.14,skin);ball(hand,0,0,0,.07,.08,.07,skin);
        const leg=new T.Group(),knee=new T.Group();body.add(leg);leg.position.set(side*.13,hip,0);leg.add(knee);knee.position.y=-.36;box(leg,0,-.18,0,.17,.36,.18,'#344657');box(knee,0,-.16,0,.16,.32,.18,'#344657');box(knee,0,-.36,.06,.2,.14,.32,'#303638');legs.push({leg,knee});
        eyes.push(ball(headGroup,side*.065,.03,.17,.018,.02,.015,'#252d30'));
      }
      // Aim two bones at a hand target; keep the wrist/cup independent of elbow rotation.
      const aim=(limb,target)=>{
        const origin=limb.arm.position,direction=target.clone().sub(origin),distance=Math.min(.559,Math.max(.03,direction.length()));direction.normalize();
        const bend=new T.Vector3(limb.side*.4,-1,-.1);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
        const elbow=origin.clone().addScaledVector(direction,distance/2).addScaledVector(bend,Math.sqrt(.28*.28-distance*distance/4));
        const down=new T.Vector3(0,-1,0),upper=elbow.clone().sub(origin).normalize(),lower=target.clone().sub(elbow).normalize();
        limb.arm.quaternion.setFromUnitVectors(down,upper);limb.elbow.quaternion.copy(limb.arm.quaternion).invert().multiply(new T.Quaternion().setFromUnitVectors(down,lower));
      };
      const cup=new T.Group();cup.name='city-cup';body.add(cup);cylinder(cup,0,-.08,.09,.09,.16,'#fff2da');cylinder(cup,0,.001,.09,.073,.008,'#67452e');const handle=mesh(cup,geo('cup-handle',()=>new T.TorusGeometry(.055,.015,6,12)),solid('#fff2da'),.1,-.07,.09);handle.rotation.y=Math.PI/2;
      const book=new T.Group();body.add(book);box(book,0,hip+.22,.43,.48,.06,.32,'#c57652');box(book,0,hip+.26,.43,.44,.02,.29,'#fff1cf');
      const laptop=new T.Group();body.add(laptop);box(laptop,0,hip+.35,.65,.65,.045,.45,'#6c7f89');box(laptop,0,hip+.58,.86,.65,.45,.04,'#334855');box(laptop,0,hip+.58,.835,.57,.36,.015,'#85c3d5');
      const snack=new T.Group();arms[1].hand.add(snack);ball(snack,0,0,.05,.09,.055,.09,'#d3a060');
      const tool=new T.Group();arms[1].hand.add(tool);if(['write','paint'].includes(activity))box(tool,0,-.06,.02,.035,.3,.035,activity==='paint'?'#b45e7d':'#dfb33f');
      if(activity==='watch')box(tool,0,-.04,.03,.1,.23,.05,'#343e47');
      if(activity==='water'){cylinder(tool,0,-.05,.1,.16,.22,'#6ca898');box(tool,.2,-.02,.1,.3,.06,.06,'#6ca898');}
      const mouth=ball(headGroup,0,-.09,.19,.045,.065,.02,'#512c2e');mouth.name='city-mouth';
      const bubble=new T.Group(),protest=new T.Group();body.add(bubble,protest);bubble.position.set(0,hip+1.5,0);protest.position.copy(bubble.position);text(bubble,'Oh no! You ate my food!',0,0,0,3.2);text(protest,'Hey, get out of the bed!',0,0,0,3.2);
      const phase=home.phase+x*.9+z*.3;g.userData.phase=phase;
      animate(g,(time,dt)=>{
        const complaining=bedAlert==='owner',shocked=time<residentState.shockUntil;
        if(routine&&!complaining){const taken=Boolean(currentRest&&Math.hypot(currentRest.x-x,currentRest.z-z)<.7);if(firefighter)cityTickFirefighter(routine,dt,roomObstacles,[reactionTarget,...residents.filter(r=>r!==residentState)]);else cityTickRoutine(routine,dt,roomObstacles,[reactionTarget,...residents.filter(r=>r!==residentState),...roomPets],taken);residentState.x=routine.x;residentState.z=routine.z;}
        const stage=routine?.stage,walking=Boolean(routine?.moving),sitting=seated&&(!routine||stage==='seated'||stage==='typing');residentState.seated=sitting||stage==='standing'||stage==='sitting';
        g.visible=stage!=='away';g.position.set(residentState.x,0,residentState.z);blocker.x=g.visible?residentState.x:100;blocker.z=g.visible?residentState.z:100;
        const rise=!seated?0:sitting?0:stage==='standing'?Math.min(1,routine.clock/.8):stage==='sitting'?1-Math.min(1,routine.clock/.8):1;body.position.y=rise*.27;
        const facing=firefighter?(stage==='greeting'?Math.atan2(reactionTarget.x-residentState.x,reactionTarget.z-residentState.z):routine.angle):stage==='fridge'?Math.PI/2:walking?routine.angle:sitting?angle:g.rotation.y;g.rotation.y+=Math.atan2(Math.sin(facing-g.rotation.y),Math.cos(facing-g.rotation.y))*Math.min(1,dt*9);
        let action=firefighter?(stage==='reading-checklist'?'read':'serve'):sitting&&routine?.hasSnack?'eat':stage==='typing'?'type':stage==='fridge'?'serve':stage==='returning'?'eat':activity;
        const pose=cityActivityPose(action,time,phase),sip=citySip(time,phase),canSip=!walking&&(sitting||!routine)&&!complaining&&!shocked;
        for(let i=0;i<2;i++){const limb=arms[i],a=walking?Math.sin(time*7+i*Math.PI)*.4:i?pose.right:pose.left;limb.arm.rotation.set(shocked||complaining?-1.4:a*.45,0,0);limb.elbow.rotation.set(shocked||complaining?-1:a*.55,0,0);const leg=legs[i];leg.leg.rotation.x=sitting?-Math.PI/2:walking?Math.sin(time*7+i*Math.PI)*.4:0;leg.knee.rotation.x=sitting?Math.PI/2:walking?Math.max(0,-Math.sin(time*7+i*Math.PI))*.3:0;}
        cup.visible=action==='drink'&&canSip;book.visible=action==='read'&&!walking&&!complaining&&!shocked;laptop.visible=stage==='typing';snack.visible=(action==='eat'||stage==='fridge')&&!complaining&&!shocked;tool.visible=!walking&&!complaining&&!shocked;
        if(cup.visible){cup.position.set(.2*(1-sip),hip+.52+.24*sip,.4-.195*sip);cup.rotation.x=-.25*sip;const handTarget=new T.Vector3(.14,-.07,.09).applyQuaternion(cup.quaternion).add(cup.position);aim(arms[1],handTarget);}
        if(action==='eat'&&canSip)aim(arms[1],new T.Vector3(.14*(1-sip),hip+.3+.46*sip,.4-.21*sip));
        if(stage==='typing'){aim(arms[0],new T.Vector3(-.16,hip+.4+Math.sin(time*8)*.02,.53));aim(arms[1],new T.Vector3(.16,hip+.4-Math.sin(time*8)*.02,.53));}
        if(firefighter&&stage?.startsWith('checking-')){aim(arms[0],new T.Vector3(-.17,hip+.4+Math.sin(time*3)*.06,.4));aim(arms[1],new T.Vector3(.17,hip+.35+Math.cos(time*3)*.06,.43));}
        if(stage==='fridge')aim(arms[1],new T.Vector3(.1,hip+.4,.5));
        headGroup.rotation.x=complaining||shocked||cup.visible?0:pose.head;headGroup.rotation.y=complaining||shocked?Math.atan2(reactionTarget.x-residentState.x,reactionTarget.z-residentState.z)-g.rotation.y:0;
        for(const eye of eyes)eye.scale.set(shocked?.03:.018,shocked?.045:.02,.015);mouth.visible=shocked||complaining||(cup.visible&&sip>.8);mouth.scale.set(.045,complaining?.04+Math.sin(time*12)*.02:shocked?.065:.018,.02);
        bubble.visible=shocked&&!complaining;protest.visible=complaining;for(const label of [bubble,protest])label.quaternion.copy(g.quaternion).invert().multiply(camera.quaternion);
        g.rotation.z=walking||shocked||complaining?0:pose.lean;
      });
    };
    const pet=kind=>{
      const g=new T.Group();room.add(g);const cat=kind==='cat',style=home[kind],fur=style.fur,legs=[];g.scale.set(style.size,style.size*style.legs,style.size);
      ball(g,0,.43,0,cat?.19:.25,.22,cat?.4:.46,fur);ball(g,0,.64,.34,.2,.21,.2,fur);
      ball(g,0,.58,.51,.12,.09,.1,style.pattern==='points'?style.mark:cat?'#ead5bb':'#684d37');
      for(const side of [-1,1]){
        const ear=box(g,side*.14,style.ears==='pointed'?.85:.62,.33,.12,style.ears==='pointed'?.19:.35,.12,style.pattern==='points'?style.mark:fur);ear.rotation.z=side*(cat?.3:.15);
        ball(g,side*.08,.69,.51,.025,.03,.02,'#2b3738');
        for(const z of [-.25,.25]){const leg=new T.Group();g.add(leg);leg.position.set(side*.14,.38,z);box(leg,0,-.15,0,.1,.3,.12,fur);legs.push(leg);}
      }
      if(style.pattern==='spots')for(let i=0;i<10;i++)ball(g,Math.sin(i*2.4)*.23,.48+Math.cos(i)*.12,(i%5-2)*.12,.065,.045,.07,style.mark);
      if(style.pattern==='stripes')for(const z of [-.22,-.05,.12]){box(g,0,.645,z,.27,.035,.055,style.mark);for(const side of [-1,1])box(g,side*.18,.5,z,.025,.2,.055,style.mark);}
      if(style.pattern==='chest')ball(g,0,.48,.31,.16,.2,.12,style.mark);
      if(style.pattern==='points')for(const side of [-1,1])for(const z of [-.25,.25])box(g,side*.14,.075,z,.11,.13,.13,style.mark);
      const tail=new T.Group();g.add(tail);tail.position.set(0,.48,-.36);const tuft=box(tail,0,.2,-.12,.09,cat?.5:.3,.09,fur);tuft.rotation.x=-.5;
      g.name='city-pet';const roamer=createCityRoamer(home.phase);g.userData.roamer=roamer;roomPets.push(roamer);const mouth=ball(g,0,.52,.58,.07,.04,.025,'#51332c');
      const label=new T.Group();g.add(label);label.position.set(0,1.25,0);text(label,cat?'Meow!':'Woof!',0,0,0,1.4);
      animate(g,(time,dt)=>{
        const alert=bedAlert===kind;if(!alert)cityRoam(roamer,dt,roomObstacles,[reactionTarget,...residents]);
        g.position.set(roamer.x,0,roamer.z);const facing=alert?Math.atan2(reactionTarget.x-roamer.x,reactionTarget.z-roamer.z):roamer.angle;g.rotation.y+=Math.atan2(Math.sin(facing-g.rotation.y),Math.cos(facing-g.rotation.y))*Math.min(1,dt*8);
        legs.forEach((leg,i)=>leg.rotation.x=!alert&&roamer.moving?Math.sin(time*9)*.32*(i%3===0?1:-1):0);tail.rotation.z=Math.sin(time*5)*.25;
        mouth.visible=alert;mouth.scale.y=.035+Math.max(0,Math.sin(time*12))*.035;label.visible=alert;label.quaternion.copy(g.quaternion).invert().multiply(camera.quaternion);
      });
    };
    const art=(x,z,label,tint)=>{box(room,x,2.05,z,1.65,1.3,.12,wood);box(room,x,2.05,z+.08,1.45,1.1,.03,tint);text(room,label,x,2.05,z+.12,1.3);};

    for(const x of [-4,4]){box(room,x,2.3,-5.9,2.7,1.7,.06,material('window',{color:'#b0d2dd',emissive:'#89a8b2',emissiveIntensity:.3,roughness:.18}));for(const dx of [-1.4,0,1.4])box(room,x+dx,2.3,-5.8,.06,1.8,.06,'#faf6e8');}
    text(room,CITY_ITEMS[id].name,0,3.2,-5.85,3.7);
    const chair=(x,z)=>{
      const table=tables.find(t=>Math.hypot(t.x-x,t.z-z)<1.4),angle=table?Math.atan2(table.x-x,table.z-z):0;
      roomObstacles.push({x,z,w:.65,d:.65,use:{pose:'sit',x,z,angle,height:.53,...(category==='towers'&&table?{computer:{x:table.x,z:table.z}}:{})}});
      const g=new T.Group();room.add(g);g.position.set(x,0,z);g.rotation.y=angle;
      box(g,0,.48,0,.65,.1,.65,wood);box(g,0,.92,-.28,.65,.85,.12,wood);for(const xx of [-.23,.23])for(const zz of [-.23,.23])box(g,xx,.22,zz,.06,.44,.06,wood);
    };
    const table=(x,z)=>{shopSurfaces.push({id:'table-'+tables.length,x,z,w:1.5,d:1.2,y:.94});tables.push({x,z});roomObstacles.push({x,z,w:1.5,d:1.2});box(room,x,.89,z,1.5,.09,1.2,wood);for(const xx of [-.58,.58])for(const zz of [-.43,.43])box(room,x+xx,.43,z+zz,.08,.86,.08,'#4c514c');};
    const shelf=(x,z,food=false)=>{add(x,z,2.7,1.9,.7,wood);for(let level=0;level<3;level++)for(let i=0;i<6;i++)box(room,x-1.1+i*.43,.3+level*.55,z+.4,.25,.3,.25,food?['#a75e42','#d4b969','#788d56'][i%3]:['#637a82','#b59b7d','#8f6857'][i%3]);};
    if(id==='cafe'||id==='bakery'){
      add(-3,-3.5,5,1.1,1.3,wood);box(room,-3,1.14,-3.5,5.1,.1,1.4,'#c6c2b3');box(room,-4,1.5,-3.5,.9,.65,.55,'#4a5554');cylinder(room,-3,1.3,-3,.16,.22,'#f5f0de');
      for(const x of [-3,2])for(const z of [0,3]){table(x,z);chair(x-.1,z-1);chair(x+.1,z+1);cylinder(room,x,.99,z,.1,.15,'#eee6cf');}
      text(room,id==='cafe'?'Coffee · Tea · Cake':'Bread · Pastries',-3,2.3,-5.8,3.5);
      if(id==='bakery')for(let i=0;i<6;i++)ball(room,-5+i*.36,1.3,-3.7,.2,.12,.12,'#b8894b');
    }else if(category==='homes'){
      add(-3,0,3.3,.65,1.2,color,{pose:'sit',x:-2.1,z:0,angle:0,height:.7});box(room,-3,1, -.45,3.3,.75,.3,color);table(-3,2);add(3,-3,2.5,.5,3.4,wood,{pose:'lie',x:3,z:-2,angle:0,height:.85});box(room,3,.65,-3,2.4,.25,3.3,'#ded8c7');box(room,3,.85,-4,2.1,.18,.65,'#f4f0e7');shelf(-4,-4.8);
    }else if(id==='market'){
      for(const x of [-4,0,4])for(const z of [-3,1])shelf(x,z,true);add(-4,4,3,1,1,wood);box(room,-4,1.25,4,.5,.4,.4,'#444e4e');
    }else if(id==='school'){
      box(room,0,2,-5.82,5,1.5,.1,'#325f54');text(room,'Learn · Imagine · Create',0,2,-5.7,4);
      for(const x of [-4,0,4])for(const z of [-2,1,4]){if(x===0&&z===4)continue;table(x,z);chair(x,z+1);}shelf(-5,-4.9);
    }else if(id==='hospital'){
      for(const x of [-4,3])for(const z of [-2,2]){add(x,z,1.8,.55,2.5,'#dfe3dc',{pose:'lie',x,z:z+.8,angle:0,height:.95});box(room,x,.8,z,1.75,.25,2.4,color);box(room,x,1,z-.8,1.5,.2,.5,'#f2f1e8');cylinder(room,x+1.1,1.1,z,.035,2.2,'#a7aeab');}
      text(room,'Care & kindness',0,2,-5.7,3);
    }else if(id==='fire'){
      roomObstacles.push({x:-2,z:-1,w:2.8,d:5.6});const engine=fireGraphics.truck(room);engine.group.position.set(-2,0,-1);roomAnimations.push(t=>{for(const [i,lamp] of engine.lights.entries())lamp.visible=Math.sin(t*7+i*Math.PI)>.1;});shelf(4,-4);text(room,'Ready to help',0,2.3,-5.7,3);
    }else{
      for(const x of [-4,0,4])for(const z of [-2,2]){table(x,z);chair(x,z+1);box(room,x,1.2,z,.75,.5,.08,'#3d5157');}shelf(-4,-4.8);
    }
    // Purpose-specific details keep each visit recognizable from the doorway.
    if(id==='cafe'||id==='bakery'){
      resident(-3,-4.6,id==='cafe'?'#2d6857':'#faf0df');resident(2,-1,'#d38a36',true);resident(-3,2,'#7a67ad',true);
      art(3,-5.78,id==='cafe'?'Fresh coffee':'Baked daily',color);
      for(const x of [-3,2])for(const z of [0,3]){cylinder(room,x+.35,.96,z,.22,.025,'#fff2dc');const food=ball(room,x+.35,1.03,z,.15,.07,.12,'#bf813d');food.userData.animated=true;meals.push({x,z,food,eaten:false});}
      if(id==='cafe'){for(const x of [-5,-4.5]){cylinder(room,x,1.32,-3.5,.13,.35,'#684332');}box(room,-4,1.55,-3.17,.7,.25,.05,'#bac5c1');}
      else {shelf(4,-4.6,true);box(room,-3,1.5,-3.5,1.2,.6,.75,material('pastry-glass',{color:'#c5ebee',transparent:true,opacity:.25,roughness:.1,depthWrite:false}));}
    }else if(category==='homes'){
      box(room,-3,.015,1,4.7,.025,4,color);for(const x of [-4,-2])box(room,x,.85,0,.6,.38,.65,accent);
      const labels={cinema:'Movie night',cat:'A cat lives here',dog:'Best friends',artist:'Creative corner',reader:'One more chapter',gardener:'Plant lover'};
      art(0,-5.78,home.theme==='dog'?home.dog.name:home.theme==='cat'?home.cat.name:labels[home.theme],color);text(room,'Home '+home.address,-4,3.45,-5.8,2.1);
      add(5,-1,1.3,1.9,.7,'#dae2da');box(room,5,1,-.63,1.1,1.65,.04,'#586b66');
      fridgeDoor=new T.Group();room.add(fridgeDoor);fridgeDoor.position.set(4.35,0,-.57);box(fridgeDoor,.65,.95,0,1.3,1.9,.08,'#e8e4d9');box(fridgeDoor,1.1,1,.06,.06,.5,.05,'#616d72');animate(fridgeDoor,()=>{fridgeDoor.rotation.y=residents.some(r=>r.routine?.stage==='fridge')?-1.15:0;});
      if(home.theme==='cinema'){
        add(-3,4.5,3,.65,.6,wood);box(room,-3,1.5,4.45,2.6,1.4,.12,'#283743');box(room,-3,1.5,4.37,2.35,1.15,.025,'#679eb0');
        for(let i=0;i<4;i++)box(room,-3.8+i*.5,1.3,4.34,.3,.3+i*.16,.02,['#e9bd6d','#8db7a0'][i%2]);
        cylinder(room,-3,.99,2,.24,.22,'#e9ba59');for(let i=0;i<6;i++)ball(room,-3+Math.sin(i)*.15,1.15,2+Math.cos(i)*.15,.08,.07,.08,'#fff0b3');resident(-3,0,'#c58b54',true,0,'watch');
      }else if(home.theme==='cat'){
        add(4,2.6,1.5,.18,1.5,color);cylinder(room,4,1,2.6,.14,1.8,'#c7a57c');box(room,4,1.5,2.6,1.2,.14,1,color);box(room,4.4,2.1,2.6,.85,.14,.85,color);box(room,3.5,.6,2.6,.9,.7,.8,wood);
        cylinder(room,4.5,.12,4,.25,.16,'#bd79a4');cylinder(room,4.5,.21,4,.19,.02,'#7cabb8');pet('cat');resident(-3,0,'#9c71ab',true,0,'read');
      }else if(home.theme==='dog'){
        add(4,2.5,2,.18,1.5,color);box(room,4,.25,2.5,1.7,.18,1.2,'#e5c9a1');for(const x of [3,5])box(room,x,.35,2.5,.2,.5,1.5,color);
        ball(room,3.3,.14,4,.15,.15,.15,'#d8794d');cylinder(room,5,.12,4,.28,.18,'#639baa');box(room,4,.1,4,.4,.12,.12,'#f0d8b4');pet('dog');resident(-3,0,'#b18052',true,0,'read');
      }else if(home.theme==='artist'){
        add(4,2.8,1.8,.12,1.3,wood);for(const x of [3.4,4.6])box(room,x,1,2.8,.08,1.9,.1,wood);box(room,4,1.65,2.8,1.5,1.5,.12,'#f5e4c7');
        const painting=texture('painting:'+home.painting,c=>{
          const circle=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
          c.fillStyle=home.painting==='sunset'?'#f2a97d':home.painting==='flowers'?'#f1dfc4':'#acd4e3';c.fillRect(0,0,256,256);
          if(home.painting==='sunset'){circle(128,112,48,'#ffe6a1');c.fillStyle='#9a789f';c.fillRect(0,164,256,92);for(let i=0;i<9;i++){c.fillStyle=i%2?'#d5a2b2':'#edd1a3';c.fillRect(80+i*4,177+i*7,96-i*8,3);}}
          if(home.painting==='mountains'){circle(202,48,23,'#fff2b7');for(const [x,y,color] of [[-35,170,'#6d8a9a'],[70,205,'#4e7185']]){c.fillStyle=color;c.beginPath();c.moveTo(x,256);c.lineTo(x+100,55);c.lineTo(x+220,256);c.fill();c.fillStyle='#f5f0dc';c.beginPath();c.moveTo(x+73,110);c.lineTo(x+100,55);c.lineTo(x+132,110);c.fill();}}
          if(home.painting==='flowers'){c.fillStyle='#5a8a69';for(let i=0;i<5;i++)c.fillRect(70+i*28,70+(i%2)*30,4,135);for(let i=0;i<5;i++){const x=72+i*28,y=70+(i%2)*30;for(let a=0;a<6;a++)circle(x+Math.sin(a)*12,y+Math.cos(a)*12,10,['#d57694','#d9904f','#a475b7'][i%3]);circle(x,y,6,'#ffe39e');}c.fillStyle='#6c99ad';c.fillRect(65,175,128,65);}
          if(home.painting==='ocean'){c.fillStyle='#478cad';c.fillRect(0,105,256,151);for(let i=0;i<8;i++){c.strokeStyle=i%2?'#b6e3e0':'#70b6cd';c.beginPath();c.moveTo(0,120+i*18);c.bezierCurveTo(70,95+i*18,150,145+i*18,256,118+i*18);c.stroke();}c.fillStyle='#fff4dc';c.beginPath();c.moveTo(160,45);c.lineTo(160,155);c.lineTo(90,150);c.fill();c.fillStyle='#77534b';c.fillRect(85,160,90,12);}
        });box(room,4,1.65,2.875,1.35,1.35,.025,painting);resident(4,4.1,'#d78960',false,Math.PI,'paint');
      }else if(home.theme==='reader'){
        shelf(4,2.5);chair(3.5,4);resident(3.5,4,'#8278ae',true,0,'read');cylinder(room,5.5,1,3.5,.035,2,'#555d59');cylinder(room,5.5,2,3.5,.4,.4,'#eeddb5');
      }else{
        add(4,2.7,2.5,.7,1,wood);for(const x of [3.2,4,4.8]){cylinder(room,x,.88,2.7,.2,.3,'#bd7c53');for(let i=0;i<4;i++)ball(room,x+Math.sin(i)*.13,1.12+i*.09,2.7,.15,.25,.12,'#668c4e');}resident(4,4,'#6e9963',false,Math.PI,'water');
      }
    }else if(id==='market'){
      resident(-4,3,'#4d8f55',false,0);text(room,'Produce · Pantry · Fresh food',0,2.5,-5.75,5);
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
    if(CITY_SHOPS[id]){
      const shop=CITY_SHOPS[id];shopSurfaces.push({...shop.counter});
      if(id!=='market'){box(room,shop.register.x,1.35,shop.register.z,.5,.3,.4,'#354e52');box(room,shop.register.x,1.62,shop.register.z,.45,.25,.06,'#91c7bf');}
      else {table(3,4);text(room,'Packing table',3,1.15,4.5,1.4);}
      text(room,'Order here',shop.register.x,2,shop.register.z+.1,1.6);
      for(const surface of shopSurfaces)surface.occupied=meals.filter(m=>Math.abs(m.x-surface.x)<surface.w/2&&Math.abs(m.z-surface.z)<surface.d/2).map(m=>({x:m.x+.35,z:m.z}));
    }
    for(const item of roomObstacles){if(!item.use)continue;
      item.use.occupied=residents.some(r=>r.seated&&Math.hypot(r.x-item.use.x,r.z-item.use.z)<.6);
      const mealId=meals.findIndex(m=>Math.hypot(m.x-item.use.x,m.z-item.use.z)<1.5);if(mealId>=0)item.use.mealId=mealId;
    }
    for(const meal of meals)meal.owner=residents.find(r=>r.seated&&Math.hypot(r.x-meal.x,r.z-meal.z)<1.4);
    batch(room);return roomObstacles;
  }
  function orderModel(kind){
    const food=CITY_FOOD[kind],g=new T.Group();room.add(g);
    const bread=solid('#e6bd7c'),green=solid('#71a35c'),red=solid('#bd5143');
    // Food uses smooth silhouettes, glossy glazes, and real glass instead of building primitives.
    const glass=material('food-glass',{color:'#e2f4ff',roughness:.08,metalness:.12,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide});
    const smooth=(x,y,z,rx,ry,rz,color)=>{const m=mesh(g,geo('food-sphere',()=>new T.SphereGeometry(1,32,20)),typeof color==='string'?solid(color,.32):color,x,y,z);m.scale.set(rx,ry,rz);return m;};
    function lathe(key,profile,mat){return mesh(g,geo('food-lathe-'+key,()=>new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),48)),typeof mat==='string'?solid(mat,.3):mat);}
    function ring(x,y,z,r,t,color){const m=mesh(g,geo(`food-ring-${r}-${t}`,()=>new T.TorusGeometry(r,t,10,48)),typeof color==='string'?solid(color,.28):color,x,y,z);m.rotation.x=Math.PI/2;return m;}
    function cream(y,r=.2,height=.2){const m=mesh(g,geo(`cream-${r}-${height}`,()=>{const points=[];for(let i=0;i<=120;i++){const t=i/120,a=t*Math.PI*7;points.push(new T.Vector3(Math.cos(a)*r*(1-t),height*t,Math.sin(a)*r*(1-t)));}return new T.TubeGeometry(new T.CatmullRomCurve3(points),120,.035,8,false);}),solid('#fff7e6',.36),0,y,0);return m;}
    function star(x,y,z,size,color){const shape=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.45:1;const px=Math.sin(a)*r,py=Math.cos(a)*r;i?shape.lineTo(px,py):shape.moveTo(px,py);}shape.closePath();const m=mesh(g,geo('food-candy-star',()=>new T.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.08,bevelThickness:.08})),solid(color,.25),x,y,z);m.scale.setScalar(size);return m;}
    const baked=texture('food-baked',ctx=>{ctx.fillStyle='#d89b51';ctx.fillRect(0,0,256,256);for(let i=0;i<2400;i++){ctx.fillStyle=i%3?'#edbe75':'#ae703c';ctx.globalAlpha=.3;ctx.fillRect((i*73)%256,(i*127)%256,2,2);}ctx.globalAlpha=1;});

    if(food.shape==='cake'){
      const rainbow=['#fc3588','#ff982b','#ffe52c','#32d05b','#28cfe7','#9550dc'];
      lathe('cake-board',[[0,0],[.47,0],[.47,.045],[0,.045]],'#e82fbc');lathe('cake-body',[[0,.045],[.37,.045],[.385,.07],[.385,.73],[.37,.765],[0,.765]],'#fff0c9');
      // Rainbow ganache sectors and rounded drips around the vanilla sides.
      for(let c=0;c<6;c++){
        mesh(g,geo('cake-icing-'+c,()=>new T.CylinderGeometry(.385,.385,.025,12,1,false,c*Math.PI/3,Math.PI/3)),solid(rainbow[c]),0,.77,0);
        for(let j=0;j<2;j++){const a=c*Math.PI/3+j*.36+.12,h=.16+((c*3+j*5)%7)*.055,x=Math.sin(a)*.378,z=Math.cos(a)*.378;cylinder(g,x,.76-h/2,z,.025,h,rainbow[c]);ball(g,x,.76-h,z,.025,.03,.025,rainbow[c]);}
      }
      function rosette(x,y,z,angle,top=false,scale=1){
        const rose=new T.Group();g.add(rose);rose.position.set(x,y,z);if(top)rose.rotation.x=-Math.PI/2;else rose.rotation.y=angle;rose.scale.setScalar(scale);
        for(let c=0;c<6;c++){
          const geometry=geo('cake-rosette-'+c,()=>{const points=[];for(let j=0;j<=32;j++){const t=(c+j/32)/6,a=t*Math.PI*4.7,r=.012+t*.088;points.push(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,.035+Math.sin(t*Math.PI)*.035+Math.sin(a*6)*.008));}return new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.022,8,false);});
          mesh(rose,geometry,solid(rainbow[c]),0,0,0);
        }
      }
      // A cascading bank of piped rainbow roses, like the reference cake.
      for(let row=0;row<3;row++)for(let col=0;col<6;col++){const a=-.45+col*.4+row*.12;rosette(Math.sin(a)*.386,.17+row*.205,Math.cos(a)*.386,a,false,.85+(col%2)*.15);}
      for(let i=0;i<7;i++){const a=i*.48-.6;rosette(Math.sin(a)*.27,.79,Math.cos(a)*.27,0,true,.95);}
      for(let i=0;i<65;i++){const a=i*2.399,r=Math.sqrt((i+.5)/65)*.35;ball(g,Math.sin(a)*r,.795,Math.cos(a)*r,.009,.008,.012,rainbow[i%6]);}
    }else if(food.shape==='galaxy'){
      const galaxy=texture('food-galaxy',ctx=>{const image=ctx.createImageData(256,256);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const wave=(Math.sin(y*.063+x*.026+Math.sin(x*.03)*1.6)+1)/2,cloud=(Math.sin(x*.09-y*.035)+1)/2,i=(y*256+x)*4;image.data[i]=35+wave*145;image.data[i+1]=18+cloud*65+wave*28;image.data[i+2]=110+wave*120;image.data[i+3]=255;}ctx.putImageData(image,0,0);for(let i=0;i<170;i++){const x=(i*73)%256,y=(i*131)%256;ctx.fillStyle=i%3?'#d6ebff':'#ffffff';ctx.fillRect(x,y,i%7?1:2,i%7?1:2);}});
      lathe('shake-fill',[[0,.13],[.1,.14],[.16,.24],[.21,.55],[.235,.78],[0,.78]],galaxy);
      lathe('shake-glass',[[0,.02],[.19,.02],[.2,.045],[.08,.07],[.075,.13],[.12,.17],[.18,.32],[.225,.62],[.25,.8]],glass);ring(0,.8,0,.25,.012,glass);
      cream(.81,.22,.18);smooth(0,1.1,0,.135,.135,.135,galaxy);const saturn=ring(0,1.1,0,.19,.018,'#f653c3');saturn.rotation.z=.22;
      const straw=new T.Group();g.add(straw);straw.position.set(-.15,.75,0);straw.rotation.z=.22;for(let i=0;i<10;i++)cylinder(straw,0,i*.045,0,.018,.045,i%2?'#65e1e7':'#be57db');
      for(let i=0;i<20;i++){const a=i*2.4,r=.16;star(Math.sin(a)*r,.86+(i%3)*.025,Math.cos(a)*r,.018,['#f6d774','#f48cc7','#8ccfe7'][i%3]).rotation.y=a;}star(.21,1.13,0,.06,'#ffd260');
    }else if(food.shape==='fruit-cup'){
      lathe('parfait-glass',[[0,.02],[.22,.02],[.235,.04],[.235,.91]],glass);ring(0,.91,0,.235,.009,glass);
      lathe('parfait-yogurt',[[0,.12],[.215,.12],[.215,.31],[0,.31]],'#fff1db');
      for(let i=0;i<45;i++){const a=i*2.4,r=.19*Math.sqrt((i+.5)/45);smooth(Math.sin(a)*r,.065+(i%3)*.023,Math.cos(a)*r,.025,.018,.022,['#b77a38','#dcaf68','#e3c690'][i%3]);}
      for(let i=0;i<20;i++){const a=i*2.4,r=.17;const x=Math.sin(a)*r,z=Math.cos(a)*r;smooth(x,.34+(i%2)*.065,z,.05,.045,.05,i%3?'#354e86':'#584264');ring(x,.38+(i%2)*.065,z,.014,.004,'#8294b5');}
      for(let i=0;i<9;i++){const a=i*2.4,x=Math.sin(a)*.15,z=Math.cos(a)*.15;const kiwi=smooth(x,.49,z,.075,.023,.065,'#9fc94b');for(let j=0;j<8;j++)smooth(x+Math.sin(j*.785)*.045,.515,z+Math.cos(j*.785)*.035,.003,.003,.004,'#384527');smooth(x,.52,z,.018,.004,.018,'#e4edac');}
      for(let i=0;i<9;i++){const a=i*2.4;smooth(Math.sin(a)*.14,.59+(i%2)*.025,Math.cos(a)*.14,.06,.045,.055,'#ffd45e');smooth(Math.sin(a)*.14,.7+(i%2)*.03,Math.cos(a)*.14,.08,.035,.045,'#ff9f32');}
      for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.sin(a)*.13,z=Math.cos(a)*.13;smooth(x,.84,z,.07,.085,.065,'#e63543');for(let j=0;j<7;j++)smooth(x+Math.sin(j*2.4)*.05,.82+(j%3)*.025,z+Math.cos(j*2.4)*.055,.004,.007,.003,'#ffe494');}
      cream(.91,.12,.09);for(let i=0;i<12;i++){const a=i*2.4;smooth(Math.sin(a)*.1,1.01,Math.cos(a)*.1,.025,.016,.02,'#d5aa65');}for(let i=0;i<3;i++){const leaf=smooth(.04+i*.035,1.045+i*.02,0,.035,.08,.012,'#4f923b');leaf.rotation.z=i*.55-.5;}
    }else if(food.shape==='loaf'){
      smooth(0,.14,0,.32,.16,.19,baked);for(let i=0;i<4;i++){const score=smooth((i-1.5)*.12,.275,0,.018,.012,.12,'#fff0bf');score.rotation.y=-.3;}
    }else if(food.shape==='croissant'){
      for(let i=0;i<9;i++){const a=(i/8-.5)*Math.PI*1.3,r=.23,size=.035+Math.sin(i/8*Math.PI)*.085;const roll=smooth(Math.sin(a)*r,.1,Math.cos(a)*r-.1,size,.08,size*.85,baked);roll.rotation.y=a;}
    }else if(food.shape==='sandwich'){
      for(const y of [.055,.24])smooth(0,y,0,.27,.055,.21,baked);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;smooth(Math.sin(a)*.19,.12,Math.cos(a)*.15,.1,.025,.07,'#70b345');}
      for(const x of [-.1,.1]){cylinder(g,x,.16,0,.115,.03,'#e45a42');cylinder(g,x,.18,0,.085,.008,'#f29b6e');}smooth(0,.2,0,.25,.015,.18,'#f3cf69');
    }else if(food.shape==='pizza'){
      cylinder(g,0,.05,0,.31,.055,baked);ring(0,.08,0,.29,.035,baked);cylinder(g,0,.085,0,.275,.025,'#c64e32');cylinder(g,0,.1,0,.26,.018,'#f4c864');
      for(let i=0;i<7;i++){const a=i*2.4,x=Math.sin(a)*.18,z=Math.cos(a)*.18;cylinder(g,x,.115,z,.045,.012,'#ac3c2c');for(let j=0;j<3;j++)smooth(x+(j-1)*.017,.124,z,.005,.004,.006,'#efb08a');}for(let i=0;i<6;i++){const a=i*1.1;smooth(Math.sin(a)*.2,.13,Math.cos(a)*.2,.035,.008,.018,'#65a94c');}
    }else if(food.shape==='shake'){
      lathe('regular-shake',[[0,.06],[.1,.06],[.16,.48],[0,.48]],food.color);lathe('regular-glass',[[0,.02],[.14,.02],[.11,.06],[.17,.5]],glass);ring(0,.5,0,.17,.01,glass);cream(.51,.14,.16);smooth(0,.7,0,.035,.035,.035,'#e84d5e');for(let i=0;i<8;i++)cylinder(g,.08,.5+i*.035,0,.012,.035,i%2?'#fff4e4':'#ee7cac');
    }else if(food.shape==='cupcake'){
      lathe('cupcake-liner',[[0,0],[.12,0],[.18,.22],[0,.22]],'#eab3cf');for(let i=0;i<20;i++){const a=i*Math.PI/10;const pleat=cylinder(g,Math.sin(a)*.15,.11,Math.cos(a)*.15,.009,.2,'#cc8eaf');pleat.rotation.z=-Math.sin(a)*.25;pleat.rotation.x=Math.cos(a)*.25;}smooth(0,.23,0,.18,.08,.18,baked);cream(.28,.16,.22);smooth(0,.52,0,.035,.035,.035,'#d84e65');
    }else if(food.shape==='cookie'){
      smooth(0,.05,0,.24,.055,.23,baked);for(let i=0;i<12;i++){const a=i*2.4,r=.05+(i%3)*.065;smooth(Math.sin(a)*r,.097,Math.cos(a)*r,.025,.012,.022,'#593524');}
    }else if(food.shape==='doughnut'){
      ring(0,.085,0,.17,.075,baked);const glaze=mesh(g,geo('donut-glaze',()=>new T.TorusGeometry(.17,.077,16,48,Math.PI*2)),solid(food.color,.24),0,.105,0);glaze.rotation.x=Math.PI/2;glaze.scale.z=.65;for(let i=0;i<30;i++){const a=i*2.4,r=.14+(i%3)*.025;const sprinkle=smooth(Math.sin(a)*r,.16,Math.cos(a)*r,.012,.005,.004,['#fff0b5','#66cfca','#c46bdd'][i%3]);sprinkle.rotation.y=a;}
    }else if(food.shape==='apple'){
      smooth(-.055,.19,0,.15,.18,.18,'#dd4d38');smooth(.055,.19,0,.15,.18,.18,'#dc4638');cylinder(g,0,.38,0,.018,.12,'#755333');const leaf=smooth(.075,.41,0,.08,.015,.035,'#5f9d42');leaf.rotation.z=.3;
    }else if(food.shape==='cheese'){
      const shape=new T.Shape();shape.moveTo(-.2,-.16);shape.lineTo(.22,0);shape.lineTo(-.2,.16);shape.closePath();const wedge=mesh(g,geo('cheese-wedge',()=>new T.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:3,steps:1})),solid('#f3c653',.4));wedge.rotation.x=-Math.PI/2;for(let i=0;i<5;i++)smooth(-.12+(i%2)*.08,.215,(i-2)*.045,.018,.003,.014,'#d49b35');
    }else if(food.shape==='carrot'){
      const carrot=mesh(g,geo('carrot',()=>new T.ConeGeometry(.1,.48,24)),solid(food.color,.4),0,.25,0);carrot.rotation.z=Math.PI;for(let i=0;i<5;i++){const leaf=smooth((i-2)*.025,.56,0,.018,.1,.025,'#51943f');leaf.rotation.z=(i-2)*.3;}
    }else if(kind==='milk'){
      lathe('milk-bottle',[[0,0],[.12,0],[.13,.025],[.13,.32],[.075,.4],[.065,.51],[0,.51]],'#fff7e7');cylinder(g,0,.52,0,.075,.04,'#73b9d5');ring(0,.22,0,.132,.02,'#8ac6de');
    }else if(kind==='cereal'){
      lathe('cereal-bowl',[[0,0],[.12,0],[.23,.13],[.24,.17],[.22,.18],[.19,.13],[0,.06]],'#87c9c4');cylinder(g,0,.13,0,.19,.02,'#fff5dc');for(let i=0;i<24;i++){const a=i*2.4,r=Math.sqrt((i+.5)/24)*.16;ring(Math.sin(a)*r,.16,Math.cos(a)*r,.018,.008,i%2?'#d8a353':'#b97d3c');}
    }
    if(food.upgrade){g.userData.sparkles=[];for(let i=0;i<6;i++){const star=mesh(g,geo('food-star',()=>new T.OctahedronGeometry(.035)),solid(['#f5d579','#edb9e6','#b4e5ec'][i%3]),0,0,0);g.userData.sparkles.push(star);}}
    const target=box(g,0,.3,0,.65,.65,.65,'#ffffff');target.visible=false;target.castShadow=false;
    g.traverse(object=>object.userData.orderId=-1);return g;
  }
  function syncOrders(shop,player){
    const live=new Set(shop?.items.map(item=>item.id)??[]);
    for(const [id,g] of orderMeshes)if(!live.has(id)){g.removeFromParent();orderMeshes.delete(id);}
    for(const item of shop?.items??[]){let g=orderMeshes.get(item.id);if(!g){g=orderModel(item.kind);g.traverse(object=>object.userData.orderId=item.id);orderMeshes.set(item.id,g);}
      for(const [i,star] of (g.userData.sparkles??[]).entries()){const a=roomTime+i*Math.PI/3;star.position.set(Math.sin(a)*.4,.5+Math.cos(a*2)*.16,Math.cos(a)*.4);star.rotation.y=a;}g.userData.carried=item.carried;if(item.carried){g.position.set(player.x+Math.sin(player.angle||0)*.45,1.15,player.z+Math.cos(player.angle||0)*.45);g.rotation.y=player.angle||0;}
      else {g.position.set(item.x,item.y,item.z);g.rotation.y=0;}
    }
  }
  function eat(mealId){
    const meal=meals[mealId];if(!meal||meal.eaten)return false;
    meal.eaten=true;meal.food.visible=false;showBite('bread');biteUntil=roomTime+1.5;
    if(meal.owner)meal.owner.shockUntil=roomTime+4;
    return true;
  }
  function render({mode,player,hover,time,moving,interior,resting=null,shop=null,powers={},fire=null,computer=null,dt}){
    if(celebration){const age=roomTime-celebration.userData.start;if(age>=3.2){celebration.removeFromParent();celebration=null;}else for(const [i,p] of celebration.children.entries()){const t=Math.max(0,age-(i%3)*.22),a=i*2.399;const radius=t*(.65+(i%5)*.15);p.visible=age>=(i%3)*.22;p.position.set(Math.sin(a+t*.6)*radius,1+t*(1.8+(i%4)*.22)-t*t*.8,Math.cos(a+t*.6)*radius);p.rotation.set(t*3+i,t*2,t);p.scale.setScalar(Math.max(0,1-t/3.2));}}
    magic?.render({player,powers,moving,interior,mode:fire?'fire':mode,dt});
    const inside=Boolean(interior);currentRest=resting;bedAlert=inside?cityBedReaction(roomHome?.theme,resting):null;syncOrders(inside?shop:null,player);if(inside){reactionTarget=player;roomTime+=dt;for(const update of roomAnimations)update(roomTime,dt);for(const item of roomObstacles)if(item.use)item.use.occupied=residents.some(r=>r.seated&&Math.hypot(r.x-item.use.x,r.z-item.use.z)<.6);}world.visible=!inside;room.visible=inside;avatar.visible=mode==='walk';grid.visible=mode==='build';
    if(selection){selection.visible=!inside&&mode==='build'&&hover&&hover.x>=0&&hover.y>=0&&hover.x<state.size&&hover.y<state.size;if(selection.visible)selection.position.set(hover.x*5+2.5,.07,hover.y*5+2.5);}
    if(avatar.visible){
      const seated=resting?.pose==='sit',lying=resting?.pose==='lie',eating=inside&&roomTime<biteUntil;
      avatar.position.set(player.x,lying?resting.height:seated?resting.height-.77:.07+(player.altitude||0),player.z);avatar.rotation.set(0,player.angle||0,0);if(lying)avatar.rotation.x=-Math.PI/2;
      const swing=moving?Math.sin(time*9)*.5:0;
      limbs.forEach((limb,i)=>limb.rotation.x=seated?(i%2===0?-Math.PI/2:-.4):swing*(i===0||i===3?1:-1));
      knees.forEach(knee=>knee.rotation.x=seated?Math.PI/2:0);
      for(const [i,limb] of limbs.entries()){limb.rotation.z=(player.altitude||0)>.1?(i%2?(i===1?.35:-.35):0):0;if((player.altitude||0)>.1)limb.rotation.x=i%2?-.35:.25;}
      if(resting?.computer&&computer?.pulse>0){limbs[1].rotation.x=-1.15+Math.sin(roomTime*38)*.12;limbs[3].rotation.x=-1.15-Math.sin(roomTime*38)*.12;}
      if(shop?.items.some(item=>item.carried)){limbs[1].rotation.x=-1.1;limbs[3].rotation.x=-1.1;}
      bite.visible=eating;if(eating){const lift=Math.sin(Math.min(1,(1.5-biteUntil+roomTime)/.7)*Math.PI/2);limbs[3].rotation.x=-1.3-lift*.8;const drink=['milk','milkshake','galaxyShake'].includes(bite.userData.kind);bite.position.set(.28-.02*lift,1.15+lift*(drink?.23:.5),.36);bite.rotation.set(drink?-lift*.45:0,0,0);}
    }
    const target=new T.Vector3(),position=new T.Vector3();
    if(mode==='walk'){const pose=cityWalkCamera(player,yaw);target.set(pose.target.x,pose.target.y,pose.target.z);position.set(pose.position.x,pose.position.y,pose.position.z);}
    else{target.set(state.size*2.5,0,state.size*2.5);const distance=state.size*5*1.1*zoom;position.set(target.x+Math.sin(yaw+.5)*distance,distance*.85,target.z+Math.cos(yaw+.5)*distance);}
    if(computer?.open&&resting?.computer){const desk=resting.computer;target.set(desk.x,1.25,desk.z+.05);position.set(desk.x,1.45,desk.z+1.25);}
    const ease=computer?.open?1-Math.exp(-dt*10):mode==='walk'||!initialized?1:1-Math.exp(-dt*6);camera.position.lerp(position,ease);look.lerp(target,ease);camera.lookAt(look);initialized=true;
    for(const piece of doorFrame)piece.visible=position.z<5.6;
    scene.background.set(inside?'#d8d1c4':'#adcbdc');scene.fog.near=inside?200:110;if(fireGraphics.render(fire)){avatar.visible=false;world.visible=false;room.visible=fire.phase==='cab';scene.background.set(fire.phase==='drive'?'#a5d4e8':'#d8d1c4');}renderer.render(scene,camera);
  }
  const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0);
  function pick(clientX,clientY,inside=false){
    const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);
    if(inside){
      const food=ray.intersectObjects([...orderMeshes.values()].filter(g=>!g.userData.carried),true)[0];
      if(food)return {x:food.point.x,z:food.point.z,orderId:food.object.userData.orderId};
      const hits=[];for(const surface of shopSurfaces){const point=new T.Vector3();if(ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-surface.y),point)&&Math.abs(point.x-surface.x)<=surface.w/2&&Math.abs(point.z-surface.z)<=surface.d/2)hits.push({x:point.x,z:point.z,surfaceId:surface.id,distance:camera.position.distanceTo(point)});}
      hits.sort((a,b)=>a.distance-b.distance);if(hits.length)return hits[0];
    }
    const p=new T.Vector3();if(!ray.ray.intersectPlane(plane,p))return null;const hit=inside?null:ray.intersectObjects(buildings,false)[0];return {x:p.x,z:p.z,building:hit?.object.userData.building};
  }
  function portrait(target){const oldPosition=avatar.position.clone(),oldRotation=avatar.rotation.clone(),oldVisible=avatar.visible,oldWorld=world.visible,oldRoom=room.visible;world.visible=false;room.visible=false;avatar.visible=true;avatar.position.set(0,0,0);avatar.rotation.set(0,-.25,0);const cam=new T.PerspectiveCamera(30,1,.1,20);cam.position.set(0,1.3,4.5);cam.lookAt(0,1.05,0);renderer.setSize(200,200,false);renderer.render(scene,cam);const c=target.getContext('2d');c.drawImage(canvas,0,0,target.width,target.height);renderer.setSize(900,650,false);avatar.position.copy(oldPosition);avatar.rotation.copy(oldRotation);avatar.visible=oldVisible;world.visible=oldWorld;room.visible=oldRoom;}
  rebuild();person();
  magic=createCityMagic(T,scene,avatar,material,geo);
  return {canvas,rebuild,person,render,pick,furnish,eat,growFlower:magic.growFlower,shopSurfaces:()=>shopSurfaces,eatOrder(kind){showBite(kind);biteUntil=roomTime+1.5;if(CITY_FOOD[kind]?.upgrade){celebration?.removeFromParent();celebration=new T.Group();celebration.name='food-celebration';celebration.position.set(reactionTarget.x,0,reactionTarget.z);celebration.userData.start=roomTime;room.add(celebration);for(let i=0;i<72;i++)mesh(celebration,geo(kind==='galaxyShake'?'food-star':'food-confetti',()=>kind==='galaxyShake'?new T.OctahedronGeometry(.035):new T.BoxGeometry(.07,.025,.04)),solid(['#ff3e93','#ffac32','#ffec49','#4be978','#38dbff','#be6bff'][i%6]),0,0,0);}},portrait,faceDoor(){yaw=0;},turn(direction){yaw+=direction*.35;},zoom(value){zoom=Math.max(.65,Math.min(1.5,zoom+value));},yaw:()=>yaw,dispose(){fireGraphics.dispose();magic.dispose();clear(world);clear(room);for(const m of materials.values())m.dispose();for(const g of geometries.values())g.dispose();for(const t of textures)t.dispose();renderer.dispose();renderer.forceContextLoss();canvas.replaceWith(original);}};
}
