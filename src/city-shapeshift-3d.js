import {CITY_ANIMALS} from './city-powers.js';
// Models and surface maps are created once per form, then reused for every switch.
export function createCityShapeshift(T,scene,material,geo){
 const root=new T.Group();root.name='city-shapeshift';root.visible=false;scene.add(root);
 const models=new Map(),skins=new Map(),textures=[];let time=0;
 const sphere=geo('animal-anatomy-sphere',()=>new T.SphereGeometry(1,40,28));
 const color=(value,roughness=.7)=>material('animal-detail-'+value+roughness,{color:value,roughness});
 function skin(kind){
  if(skins.has(kind))return skins.get(kind);
  const base={tiger:'#d99442',cat:'#9c8b70',dog:'#302a24',giraffe:'#f0d09a',elephant:'#85817b',dragon:'#71352f'}[kind];
  const options={color:base,roughness:kind==='dragon'?.48:.86};
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');let seed=71;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
   c.fillStyle=base;c.fillRect(0,0,512,512);
   if(kind==='tiger'||kind==='cat'){
    c.fillStyle=kind==='tiger'?'#241e1b':'#423a31';for(let i=0;i<22;i++){const x=i*24+Math.sin(i)*8,w=kind==='tiger'?9:6;c.beginPath();c.moveTo(x,0);for(let y=0;y<=512;y+=12)c.lineTo(x+Math.sin(y*.024+i)*11+Math.sin(y*.08+i)*3,y);for(let y=512;y>=0;y-=12)c.lineTo(x+w*(.3+Math.abs(Math.sin(y*.009+i)))+Math.sin(y*.024+i)*11,y);c.fill();}
   }else if(kind==='giraffe'){
    for(let row=-1;row<9;row++)for(let col=-1;col<9;col++){const x=col*67+(row%2)*33,y=row*65;c.fillStyle=['#9a5f30','#a76a33','#89542c'][Math.floor(rnd()*3)];c.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3,r=29+rnd()*4;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();}
   }else if(kind==='dragon'){
    for(let y=-12;y<530;y+=18)for(let x=-12;x<530;x+=22){const xx=x+(Math.floor(y/18)%2)*11;c.fillStyle=rnd()>.5?'#9c4934':'#80352e';c.strokeStyle='#492823';c.lineWidth=1.5;c.beginPath();c.ellipse(xx,y,10,13,0,0,Math.PI*2);c.fill();c.stroke();}
   }else if(kind==='elephant'){
    c.strokeStyle='#5e5a54';c.lineWidth=1;for(let i=0;i<100;i++){const y=rnd()*512;c.beginPath();for(let x=0;x<=512;x+=8){const yy=y+Math.sin(x*.02+i)*7+Math.sin(x*.08+i)*2;x?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();}
   }
   // Fine directional fur/grain breaks up plastic-looking uniform surfaces.
   for(let i=0;i<16000;i++){const x=rnd()*512,y=rnd()*512;c.globalAlpha=.06+rnd()*.12;c.strokeStyle=i%2?'#fff0d3':'#211a15';c.lineWidth=.55;c.beginPath();c.moveTo(x,y);c.lineTo(x+(rnd()-.5)*3,y+(kind==='elephant'?2:4+rnd()*7));c.stroke();}c.globalAlpha=1;
   const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;textures.push(map);Object.assign(options,{color:'#ffffff',map,bumpMap:map,bumpScale:kind==='elephant'?.018:.006});
  }
  const mat=material('animal-surface-v2-'+kind,options);skins.set(kind,mat);return mat;
 }
 function ell(parent,x,y,z,sx,sy,sz,mat){const m=new T.Mesh(sphere,typeof mat==='string'?color(mat):mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function curve(parent,key,points,r,mat){const m=new T.Mesh(geo(key,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,8,false)),typeof mat==='string'?color(mat):mat);m.castShadow=true;parent.add(m);return m;}
 function tapered(parent,key,points,r0,r1,mat){const geometry=geo(key,()=>{const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),frames=path.computeFrenetFrames(32,false),positions=[],indices=[];for(let i=0;i<=32;i++){const p=path.getPoint(i/32),r=r0+(r1-r0)*i/32;for(let j=0;j<=12;j++){const a=j/12*Math.PI*2,v=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);positions.push(v.x,v.y,v.z);if(i<32&&j<12){const n=i*13+j;indices.push(n,n+13,n+1,n+1,n+13,n+14);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;});const m=new T.Mesh(geometry,typeof mat==='string'?color(mat):mat);m.castShadow=true;parent.add(m);return m;}
 function build(kind){
  const g=new T.Group();g.name='shapeshift-'+kind;g.userData.animal=kind;root.add(g);
  const elephant=kind==='elephant',giraffe=kind==='giraffe',dragon=kind==='dragon',cat=kind==='cat',tiger=kind==='tiger',dog=kind==='dog',fur=skin(kind);
  const hip=giraffe?1.35:elephant?.95:dragon?.85:.66,width=elephant?.55:dragon?.34:tiger?.3:.25,length=elephant?.83:dragon?.72:tiger?.7:.58;
  const torso=new T.Group();g.add(torso);ell(torso,0,hip,0,width,elephant?.5:.29,length,fur);
  ell(torso,0,hip+.03,length*.55,width*.95,elephant?.46:.34,.32,fur);ell(torso,0,hip-.04,-length*.62,width*.9,.29,.28,fur);
  if(!elephant&&!giraffe)ell(torso,0,hip-.16,.03,width*.75,.16,length*.8,dragon?'#b69a6d':dog?'#b48856':'#d9cfb6');
  if(giraffe){const neck=ell(torso,0,1.91,.42,.17,.75,.21,fur);neck.rotation.x=.25;curve(torso,'giraffe-mane',[[0,1.25,.22],[0,1.9,.13],[0,2.45,.07]],.028,'#67432c');}
  if(dragon){ell(torso,0,1.04,.55,.21,.36,.24,fur);for(let i=0;i<9;i++)tapered(torso,'dragon-dorsal-'+i,[[0,hip+.25,-.6+i*.13],[0,hip+.43,-.67+i*.13]],.055,0,'#b69269');}
  const head=new T.Group();head.name='animal-head';head.position.set(0,giraffe?2.55:elephant?1.2:dragon?1.42:.98,giraffe?.61:elephant?.72:dragon?.7:length*.85);torso.add(head);
  ell(head,0,0,0,elephant?.34:dragon?.19:.205,elephant?.38:dragon?.22:.22,elephant?.31:.24,fur);
  const muzzleZ=dog||giraffe?.29:dragon?.3:.2;
  ell(head,0,-.095,muzzleZ,dog?.12:giraffe?.14:elephant?.2:.16,.1,dog||giraffe||dragon?.22:.12,dog?'#b18c60':dragon?fur:elephant?fur:'#e1d4bc');
  const jaw=new T.Group();head.add(jaw);jaw.position.set(0,-.16,muzzleZ);ell(jaw,0,0,.025,.12,.047,.12,elephant?fur:dragon?'#a38c6a':'#d7c9ae');
  if(!elephant){ell(head,0,-.075,muzzleZ+(dog||giraffe||dragon?.18:.11),.06,.04,.028,color('#302725',.28));curve(head,kind+'-mouth',[[-.08,-.15,muzzleZ+.1],[0,-.16,muzzleZ+.12],[.08,-.15,muzzleZ+.1]],.007,'#4b3730');}
  const eyes=[],ears=[],wings=[],legs=[],tail=[];let trunk=null;
  for(const side of [-1,1]){
   const eye=new T.Group();eye.position.set(side*(elephant?.25:.14),.035,elephant?.18:.173);eye.rotation.y=side*.25;head.add(eye);ell(eye,0,0,0,.048,.039,.027,'#352a21');const lid=ell(eye,0,0,.02,.035,.027,.018,color(dragon?'#f8bd39':cat?'#8ba56a':'#aa8b47',.24));ell(eye,0,0,.035,cat||dragon?.008:.015,.022,.007,'#101919');ell(eye,-.009,.01,.042,.006,.006,.004,color('#fff9e6',.1));eyes.push({eye,lid});
   ell(head,side*.145,.085,.17,.065,.025,.03,fur);
   const ear=new T.Group();ear.position.set(side*(elephant?.3:.17),elephant?.05:.18,-.04);head.add(ear);ears.push(ear);
   if(elephant){ell(ear,side*.16,-.06,0,.29,.43,.055,fur);ell(ear,side*.16,-.06,.048,.19,.32,.008,'#8d7b71');}
   else if(cat||dog||dragon){const shape=new T.Shape();shape.moveTo(-.075,0);shape.quadraticCurveTo(-.07,.12,side*.035,.22);shape.quadraticCurveTo(.085,.13,.075,0);shape.closePath();const m=new T.Mesh(geo(kind+'-ear-'+side,()=>new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:3,steps:1})),fur);ear.add(m);ell(ear,0,.09,.045,.04,.07,.008,dragon?'#ac7555':'#b99a87');if(dog)ear.rotation.z=-side*.4;}
   else{ell(ear,0,.025,0,.085,.11,.055,fur);ell(ear,0,.025,.045,.052,.065,.008,'#544236');}
   if(giraffe||dragon)tapered(head,kind+'-horn-detailed-'+side,[[side*.1,.14,-.02],[side*.13,.32,-.08],[side*.18,dragon?.46:.35,-.16]],.035,dragon?0:.02,dragon?'#b7a17b':'#5f4933');
   if(elephant)tapered(head,'elephant-ivory-'+side,[[side*.18,-.17,.22],[side*.23,-.43,.42],[side*.24,-.37,.66]],.055,0,'#e9dfc5');
   if(cat||tiger)for(let j=0;j<4;j++)curve(head,kind+'-whisker-'+side+'-'+j,[[side*.08,-.11,muzzleZ+.1],[side*.24,-.1+(j-1.5)*.022,muzzleZ+.14],[side*.37,-.09+(j-1.5)*.035,muzzleZ+.12]],.002,'#ddd2bb');
   if(dog)ell(head,side*.13,.09,.205,.04,.02,.01,'#b18750');
   for(const front of [false,true]){
    const leg=new T.Group(),knee=new T.Group(),paw=new T.Group();leg.name='animal-upper-leg';knee.name='animal-knee';paw.name='animal-paw';leg.position.set(side*width*.72,hip-.06,front?length*.6:-length*.64);g.add(leg);leg.add(knee);knee.add(paw);
    const l1=(hip-.12)*.52,l2=(hip-.12)*.48,thick=elephant?.15:giraffe?.065:front?.075:.105;knee.position.y=-l1;paw.position.y=-l2;
    ell(leg,0,-l1*.4,0,thick,l1*.62,thick*1.1,fur);ell(knee,0,-l2*.46,0,thick*.65,l2*.6,thick*.7,fur);ell(knee,0,0,0,thick*.8,thick*.85,thick*.8,fur);
    ell(paw,0,0,.045,elephant?.17:giraffe?.065:.09,.065,elephant?.2:giraffe?.09:.14,giraffe?'#554937':dog?'#ae875b':fur);
    for(let toe=0;toe<(giraffe?2:3);toe++)ell(paw,(toe-(giraffe?.5:1))*(elephant?.075:.042),-.005,elephant?.18:.15,elephant?.035:.015,.025,.018,dragon?'#c5b69a':elephant?'#aaa08a':giraffe?'#34312b':'#51473b');
    legs.push({leg,knee,paw,l1,l2,front,side});
   }
  }
  if(elephant){trunk=new T.Group();trunk.name='elephant-trunk';trunk.position.set(0,-.17,.25);head.add(trunk);tapered(trunk,'elephant-tapered-trunk',[[0,0,0],[0,-.35,.07],[0,-.7,.15],[0,-.85,.31]],.13,.045,fur);ell(trunk,0,-.85,.33,.03,.022,.009,'#4d4943');}
  let parent=g;for(let i=0;i<6;i++){const joint=new T.Group();joint.name='animal-tail-joint';joint.position.set(0,i===0?hip:0,i===0?-length*.87:-.13);parent.add(joint);tapered(joint,kind+'-tail-segment-'+i,[[0,0,0],[0,0,-.135]],(dragon?.09:.035)*(1-i*.13),(dragon?.09:.035)*(1-(i+1)*.13),fur);parent=joint;tail.push(joint);}if(giraffe||elephant)ell(parent,0,-.02,-.08,.06,.08,.045,'#41362c');
  if(dragon)for(const side of [-1,1]){
   const wing=new T.Group();wing.name='dragon-wing';wing.position.set(side*.22,1.05,.02);torso.add(wing);const shape=new T.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(side*.15,.56,side*.52,.8);shape.quadraticCurveTo(side*.97,.65,side*1.43,.28);shape.quadraticCurveTo(side*1.05,.37,side*.96,-.13);shape.quadraticCurveTo(side*.7,.12,side*.54,-.36);shape.quadraticCurveTo(side*.24,-.07,0,-.2);shape.closePath();const membrane=new T.Mesh(geo('curved-dragon-wing-'+side,()=>{const geometry=new T.ShapeGeometry(shape,24),p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(Math.abs(p.getX(i))*2)*.12);geometry.computeVertexNormals();return geometry;}),material('dragon-membrane',{color:'#a8573b',roughness:.7,side:T.DoubleSide}));wing.add(membrane);membrane.castShadow=true;
   for(const [j,end] of [[side*.52,.8,0],[side*1.43,.28,0],[side*.96,-.13,0],[side*.54,-.36,0]].entries())curve(wing,'dragon-finger-'+side+'-'+j,[[0,0,0],[side*.38,.45,.09],end],j===0?.035:.018,'#65382b');wings.push(wing);
  }
  if(cat)g.scale.setScalar(.7);if(giraffe)g.scale.setScalar(.86);return {g,torso,head,jaw,eyes,ears,legs,tail,trunk,wings,kind,hip,activity:0};
 }
 function render({mode,player,powers={},moving,interior,fire,dt}){
  time+=Math.max(0,dt||0);const active=mode==='walk'&&!interior&&!fire&&powers.shapeshift>0&&CITY_ANIMALS.includes(powers.animal);root.visible=active;if(!active)return false;
  const kind=powers.animal;if(!models.has(kind))models.set(kind,build(kind));for(const [name,m]of models)m.g.visible=name===kind;const m=models.get(kind);root.position.set(player.x,.065+(player.altitude||0),player.z);root.rotation.y=player.angle||0;
  m.activity+=(Number(Boolean(moving))-m.activity)*Math.min(1,(dt||0)*8);const activity=m.activity;
  const pace=kind==='elephant'?3.3:kind==='giraffe'?3.8:6,phase=time*pace,stride=kind==='elephant'?.18:.22;
  m.torso.scale.y=1+Math.sin(time*1.7)*.009;m.torso.rotation.z=moving?Math.sin(phase)*.018:0;m.head.rotation.x=moving?Math.sin(phase*2)*.025:Math.sin(time*.8)*.035;m.head.rotation.y=moving?0:Math.sin(time*.55)*.065;
  for(const l of m.legs){const p=phase+(l.side>0?Math.PI:0)+(l.front?0:kind==='giraffe'?.2:Math.PI*.6),s=Math.sin(p),lift=activity*Math.max(0,s)*.12,z=activity*Math.cos(p)*stride,y=-(l.l1+l.l2-.012)+lift,d=Math.min(l.l1+l.l2-.001,Math.hypot(y,z));l.leg.rotation.x=Math.atan2(-z,-y)-Math.acos(Math.max(-1,Math.min(1,(l.l1*l.l1+d*d-l.l2*l.l2)/(2*l.l1*d))));l.knee.rotation.x=Math.acos(Math.max(-1,Math.min(1,(d*d-l.l1*l.l1-l.l2*l.l2)/(2*l.l1*l.l2))));l.paw.rotation.x=-l.leg.rotation.x-l.knee.rotation.x;}
  const blink=Math.max(0,1-Math.abs((time%4.8)-4.5)/.12);for(const {eye}of m.eyes)eye.scale.y=1-blink*.92;
  m.ears.forEach((ear,i)=>{ear.rotation.y=(i?1:-1)*Math.sin(time*(kind==='elephant'?1.5:2.2))*(kind==='elephant'?.2:.06);});
  m.tail.forEach((joint,i)=>{joint.rotation.y=Math.sin(time*(kind==='dog'?5:1.8)-i*.55)*(kind==='dog'?.22:.12);joint.rotation.x=kind==='cat'?-.13:kind==='elephant'||kind==='giraffe'?.2:.035;});
  if(m.trunk)m.trunk.rotation.x=Math.sin(time*1.4)*.12;m.jaw.rotation.x=kind==='dog'?.08+Math.sin(time*4)*.025:0;
  m.wings.forEach((wing,i)=>{const sign=i?1:-1;wing.rotation.y=sign*(.48+Math.sin(time*(moving?3.5:1.4))*(moving?.24:.06));wing.rotation.z=sign*Math.sin(time*1.4)*.05;});return true;
 }
 return {render,dispose(){for(const map of textures)map.dispose();root.removeFromParent();}};
}
