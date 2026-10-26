import * as T from './vendor/three/three.module.min.js';
export function createFireGraphics(scene,camera,material,geo){
 const red=material('engine-red',{color:'#c62624',roughness:.27,metalness:.22}),chrome=material('engine-chrome',{color:'#d9e3e9',roughness:.2,metalness:.75}),black=material('engine-rubber',{color:'#20252a',roughness:.8}),glass=material('engine-windows',{color:'#344b58',roughness:.14,metalness:.45}),white=material('engine-white',{color:'#f4e7c9',roughness:.4});
 const boxGeo=geo('fire-box',()=>new T.BoxGeometry(1,1,1)),sphere=geo('fire-sphere',()=>new T.SphereGeometry(1,16,12));
 function box(parent,x,y,z,w,h,d,mat){const m=new T.Mesh(boxGeo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;parent.add(m);return m;}
 function ball(parent,x,y,z,rx,ry,rz,mat){const m=new T.Mesh(sphere,mat);m.position.set(x,y,z);m.scale.set(rx,ry,rz);parent.add(m);return m;}
 function ring(parent,x,y,z,r,t,mat){const m=new T.Mesh(geo(`fire-ring-${r}-${t}`,()=>new T.TorusGeometry(r,t,8,32)),mat);m.position.set(x,y,z);parent.add(m);return m;}
 let parkedEngine=null;
 function truck(parent){
  const g=new T.Group();g.name='detailed-fire-engine';g.userData.animated=true;parent.add(g);parkedEngine=g;
  box(g,0,.62,0,2.3,.24,5.6,black);box(g,0,1.35,-1.15,2.3,1.35,3.3,red);box(g,0,1.7,1.45,2.35,2.15,2.2,red);box(g,0,2.85,1.45,2.4,.13,2.25,white);
  box(g,0,2.25,2.57,2.08,.85,.045,glass);box(g,0,2.25,2.61,.06,.86,.04,chrome);box(g,0,1.22,2.6,1.25,.9,.08,chrome);box(g,0,1.22,2.65,1.12,.8,.03,black);
  for(let i=0;i<11;i++)box(g,(i-5)*.095,1.22,2.68,.022,.78,.02,chrome);box(g,0,.66,2.78,2.7,.22,.22,chrome);
  for(const side of [-1,1]){
   box(g,side*1.19,2.2,1.42,.04,.85,1.48,glass);box(g,side*1.22,1.55,1.5,.03,.03,1.8,chrome);box(g,side*1.23,1.45,1.1,.06,.05,.25,chrome);
   box(g,side*1.36,2.3,2.1,.25,.4,.12,chrome);box(g,side*1.29,2.2,2.12,.15,.04,.12,chrome);box(g,side*1.18,1.05,0,.035,.18,5.2,white);
   box(g,side*.9,1.5,2.64,.27,.24,.05,white);box(g,side*.9,1.15,2.64,.27,.2,.05,material('engine-amber',{color:'#ffc83b',emissive:'#ff9e00',emissiveIntensity:.5}));
   for(const z of [-2,1.65]){const wheel=ring(g,side*1.18,.62,z,.43,.16,black);wheel.rotation.y=Math.PI/2;const hub=ball(g,side*1.32,.62,z,.045,.33,.33,chrome);for(let i=0;i<8;i++)ball(g,side*1.37,.62+Math.sin(i*Math.PI/4)*.23,z+Math.cos(i*Math.PI/4)*.23,.02,.035,.035,black);}
   for(const z of [-2.1,-.95]){box(g,side*1.17,1.52,z,.04,.84,.98,chrome);for(let i=0;i<9;i++)box(g,side*1.2,1.15+i*.085,z,.02,.015,.94,black);box(g,side*1.22,1.25,z,.03,.05,.3,white);}
   box(g,side*.9,2.15,-1.2,.07,.07,2.7,chrome);for(let i=0;i<9;i++)box(g,0,2.15,-2.4+i*.3,1.85,.06,.06,chrome);
  }
  box(g,-1.2,1.45,.05,.06,.85,.65,black);for(let i=0;i<4;i++){ring(g,-1.25,1.2+i*.17,.1,.06,.015,chrome).rotation.y=Math.PI/2;}
  for(const side of [-1,1])for(let i=0;i<3;i++){const hose=ring(g,side*.6,2.1+i*.035,-1.2,.34,.035,black);hose.rotation.x=Math.PI/2;}
  for(const side of [-1,1]){const wiper=box(g,side*.55,1.88,2.63,.7,.035,.025,black);wiper.rotation.z=side*.18;ring(g,side*.82,.72,2.91,.13,.023,chrome);ball(g,side*.82,.72,2.9,.1,.1,.025,white);}
  const badge=new T.Mesh(geo('engine-badge',()=>new T.CircleGeometry(.14,8)),material('engine-gold',{color:'#d8ab48',metalness:.65,roughness:.3}));badge.position.set(0,1.82,2.65);g.add(badge);
  const lights=[];for(const side of [-1,1])lights.push(box(g,side*.58,3.02,1.5,.85,.18,.35,material('engine-beacon-'+side,{color:side<0?'#ff3434':'#d6f4ff',emissive:side<0?'#ff0000':'#a8e5ff',emissiveIntensity:1.5})));
  g.traverse(object=>object.userData.animated=true);return {group:g,lights};
 }
 const field=new T.Group();field.name='firefighting-grass-field';scene.add(field);field.visible=false;
 const grass=material('fire-field-grass',{color:'#78a448',roughness:1});box(field,0,-.15,0,100,.25,100,grass);
 // Small grass clumps give the temporary field texture without changing the saved city.
 const blades=new T.InstancedMesh(geo('fire-grass-blade',()=>new T.ConeGeometry(.08,.3,3)),material('fire-blades',{color:'#668f3e',roughness:1}),700);const transform=new T.Object3D();for(let i=0;i<700;i++){transform.position.set((i*17.37)%90-45,.1,(i*31.91)%90-45);transform.updateMatrix();blades.setMatrixAt(i,transform.matrix);}field.add(blades);
 const cab=new T.Group();cab.name='fire-truck-cab';camera.add(cab);cab.position.set(0,.15,-.45);scene.add(camera);cab.visible=false;
 box(cab,0,-.72,-1.15,2.8,.43,.7,black);box(cab,0,-.49,-1.1,2.65,.06,.7,chrome);
 for(const side of [-1,1]){box(cab,side*1.12,.05,-1.2,.09,1.55,.1,red);box(cab,side*1.32,-.55,-.35,.18,.72,1.5,red);box(cab,side*1.15,.72,-1.15,.12,.1,.8,red);}box(cab,0,.79,-1.2,2.4,.1,.1,red);
 const steering=ring(cab,-.4,-.49,-.72,.23,.028,black);for(let i=0;i<3;i++){const spoke=box(steering,0,.1,0,.02,.2,.02,chrome);spoke.rotation.z=i*Math.PI*2/3;}
 for(let i=0;i<3;i++){ring(cab,-.72+i*.18,-.43,-.86,.065,.008,chrome);ball(cab,-.72+i*.18,-.43,-.87,.06,.06,.009,black);const needle=box(cab,-.72+i*.18,-.42,-.85,.005,.055,.005,white);needle.rotation.z=-.6;}
 box(cab,.4,-.42,-.92,.45,.16,.03,material('fire-radio',{color:'#417568',emissive:'#2c6c59',emissiveIntensity:.5}));for(let i=0;i<4;i++)ball(cab,.2+i*.13,-.58,-.78,.027,.027,.027,i%2?white:red);
 const fires=[],water=new T.Group();water.name='fire-truck-water-spray';field.add(water);const drops=[];for(let i=0;i<75;i++){const m=ball(water,0,0,0,.022,.022,.08,material('fire-water',{color:'#a6e8ff',emissive:'#528ba4',emissiveIntensity:.25,transparent:true,opacity:.75}));drops.push(m);}
 const flameMaterials=['#ffb326','#ff6312','#ffe48a'].map((color,i)=>material('fire-flame-'+i,{color,emissive:color,emissiveIntensity:.55,transparent:true,opacity:.83,depthWrite:false}));
 function reset(trip){for(const fire of fires)fire.group.removeFromParent();fires.length=0;if(!trip)return;for(const f of trip.fires){const group=new T.Group();group.name='small-fire-'+f.id;group.position.set(f.x,0,f.z);field.add(group);const flames=[];for(let i=0;i<9;i++){const m=new T.Mesh(geo('fire-flame-shape',()=>new T.LatheGeometry([[0,0],[.13,.04],[.22,.28],[.13,.65],[.05,1.1],[0,1.4]].map(([r,y])=>new T.Vector2(r,y)),12)),flameMaterials[i%3]);m.position.set(Math.sin(i*2.4)*.35,0,Math.cos(i*2.4)*.35);group.add(m);flames.push(m);}ring(group,0,.025,0,.6,.06,black).rotation.x=-Math.PI/2;fires.push({group,flames});}}
 let lastTrip=null;
 function render(fire){const active=Boolean(fire);if(parkedEngine)parkedEngine.visible=!active;cab.visible=active;field.visible=fire?.phase==='drive';if(!active){lastTrip=null;return false;}
  const trip=fire.trip;steering.rotation.z=(trip?.steering||0)*.45;
  if(fire.phase==='drive'){
   if(lastTrip!==trip){reset(trip);lastTrip=trip;}
   const t=trip.elapsed;camera.position.set(trip.x,2.2+Math.sin(t*9)*Math.abs(trip.speed)*.003,trip.z);camera.lookAt(trip.x+Math.sin(trip.angle)*12,1.9,trip.z+Math.cos(trip.angle)*12);
   for(const [i,f] of fires.entries()){const health=trip.fires[i].health;for(const [j,m] of f.flames.entries()){m.visible=health>0;m.scale.set((.8+Math.sin(t*9+j)*.2)*health,(.7+Math.sin(t*7+j*2)*.2)*health,.85*health);m.position.y=0;m.position.x=Math.sin(j*2.4)*.35+Math.sin(t*4+j)*.09;m.rotation.z=Math.sin(t*6+j)*.15;}}
   water.visible=trip.spraying;let reach=16;for(const f of trip.fires){const dx=f.x-trip.x,dz=f.z-trip.z,d=Math.hypot(dx,dz);if(f.health>0&&d>1&&(dx*Math.sin(trip.angle)+dz*Math.cos(trip.angle))/d>.955)reach=Math.min(reach,d);}for(const [i,m]of drops.entries()){const d=((t*14+i*.21)%reach)+.3,spread=d*.018;m.position.set(trip.x+Math.sin(trip.angle)*d+Math.cos(trip.angle)*.5*(1-d/reach)+Math.sin(i*2.4)*spread,2.1*(1-d/reach)+.3*d/reach+Math.sin(d/reach*Math.PI)*.5,trip.z+Math.cos(trip.angle)*d-Math.sin(trip.angle)*.5*(1-d/reach)+Math.cos(i*2.4)*spread);m.rotation.y=trip.angle;}
  }else{camera.position.set(-2,2.2,.75);camera.lookAt(-2,1.9,7);water.visible=false;}
  return true;
 }
 return {truck,render,dispose(){blades.dispose();field.removeFromParent();cab.removeFromParent();}};
}
