import * as T from './vendor/three/three.module.min.js';
// A continuous skinned surface bends across the joint instead of separating pieces.
export function createFourSquareLimb(parent,{upper,lower,radius,materials}){
 const length=upper+lower,radial=16,rows=24,geometry=new T.CylinderGeometry(1,1,length,radial,rows,false);geometry.translate(0,-length/2,0);
 const positions=geometry.attributes.position,indices=[],weights=[];
 for(let i=0;i<positions.count;i++){
  const y=positions.getY(i),t=Math.max(0,Math.min(1,-y/length)),r=radius*(1-.29*t+.04*Math.sin(t*Math.PI));positions.setXYZ(i,positions.getX(i)*r,y,positions.getZ(i)*r);
  const blend=Math.max(0,Math.min(1,(-y-upper+.055)/.11)),smooth=blend*blend*(3-2*blend);indices.push(0,1,0,0);weights.push(1-smooth,smooth,0,0);
 }
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.computeVertexNormals();
 // Cylinder indices run around the circumference first, not down the height.
 // Regroup complete triangles at one horizontal row so sleeves and shorts have clean hems.
 const cut=-length*Math.round(upper/length*rows)/rows,top=[],bottom=[];for(let i=0;i<geometry.index.count;i+=3){const triangle=[geometry.index.getX(i),geometry.index.getX(i+1),geometry.index.getX(i+2)],y=triangle.reduce((sum,n)=>sum+positions.getY(n),0)/3;(y>=cut-1e-6?top:bottom).push(...triangle);}geometry.setIndex([...top,...bottom]);geometry.clearGroups();geometry.addGroup(0,top.length,0);geometry.addGroup(top.length,bottom.length,1);

 const root=new T.Bone(),hinge=new T.Bone();hinge.position.y=-upper;root.add(hinge);const mesh=new T.SkinnedMesh(geometry,materials);mesh.name='continuous-limb';mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);mesh.add(root);mesh.bind(new T.Skeleton([root,hinge]));mesh.frustumCulled=false;
 return {mesh,hinge};
}
