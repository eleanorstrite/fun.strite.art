import {CITY_ANIMALS} from './city-powers.js';
// Lazy, cached animal bodies share the renderer's material/geometry lifetime.
export function createCityShapeshift(T,scene,material,geo){
 const root=new T.Group();root.name='city-shapeshift';root.visible=false;scene.add(root);const models=new Map();let time=0;
 const sphere=geo('animal-sphere',()=>new T.SphereGeometry(1,24,16));
 function ball(parent,x,y,z,sx,sy,sz,color){const m=new T.Mesh(sphere,material('animal-'+color,{color,roughness:.65}));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;}
 function tube(parent,key,points,r,color){const m=new T.Mesh(geo(key,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,8,false)),material('animal-'+color,{color,roughness:.65}));m.castShadow=true;parent.add(m);return m;}
 function build(kind){
  const g=new T.Group();g.name='shapeshift-'+kind;root.add(g);const elephant=kind==='elephant',giraffe=kind==='giraffe',dragon=kind==='dragon',cat=kind==='cat',tiger=kind==='tiger',dog=kind==='dog';
  const fur=elephant?'#85827b':giraffe?'#dba35d':dragon?'#9f3329':tiger?'#d88b36':cat?'#99846d':'#302e2c',mark=cat?'#443a31':'#282321';
  const hip=giraffe?1.15:elephant?.85:.6,headY=giraffe?2.35:elephant?1.05:.92,headZ=elephant?.65:.58;
  ball(g,0,hip,0,elephant?.58:.32,elephant?.55:.29,elephant?.78:.6,fur);
  if(giraffe){const neck=ball(g,0,1.7,.42,.17,.7,.18,fur);neck.rotation.x=.18;}
  const head=new T.Group();head.position.set(0,headY,headZ);g.add(head);ball(head,0,0,0,elephant?.38:.24,elephant?.43:.24,elephant?.32:.23,fur);
  ball(head,0,-.09,.19,elephant?.2:.16,.12,dog||giraffe?.21:.12,elephant?fur:dog?'#b68b55':dragon?'#b74a30':'#e4cfaa');
  const legs=[],wings=[];for(const side of [-1,1]){
   ball(head,side*(elephant?.45:.19),elephant?.02:.2,-.02,elephant?.27:.085,elephant?.39:.12,.065,fur);ball(head,side*.105,.045,.205,.035,.04,.025,'#eee1ad');ball(head,side*.105,.045,.228,.013,.029,.009,'#202724');
   if(!elephant)ball(head,side*.09,-.105,.295,.045,.04,.025,'#3a2d2a');
   for(const z of [-.37,.35]){const leg=new T.Group();leg.position.set(side*(elephant?.36:.23),hip-.1,z);g.add(leg);ball(leg,0,-(hip-.1)/2,0,elephant?.16:.075,(hip-.1)/2,.085,fur);ball(leg,0,-hip+.18,.04,elephant?.18:.095,.09,elephant?.2:.14,dog?'#b68b55':fur);legs.push(leg);}
   if(elephant)tube(head,'elephant-tusk-'+side,[[side*.2,-.18,.2],[side*.23,-.4,.36],[side*.22,-.36,.57]],.035,'#f3e5be');
   if(giraffe||dragon){tube(head,kind+'-horn-'+side,[[side*.11,.16,0],[side*.14,.36,-.04],[side*.18,.4,-.1]],.025,giraffe?'#675039':'#e4c385');}
  }
  if(elephant)tube(head,'elephant-trunk',[[0,-.15,.22],[0,-.42,.35],[0,-.75,.45],[0,-.85,.62]],.095,fur);
  const tail=new T.Group();tail.position.set(0,hip,-.5);g.add(tail);tube(tail,kind+'-tail',[[0,0,0],[.12,-.04,-.25],[.2,.08,-.48],[.12,.16,-.63]],dragon?.065:.035,fur);
  if(tiger||cat){for(let i=0;i<12;i++){const z=-.45+i*.085;for(const side of [-1,1]){const stripe=ball(g,side*.285,hip+.07,z,.025,.22,.019,mark);stripe.rotation.x=(i%2?.2:-.2);}ball(g,0,hip+.285,z,.21,.015,.019,mark);}for(let i=0;i<4;i++){ball(head,(i%2?1:-1)*.17,.1-i*.035,.18,.05,.012,.016,mark);}}
  if(giraffe){for(let i=0;i<24;i++){const a=i*2.4;ball(g,Math.sin(a)*.32,hip+Math.cos(a)*.24,(i%6-2.5)*.17,.065,.065,.065,'#96592d');}for(let i=0;i<8;i++)for(const side of [-1,1])ball(g,side*.15,1.2+i*.13,.4,.012,.047,.07,'#96592d');}
  if(dog){ball(g,0,.61,.49,.2,.23,.05,'#ba8a53');for(const side of [-1,1])ball(head,side*.13,.105,.2,.055,.025,.015,'#b88751');}
  if(dragon){for(const side of [-1,1]){const wing=new T.Group();wing.position.set(side*.22,.85,-.1);g.add(wing);const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(side*.4,.75);shape.lineTo(side*1.25,.35);shape.lineTo(side*.85,.12);shape.lineTo(side*.65,-.2);shape.lineTo(side*.3,-.05);shape.closePath();const membrane=new T.Mesh(geo('dragon-wing-'+side,()=>new T.ShapeGeometry(shape)),material('animal-wing',{color:'#d16b40',roughness:.6,side:T.DoubleSide}));wing.add(membrane);for(const end of [[side*.4,.75,0],[side*1.25,.35,0],[side*.65,-.2,0]])tube(wing,'dragon-wing-bone-'+end.join(','),[[0,0,0],end],.024,'#742a24');wings.push(wing);}for(let i=0;i<8;i++)ball(g,0,.92,-.5+i*.1,.035,.1,.04,'#e3b46a');}
  if(cat)g.scale.setScalar(.72);if(giraffe)g.scale.setScalar(.9);g.userData.animal=kind;return {g,legs,tail,head,wings};
 }
 function render({mode,player,powers={},moving,interior,fire,dt}){time+=dt;const active=mode==='walk'&&!interior&&!fire&&powers.shapeshift>0&&CITY_ANIMALS.includes(powers.animal);root.visible=active;if(!active)return false;const kind=powers.animal;if(!models.has(kind))models.set(kind,build(kind));for(const [name,m]of models)m.g.visible=name===kind;const m=models.get(kind);root.position.set(player.x,.04+(player.altitude||0),player.z);root.rotation.y=player.angle||0;m.legs.forEach((leg,i)=>leg.rotation.x=moving?Math.sin(time*8+(i===0||i===3?0:Math.PI))*.45:0);m.tail.rotation.y=Math.sin(time*3)*.25;m.head.rotation.z=Math.sin(time*2)*.025;m.wings.forEach((w,i)=>w.rotation.y=(i?1:-1)*(.25+Math.sin(time*4)*.25));return true;}
 return {render,dispose(){root.removeFromParent();}};
}
