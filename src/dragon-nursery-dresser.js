import * as T from './vendor/three/three.module.min.js';

export function createNurseryDresser(room,kit){
 const {box,cylinder,tube,mesh,geo,textures,solid,label}=kit,group=new T.Group();group.name='bedroom-dresser';group.position.set(-4.85,0,2);group.rotation.y=Math.PI/2;room.add(group);
 const oak=textures.wood,brass=solid('#b69a61',.3,.65),trim=solid('#755438',.8);
 box(group,0,.73,0,2.05,1.08,.88,oak);box(group,0,1.30,0,2.17,.11,1.0,textures.marble);box(group,0,.19,0,2.13,.09,.94,trim);
 for(const x of [-.85,.85])for(const z of [-.32,.32])cylinder(group,x,.12,z,.055,.22,trim);
 for(const x of [-.50,.50])for(const y of [.42,.75,1.08]){box(group,x,y,.465,.93,.285,.045,oak);for(const side of [-1,1])cylinder(group,x+side*.12,y,.51,.018,.035,brass);tube(group,[[x-.12,y,.525],[x,y-.025,.56],[x+.12,y,.525]],.016,brass);}
 box(group,0,.73,.485,.035,1.04,.025,trim);
 const mirror=mesh(group,geo('dresser-mirror',()=>new T.CircleGeometry(.51,64)),new T.MeshStandardMaterial({color:'#b9d4d4',metalness:.62,roughness:.2}),0,2.02,-.20);mirror.scale.set(1,1.16,1);
 const frame=mesh(group,geo('dresser-mirror-frame',()=>new T.TorusGeometry(.54,.035,12,64)),brass,0,2.02,-.18);frame.scale.y=1.16;
 for(const x of [-.38,.38])box(group,x,1.54,-.23,.035,.42,.07,trim);
 tube(group,[[-.23,2.26,-.165],[-.08,2.45,-.165]],.012,solid('#e8f3ec',.2));tube(group,[[.06,1.72,-.165],[.23,1.95,-.165]],.008,solid('#e8f3ec',.2));
 for(let i=0;i<3;i++)box(group,.65,1.39+i*.055,.10,.48,.05,.40,solid(['#7c96a7','#e5d6bb','#9c8195'][i],.95));
 cylinder(group,-.70,1.44,.10,.06,.20,solid('#9cb9b0',.25));box(group,-.70,1.56,.10,.075,.05,.075,brass);
 label(group,'DRESSER',0,2.90,-.17,2.15);
 return group;
}
