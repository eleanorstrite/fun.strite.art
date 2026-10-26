// Bounded, reusable outdoor magic. Pausing freezes particles and flower growth.
export function createCityMagic(T,scene,avatar,material,geo){
  const garden=new T.Group(),trail=new T.Group(),wings=new T.Group();scene.add(garden,trail);avatar.add(wings);
  garden.name='rainbow-magic-garden';trail.name='golden-speed-contrail';wings.name='golden-flight-wings';wings.visible=false;
  let time=0,cursor=0,emit=0;const flowers=[],particles=[],history=[],ribbons=[];
  const gold=material('magic-gold',{color:'#ffe8a0',emissive:'#d68b16',emissiveIntensity:.55,metalness:.55,roughness:.25});
  const sphere=geo('magic-petal',()=>new T.SphereGeometry(1,12,8));
  function ellipsoid(parent,x,y,z,sx,sy,sz,mat){const m=new T.Mesh(sphere,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  for(const side of [-1,1]){const wing=new T.Group();wing.position.set(side*.18,1.35,-.18);wings.add(wing);for(let i=0;i<12;i++){const feather=ellipsoid(wing,side*(.18+i*.065),.05+Math.sin(i/11*Math.PI)*.3,-i*.018,.06,.38+(i%4)*.035,.025,gold);feather.rotation.z=-side*(.35+i*.075);}}
  for(let i=0;i<100;i++){const m=new T.Mesh(geo('magic-star',()=>new T.OctahedronGeometry(.045)),gold);m.visible=false;trail.add(m);particles.push({mesh:m,life:0,angle:i*2.399});}
  const shimmer=new T.Group();shimmer.name='golden-speed-shimmer';avatar.add(shimmer);shimmer.visible=false;
  for(let i=0;i<12;i++){const star=new T.Mesh(geo('magic-star',()=>new T.OctahedronGeometry(.045)),gold);shimmer.add(star);}
  for(let i=0;i<2;i++){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(31*18),3));geometry.setDrawRange(0,0);const ribbon=new T.Mesh(geometry,material('gold-ribbon-'+i,{color:i?'#fff6bd':'#edba38',emissive:'#b9861a',emissiveIntensity:.7,roughness:.3,transparent:true,opacity:i?.65:.45,side:T.DoubleSide,depthWrite:false}));ribbon.frustumCulled=false;trail.add(ribbon);ribbons.push(ribbon);}
  function growFlower(x,z){
    if(flowers.some(f=>Math.hypot(f.group.position.x-x,f.group.position.z-z)<.35))return;
    if(flowers.length>=70){const oldest=flowers.shift();oldest.group.removeFromParent();oldest.group.traverse(object=>{if(object.isInstancedMesh)object.dispose();});}
    const group=new T.Group();group.position.set(x,0,z);garden.add(group);group.name='rainbow-flower';
    const stem=material('magic-stem',{color:'#398354',roughness:.7});ellipsoid(group,0,.36,0,.025,.36,.025,stem);for(const side of [-1,1]){const leaf=ellipsoid(group,side*.12,.25,0,.16,.045,.055,stem);leaf.rotation.z=side*.5;}
    const bloom=new T.Group();group.add(bloom);bloom.position.y=.75;bloom.rotation.x=-Math.PI/3;
    const colors=['#ff38bb','#be35f4','#5755ff','#1dd2e6','#39d96a','#f5e932','#ff9a27','#fa4e6d'];
    const transform=new T.Object3D();
    for(let color=0;color<8;color++){
      const petals=new T.InstancedMesh(sphere,material('flower-'+colors[color],{color:colors[color],roughness:.4,emissive:colors[color],emissiveIntensity:.12}),6);bloom.add(petals);let index=0;
      for(let layer=0;layer<3;layer++)for(const i of [color,color+8]){const angle=i*Math.PI/8+layer*.14,r=.11+layer*.055;transform.position.set(Math.sin(angle)*r,Math.cos(angle)*r,layer*.025);transform.scale.set(.045,.16+layer*.025,.025);transform.rotation.set(0,0,-angle);transform.updateMatrix();petals.setMatrixAt(index++,transform.matrix);}
      petals.instanceMatrix.needsUpdate=true;
    }
    ellipsoid(bloom,0,0,.1,.065,.065,.05,gold);flowers.push({group,born:time});
  }
  function render({player,powers={},moving,interior,mode,dt}){
    time+=dt;const outside=mode==='walk'&&!interior;garden.visible=trail.visible=outside;wings.visible=outside&&(player.altitude||0)>.1;
    for(const [i,wing] of wings.children.entries())wing.rotation.z=(i?1:-1)*Math.sin(time*5)*.2;
    shimmer.visible=outside&&powers.speed>0&&moving;for(const [i,p] of shimmer.children.entries()){const a=time*4+i*Math.PI/6;p.position.set(Math.sin(a)*.4,.35+(i%4)*.4,Math.cos(a)*.3);p.scale.setScalar(.4+Math.sin(a)**2);}
    for(const flower of flowers){flower.group.scale.setScalar(Math.min(1,(time-flower.born)*1.8));flower.group.rotation.z=Math.sin(time*1.8+flower.born)*.04;}
    if(outside&&powers.speed>0&&moving){if(dt>0){history.unshift({x:player.x-Math.sin(player.angle)*.4,y:.8+(player.altitude||0),z:player.z-Math.cos(player.angle)*.4,life:.9});history.length=Math.min(32,history.length);}emit+=dt;while(emit>=.025){emit-=.025;const p=particles[cursor++%particles.length];p.life=1;p.mesh.position.set(player.x-Math.sin(player.angle)*.5,.7+(player.altitude||0),player.z-Math.cos(player.angle)*.5);p.mesh.visible=true;}}else emit=0;
    for(const point of history)point.life-=dt;while(history.length&&history.at(-1).life<=0)history.pop();
    for(const [r,ribbon] of ribbons.entries()){
      const attribute=ribbon.geometry.attributes.position;let vertex=0;
      const edge=(p,i,side)=>{const a=i*.45+time*5+r*Math.PI,w=.025+.04*Math.max(0,p.life/.9);return [p.x+Math.sin(a)*.14+side*w,p.y+Math.cos(a)*.15,p.z+Math.cos(a)*.14];};
      for(let i=0;i<history.length-1;i++){const a=edge(history[i],i,-1),b=edge(history[i],i,1),c=edge(history[i+1],i+1,-1),d=edge(history[i+1],i+1,1);for(const point of [a,b,c,b,d,c])attribute.setXYZ(vertex++,...point);}
      ribbon.geometry.setDrawRange(0,vertex);attribute.needsUpdate=true;
    }
    for(const p of particles){if(p.life<=0)continue;p.life=Math.max(0,p.life-dt);p.mesh.visible=p.life>0;p.mesh.position.x+=Math.sin(p.angle)*dt*.35;p.mesh.position.y+=dt*.4;p.mesh.position.z+=Math.cos(p.angle)*dt*.35;p.mesh.scale.setScalar(p.life*(.5+Math.sin(time*12+p.angle)**2));p.mesh.rotation.y+=dt*3;}
  }
  return {growFlower,render,reattach(){avatar.add(wings,shimmer);},dispose(){garden.traverse(object=>{if(object.isInstancedMesh)object.dispose();});garden.removeFromParent();trail.removeFromParent();wings.removeFromParent();shimmer.removeFromParent();for(const ribbon of ribbons)ribbon.geometry.dispose();}};
}
