"""Rebuild original, rigged Dragon Adventures GLBs with Blender 5.x.
Run: blender -b --factory-startup --python tools/build-dragon-art.py -- assets/dragon-adventures/models
All coordinates below use game axes (x, height, forward), converted to Blender at creation.
No third-party character meshes or game artwork are used.
"""
import bpy, math, os, sys, random
from mathutils import Vector
OUT=os.path.abspath(sys.argv[sys.argv.index('--')+1])
os.makedirs(OUT,exist_ok=True)
random.seed(42)
def v(p): return Vector((p[0],-p[2],p[1]))
def clear():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for collection in [bpy.data.meshes,bpy.data.armatures,bpy.data.materials]:
  for item in list(collection):
   if item.users==0: collection.remove(item)
def material(name,hex,rough=.7,metal=0):
 rgb=[int(hex[i:i+2],16)/255 for i in (1,3,5)];c=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in rgb]
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 return m
def finish(o,name,mat=None):
 o.name=name
 if mat:o.data.materials.append(mat)
 if o.type=='MESH':
  for face in o.data.polygons:face.use_smooth=True
 return o
def ellipsoid(name,p,r,mat=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=v(p));o=bpy.context.object;o.scale=(r[0],r[2],r[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,mat)
def cube(name,p,size,mat,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=v(p));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  b=o.modifiers.new('Soft crafted edges','BEVEL');b.width=bevel;b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name)
 return finish(o,name,mat)
def tube(name,points,radii,mat,sides=12):
 pts=[v(p) for p in points];verts=[];faces=[]
 for i,p in enumerate(pts):
  tangent=(pts[min(i+1,len(pts)-1)]-pts[max(i-1,0)]).normalized();axis=tangent.cross(Vector((0,1,0)))
  if axis.length<.01:axis=tangent.cross(Vector((1,0,0)))
  axis.normalize();other=tangent.cross(axis).normalized()
  for j in range(sides):verts.append(tuple(p+(axis*math.cos(j*math.tau/sides)+other*math.sin(j*math.tau/sides))*radii[i]))
 for i in range(len(pts)-1):
  for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
 faces += [tuple(reversed(range(sides))),tuple((len(pts)-1)*sides+j for j in range(sides))]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);return finish(o,name,mat)
def loft(name,profiles,mat,sides=28):
 # Profiles: (height, half width, half depth, forward offset).
 verts=[];faces=[]
 for y,rx,rz,z in profiles:
  for j in range(sides):
   a=j*math.tau/sides;verts.append(tuple(v((math.cos(a)*rx,y,z+math.sin(a)*rz))))
 for i in range(len(profiles)-1):
  for j in range(sides):faces.append((i*sides+j,(i+1)*sides+j,(i+1)*sides+(j+1)%sides,i*sides+(j+1)%sides))
 faces.extend([tuple(range(sides)),tuple(reversed([(len(profiles)-1)*sides+j for j in range(sides)]))])
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);finish(o,name,mat)
 sub=o.modifiers.new('Tailored smooth surface','SUBSURF');sub.levels=1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sub.name);return o
def fuse(name,objects,mat,voxel=.04):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=name
 rem=o.modifiers.new('Continuous sculpted anatomy','REMESH');rem.mode='VOXEL';rem.voxel_size=voxel;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
 sm=o.modifiers.new('Sculpt polish','SMOOTH');sm.factor=1.1;sm.iterations=4;bpy.ops.object.modifier_apply(modifier=sm.name)
 o.data.materials.clear();o.data.materials.append(mat)
 for f in o.data.polygons:f.use_smooth=True
 # UVs are generated once offline, rather than stretching an egg texture across components.
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.0,island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
 return o
def rig(name,bones):
 a=bpy.data.armatures.new(name);o=bpy.data.objects.new(name,a);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
 for key,head,tail,parent in bones:
  b=a.edit_bones.new(key);b.head=v(head);b.tail=v(tail)
  if parent:b.parent=a.edit_bones[parent]
 bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False);return o
def bind(obj,arm,bone):
 g=obj.vertex_groups.new(name=bone);g.add(list(range(len(obj.data.vertices))),1,'REPLACE');m=obj.modifiers.new('Skeletal deformation','ARMATURE');m.object=arm;obj.parent=arm
 # Mesh locations remain authored game positions because the armature is at the origin.
def skin(obj,arm,segments,selector=None):
 groups={n:obj.vertex_groups.new(name=n) for n,a,b in segments}
 for vert in obj.data.vertices:
  p=obj.matrix_world@vert.co
  choices=[]
  for n,a,b in segments:
   if selector and not selector(n,p):continue
   aa,bb=v(a),v(b);d=bb-aa;t=max(0,min(1,(p-aa).dot(d)/max(d.length_squared,1e-8)));distance=(p-(aa+d*t)).length;choices.append((distance,n))
  choices.sort();choices=choices[:2]
  if not choices:continue
  # Sharp anatomical ownership away from joints; blended at knees and shoulders.
  values=[math.exp(-d*16) for d,n in choices];total=sum(values) or 1
  for (d,n),w in zip(choices,values):groups[n].add([vert.index],w/total,'REPLACE')
 m=obj.modifiers.new('Smooth skinning','ARMATURE');m.object=arm;obj.parent=arm

def export(name):
 for obj in list(bpy.context.scene.objects):
  if obj.type=='MESH' and not obj.data.uv_layers:
   bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
   bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.0,island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
 bpy.ops.object.select_all(action='DESELECT')
 for o in bpy.context.scene.objects:
  if o.type in ['MESH','ARMATURE']:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_animations=False,export_skins=True,export_yup=True,export_materials='EXPORT',export_extras=True)
 print('EXPORTED',name,flush=True)

def dragon(adult):
 clear();prefix='Adult' if adult else 'Baby';skinmat=material('DragonSkin','#9eaa91',.7);cream=material('DragonBelly','#f1dba5',.66);horn=material('DragonHorn','#cfbc90',.55);claw=material('DragonClaw','#c9c0a9',.55);black=material('DragonPupil','#101d22',.12);iris=material('DragonIris','#51412f',.24);white=material('DragonEyeGlint','#fff8df',.12);wingmat=material('DragonMembrane','#b99468',.8);leather=material('DragonSaddle','#66442b',.8)
 mature=adult;adult=False # Both ages keep the cover's rounded hatchling anatomy.
 sy=.7;heady=1.4;headz=.52
 bones=[('Root',(0,0,0),(0,.3,0),None),('Spine',(0,.7,-.3),(0,1.2,.5),'Root'),('Neck',(0,1.2,.45),(0,heady-.15,headz),'Spine'),('Head',(0,heady-.15,headz),(0,heady,headz+.5),'Neck')]
 for i in range(4):bones.append(('Tail'+str(i),(0,.85-i*.13,-.65-i*.62),(0,.72-i*.13,-1.27-i*.62),'Spine' if i==0 else 'Tail'+str(i-1)))
 for side in [-1,1]:
  for rear in [False,True]:
   label=('L' if side<0 else 'R')+('Hind' if rear else 'Fore');z=-.62 if rear else .46;hip=(side*.43,sy,z);knee=(side*.55,.43,z+(-.12 if rear else .12));toe=(side*.53,.1,z+.28);bones.extend([(label+'Upper',hip,knee,'Spine'),(label+'Lower',knee,toe,label+'Upper')])
  label='LeftWing' if side<0 else 'RightWing';bones.extend([(label,(side*.42,1.3 if adult else .95,-.1),(side*1.3,2 if adult else 1.6,-.2),'Spine'),(label+'Tip',(side*1.3,2 if adult else 1.6,-.2),(side*2.9,1.5,-.4),label)])
 arm=rig(prefix+'DragonRig',bones)
 parts=[ellipsoid('torso',(0,sy,0),(.5,.56 if adult else .45,.85 if adult else .63)),ellipsoid('hips',(0,sy-.05,-.55),(.44,.49,.45)),ellipsoid('shoulders',(0,sy+.13,.45),(.46,.48,.4))]
 neck=[(0,sy+.05,.4),(0,sy+.48,.65),(0,heady-.3,.65),(0,heady-.12,headz)];parts.append(tube('neck',neck,[.32,.27,.19,.23] if adult else [.29,.27,.27,.28],None,16))
 parts += [ellipsoid('cranium',(0,heady,headz),(.46,.40,.38)),ellipsoid('cheeks',(0,heady-.11,headz+.18),(.40,.24,.27)),ellipsoid('muzzle',(0,heady-.15,headz+.30),(.30,.18,.23))]
 tailpoints=[(0,.88,-.65),(.1,.76,-1.2),(.32,.54,-1.9),(.48,.34,-2.55),(.65,.39,-3.05)];parts.append(tube('tail',tailpoints,[.29,.23,.16,.09,.012],None,16))
 segments=[(n,h,t) for n,h,t,p in bones if not 'Wing' in n and n!='Root']
 for side in [-1,1]:
  for rear in [False,True]:
   z=-.62 if rear else .46;parts += [ellipsoid('thigh',(side*.43,sy-.12,z),(.22,.34 if adult else .26,.25)),tube('limb',[(side*.43,sy,z),(side*.55,.43,z+(-.12 if rear else .12)),(side*.53,.12,z+.28)],[.18,.12,.095],None),ellipsoid('paw',(side*.53,.1,z+.35),(.18,.11,.25))]
 body=fuse(prefix+'DragonBody',parts,skinmat,.047 if adult else .04)
 def region(n,p):
  x,y,z=p.x,p.z,-p.y
  if 'Fore' in n or 'Hind' in n:
   return abs(x)>.27 and ((x<0)==n.startswith('L')) and (('Hind' in n and z<-.15)or('Fore' in n and z>-.05)) and y<sy+.08
  if n.startswith('Tail'):return z<-.7
  if n=='Head':return y>heady-.48 and z>.38
  if n=='Neck':return z>.2 and y>sy+.15
  return n=='Spine'
 # World-sized UVs keep scales small and consistent across the fused surface.
 uv=body.data.uv_layers.active
 for face in body.data.polygons:
  axis=max(range(3),key=lambda i:abs(face.normal[i]))
  axes=[i for i in range(3) if i!=axis]
  for li in face.loop_indices:
   co=body.data.vertices[body.data.loops[li].vertex_index].co
   uv.data[li].uv=(co[axes[0]]*1.1,co[axes[1]]*1.1)
 skin(body,arm,segments,region)
 # A single shaped breastplate surface follows the neck rather than stacked white beads.
 verts=[];faces=[]
 profile=[(.4,.63,.19),(sy*.78,.82,.31),(sy+.2,.89,.27),(sy+.43,.94,.20),(heady-.32,headz+.18,.15)]
 for i,(y,z,width) in enumerate(profile):
  for j in range(13):
   a=(j/12-.5)*2;verts.append(tuple(v((a*width,y,z-.09*a*a))))
 for i in range(len(profile)-1):
  for j in range(12):a=i*13+j;faces.append((a,a+1,a+14,a+13))
 me=bpy.data.meshes.new('VentralArmor');me.from_pydata(verts,[],faces);me.update();chest=bpy.data.objects.new('DragonBreast',me);bpy.context.collection.objects.link(chest);finish(chest,chest.name,cream);skin(chest,arm,segments,lambda n,p:n in ['Spine','Neck','Head'])
 for side in [-1,1]:
  # Dark, fitted eyes with soft catchlights: no exposed staring white eyeballs.
  eye=ellipsoid(prefix+'Eye',(side*.265,heady+.09,headz+.322),(.128,.148,.022),black);bind(eye,arm,'Head')
  irisobj=ellipsoid('DragonIris',(side*.265,heady+.072,headz+.342),(.108,.119,.010),iris);bind(irisobj,arm,'Head')
  pupil=ellipsoid('DragonDarkPupil',(side*.265,heady+.09,headz+.351),(.099,.125,.009),black);bind(pupil,arm,'Head')
  glint=ellipsoid('EyeHighlight',(side*.245,heady+.14,headz+.364),(.023,.028,.005),white);bind(glint,arm,'Head')
  glint=ellipsoid('SmallEyeHighlight',(side*.292,heady+.045,headz+.361),(.009,.011,.004),white);bind(glint,arm,'Head')
  nostril=ellipsoid('Nostril',(side*.085,heady-.085,headz+.518),(.012,.007,.004),black);bind(nostril,arm,'Head')
  # Relaxed upper lids follow an even arc rather than forming an angry brow.
  lid=tube('GentleUpperLid',[(side*.145,heady+.15,headz+.30),(side*.215,heady+.235,headz+.32),(side*.29,heady+.24,headz+.32),(side*.38,heady+.16,headz+.27)],[.009,.014,.014,.009],skinmat,12);bind(lid,arm,'Head')
  hornobj=tube('SweptHorn',[(side*.2,heady+.16,headz-.1),(side*.29,heady+.36,headz-.22),(side*.31,heady+.48,headz-.35)],[.075,.045,.012],horn,16);bind(hornobj,arm,'Head')
  for i in range(2):
   fin=tube('CheekSpine',[(side*.30,heady+.03-i*.07,headz-.08-i*.07),(side*.43,heady+.08-i*.05,headz-.24-i*.08)],[.05,.012],horn,12);bind(fin,arm,'Head')
  for rear in [False,True]:
   label=('L' if side<0 else 'R')+('Hind' if rear else 'Fore');z=-.62 if rear else .46
   for i in [-1,0,1]:
    nail=tube('Claw',[(side*.53+i*.105,.11,z+.49),(side*.53+i*.105,.06,z+.64)],[.035,.002],claw,8);bind(nail,arm,label+'Lower')
  label='LeftWing' if side<0 else 'RightWing';reach=1.2 if adult else .9
  # A curved membrane with scalloped trailing edges, triangulated into an actual wing skin.
  wingpoints=[(side*.42,1.3 if adult else .95,-.1),(side*1.12*reach,2.22 if adult else 1.8,-.15),(side*2.65*reach,1.56,-.45),(side*1.83*reach,1.15,-.73),(side*1.15*reach,.83,-.95),(side*.46,.83,-.64)]
  boundary=[wingpoints[0],wingpoints[1],wingpoints[2]]
  for a,b in zip(wingpoints[2:],wingpoints[3:]):
   for step in range(1,9):
    t=step/8;mid=tuple(a[k]*(1-t)+b[k]*t for k in range(3));inset=math.sin(t*math.pi)*.16
    boundary.append((mid[0]*(1-inset),mid[1]+inset*.4,mid[2]+inset*.5))
  center=(side*.9*reach,1.35,-.38);verts=[tuple(v(center))]+[tuple(v(p)) for p in boundary];faces=[(0,i+1,(i+1)%len(boundary)+1) for i in range(len(boundary))]
  me=bpy.data.meshes.new('WingMembrane');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(label+'Membrane',me);bpy.context.collection.objects.link(o);finish(o,o.name,wingmat);m=o.modifiers.new('Membrane thickness','SOLIDIFY');m.thickness=.012;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name);skin(o,arm,[(n,h,t)for n,h,t,p in bones if n in [label,label+'Tip']])
  for j in [2,3,4]:
   finger=tube('WingFinger',[wingpoints[0],wingpoints[1],wingpoints[j]],[.055,.035,.006],skinmat);skin(finger,arm,[(n,h,t)for n,h,t,p in bones if n in [label,label+'Tip']])
 # A quiet closed smile, like the reference, instead of an open mouth and pointed teeth.
 mouthmat=material('DragonSmile','#594936',.78)
 mouth=tube('HappySmile',[(-.14,heady-.185,headz+.493),(-.08,heady-.205,headz+.522),(0,heady-.213,headz+.535),(.08,heady-.205,headz+.522),(.14,heady-.185,headz+.493)],[.0025,.004,.004,.004,.0025],mouthmat,10);bind(mouth,arm,'Head')
 for i in range(10):
  z=.2-i*.21;y=sy+.51-max(0,i-3)*.028;spine=tube('DorsalSpine',[(0,y,z),(0,y+.23,z-.12)],[.075,.002],horn,8);bind(spine,arm,'Spine' if i<5 else 'Tail0')
 saddle=ellipsoid('DragonSaddle',(0,1.65 if adult else 1.32,-.1),(.31,.07,.33),leather);bind(saddle,arm,'Spine')
 export('dragon-adult' if mature else 'dragon-baby')

def keeper():
 import runpy
 runpy.run_path(os.path.join(os.path.dirname(__file__),'build-dragon-keeper.py'),init_globals=globals())['build_keeper']()

def cottage():
 clear();plaster=material('LimePlaster','#e0cfad',.93);wood=material('CottageOak','#69462d',.86);stone=material('CottageStone','#a69b85',.94);roof=material('CottageSlate','#9db5cf',.84);gold=material('Brass','#b7934d',.35,.6);green=material('CottageLeaves','#4d733a',.9);purple=material('WisteriaFlowers','#9c70c3',.88);pink=material('GardenPink','#d18b9b',.9);cream=material('FlowerCenters','#f3dca0',.9)
 glow=material('CottageWindowGlow','#ffb342',.4);shader=glow.node_tree.nodes.get('Principled BSDF');shader.inputs['Emission Color'].default_value=glow.diffuse_color;shader.inputs['Emission Strength'].default_value=.8
 cube('CottageBody',(0,1.8,-7),(8,3.6,6),plaster,.08)
 # A broad front-facing slate roof and projecting left gable reproduce the cover silhouette.
 for side in [-1,1]:
  for row in range(9):
   for col in range(19):
    x=-4.3+col*.48;z=-7+side*(.14+row*.42);y=6.35-abs(z+7)*.75;o=cube('MainRoofSlate',(x,y,z),(.55,.075,.49),roof,.019);o.rotation_euler[0]=side*math.atan(.75)
  tube('MainRoofEave',[(-4.6,3.65,-7+side*3.6),(4.6,3.65,-7+side*3.6)],[.095,.095],wood)
 for x in [-4.02,4.02]:
  me=bpy.data.meshes.new('SideGable');me.from_pydata([tuple(v(q)) for q in [(x,3.6,-10.0),(x,3.6,-4),(x,6.35,-7)]],[],[(0,1,2)]);me.update();o=bpy.data.objects.new('SideGable',me);bpy.context.collection.objects.link(o);finish(o,o.name,plaster)
 for side in [-1,1]:
  for row in range(10):
   for j in range(5):
    x=-2+side*(j*.34+.12);z=-7.5+row*.45;y=6.45-abs(x+2)*1.35;o=cube('FrontGableSlate',(x,y,z),(.4,.07,.53),roof,.018);o.rotation_euler[1]=side*math.atan(1.35)
  tube('FrontGableBargeboard',[(-2+side*1.8,3.95,-3.27),(-2,6.55,-3.27)],[.085,.085],wood)
  cube('CornerTimber',(side*3.94,1.85,-3.95),(.16,3.7,.17),wood,.018)
 me=bpy.data.meshes.new('FrontGable');me.from_pydata([tuple(v(q)) for q in [(-3.7,3.6,-3.4),(-.3,3.6,-3.4),(-2,6.45,-3.4)]],[],[(0,1,2)]);me.update();o=bpy.data.objects.new('FrontGable',me);bpy.context.collection.objects.link(o);finish(o,o.name,plaster)
 # The small second gable echoes the cottage on the illustrated game cover.
 cube('DormerBody',(2,4.45,-4.0),(1.8,1.7,.5),plaster,.035)
 me=bpy.data.meshes.new('DormerGable');me.from_pydata([tuple(v(q)) for q in [(1.05,5.2,-3.7),(2.95,5.2,-3.7),(2,6.0,-3.7)]],[],[(0,1,2)]);me.update();o=bpy.data.objects.new('DormerGable',me);bpy.context.collection.objects.link(o);finish(o,o.name,plaster)
 for side in [-1,1]:
  for row in range(5):
   for j in range(3):
    x=2+side*(j*.35+.08);o=cube('DormerSlate',(x,6.0-abs(x-2)*.85,-4.45+row*.2),(.4,.06,.27),roof,.014);o.rotation_euler[1]=side*.70
  tube('DormerFrame',[(2+side*1.08,5.08,-3.62),(2,6.08,-3.62)],[.065,.065],wood)
 for x in range(-7,8):
  for row in range(2):
   xx=x*.53+(row%2)*.25
   if abs(xx)<.86:continue
   cube('FoundationStone',(xx,.16+row*.26,-3.99),(.5,.24,.18),stone,.035)
 def arch(name,x,bottom,z,w,h,mat):
  r=w/2;points=[(x-r,bottom,z),(x+r,bottom,z)]+[(x+math.cos(i*math.pi/24)*r,bottom+h-r+math.sin(i*math.pi/24)*r,z) for i in range(25)]
  me=bpy.data.meshes.new(name);me.from_pydata([tuple(v(q)) for q in points],[],[tuple(range(len(points)))]);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);finish(o,name,mat);return points
 def window(name,x,bottom,z,w,h):
  arch(name+'Recess',x,bottom-.07,z-.025,w+.18,h+.17,wood);outline=arch(name+'WarmGlass',x,bottom,z,w,h,glow);tube(name+'ArchFrame',outline+[outline[0]],[.046]*(len(outline)+1),wood,8)
  r=w/2
  for direction in [-1,1]:
   for line in range(-5,8):
    points=[]
    for i in range(50):
     xx=-r+.04+i*(w-.08)/49;yy=bottom+.12+line*.26+direction*xx*1.2;top=bottom+h-r+math.sqrt(max(0,r*r-xx*xx))
     if bottom+.03<yy<top-.035:points.append((x+xx,yy,z+.025))
    if len(points)>1:tube(name+'DiamondLead',[points[0],points[-1]],[.012,.012],wood,6)
 window('LeftArchedWindow',-2.55,.98,-3.87,1.7,1.94);window('RightArchedWindow',2.55,.98,-3.87,1.7,1.94)
 window('UpperGableWindow',-2,4.35,-3.3,.85,1.28);window('DormerArchedWindow',2,4.0,-3.65,.83,1.3)
 # Arched plank door with a small lit window and a brass handle.
 door=arch('ArchedDoor',0,.035,-3.84,1.56,2.7,wood);tube('ArchedDoorFrame',door+[door[0]],[.085]*(len(door)+1),wood)
 for j in range(7):
  x=(j-3)*.205;top=2.7-.78+math.sqrt(max(0,.78*.78-x*x));cube('DoorPlank',(x,top/2,-3.8),(.193,top,.065),wood,.009)
 window('DoorGlass',0,1.65,-3.74,.65,.82);ellipsoid('BrassDoorHandle',(.52,1.15,-3.69),(.055,.055,.04),gold)
 # Low stone steps and a tiled entrance canopy keep the existing doorway clear.
 for i in range(3):cube('EntranceStep',(0,.035+i*.035,-2.72-i*.34),(2.2-i*.12,.09+i*.025,.7),stone,.025)
 for side in [-1,1]:
  cube('PorchPost',(side*1.3,1.45,-2.92),(.13,2.9,.13),wood,.018)
  for row in range(5):
   for j in range(4):
    x=side*(j*.36+.12);o=cube('PorchSlate',(x,3.54-abs(x)*.36,-3.97+row*.27),(.41,.065,.34),roof,.016);o.rotation_euler[1]=side*.345
  tube('PorchBargeboard',[(side*1.55,2.97,-2.75),(0,3.57,-2.75)],[.07,.07],wood)
  x=side*1.03;cube('LanternGlow',(x,2.15,-3.5),(.22,.36,.2),glow,.025)
  for dx in [-.13,.13]:cube('LanternFrame',(x+dx,2.15,-3.5),(.024,.4,.25),gold,.006)
  for y in [1.93,2.36]:cube('LanternCap',(x,y,-3.5),(.3,.055,.29),gold,.012)
  tube('LanternHook',[(x,2.48,-3.85),(x,2.52,-3.5),(x,2.37,-3.5)],[.025,.025,.02],gold)
 # Climbing ivy and hanging purple wisteria are lightweight joined surface meshes.
 leaves=[];leaf_faces=[];flowers={};flower_faces={}
 def leaf(x,y,z,r=.14):
  start=len(leaves);a=random.random()*math.tau
  for xx,yy,zz in [(0,r,0),(r*.6,0,0),(0,-r,0),(-r*.6,0,0),(0,0,.035)]:leaves.append(tuple(v((x+xx*math.cos(a)-yy*math.sin(a),y+xx*math.sin(a)+yy*math.cos(a),z+zz))))
  leaf_faces.extend([(start+4,start+j,start+(j+1)%4)for j in range(4)])
 def blossom(key,x,y,z,r):
  verts=flowers.setdefault(key,[]);faces=flower_faces.setdefault(key,[]);start=len(verts);verts.append(tuple(v((x,y,z+.025))))
  for j in range(10):
   a=j*math.tau/10;rad=r if j%2==0 else r*.47;verts.append(tuple(v((x+math.cos(a)*rad,y+math.sin(a)*rad,z))))
  faces.extend([(start,start+1+j,start+1+(j+1)%10)for j in range(10)])
 for side in [-1,1]:
  for i in range(70):
   y=.3+i*.06;x=side*3.82+math.sin(y*3)*.14;leaf(x,y,-3.72,.13+random.random()*.07)
  for j in range(12):
   x=side*(1.4+j*.21);length=.45+random.random()*1.0;y=3.55+math.sin(j)*.12
   tube('WisteriaStem',[(x,y,-3.58),(x+.06,y-length,-3.55)],[.016,.005],green,6)
   for i in range(12):
    yy=y-i/12*length;leaf(x+math.sin(i*2.4)*.12,yy,-3.5,.09)
    if i>2:blossom('purple',x+math.sin(i*2.4)*.10,yy,-3.42,.105*(1-i/18))
  for j in range(32):
   x=side*2.6+random.uniform(-.9,.9);z=random.uniform(-3.7,-3.1);y=.28+random.random()*.6;tube('GardenFlowerStem',[(x,.12,z),(x,y,z)],[.012,.008],green,5);leaf(x,y*.65,z,.11);blossom('pink' if j%3 else 'cream',x,y,z,.09)
 for j in range(55):
  x=-3.8+j*.14;y=3.44+math.sin(j*.7)*.12;leaf(x,y,-3.48,.18)
 for key,verts,faces,mat in [('ClimbingIvy',leaves,leaf_faces,green)]+[(key,flowers[key],flower_faces[key],{'purple':purple,'pink':pink,'cream':cream}[key])for key in flowers]:
  me=bpy.data.meshes.new(key);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(key,me);bpy.context.collection.objects.link(o);finish(o,key,mat)
 for row in range(9):
  for i in range(3):cube('TallStoneChimney',(-.6+(i-1)*.28,4.5+row*.31,-8.2),(.27,.29,.85),stone,.025)
 cube('ChimneyCap',(-.6,7.2,-8.2),(1.05,.17,1.03),stone,.04)
 bathmat=material('GardenMarble','#d9d3bf',.4);watermat=material('GardenWater','#6fabb0',.14,.1)
 bath=cube('CarvedDragonBath',(7,.42,-1),(2.7,.84,1.9),bathmat,.12)
 cutter=cube('BathOpening',(7,.67,-1),(2.35,.9,1.55),bathmat,.16);bpy.context.view_layer.objects.active=bath;cut=bath.modifiers.new('Hollow stone bath','BOOLEAN');cut.operation='DIFFERENCE';cut.object=cutter;bpy.ops.object.modifier_apply(modifier=cut.name);bpy.data.objects.remove(cutter,do_unlink=True)
 cube('BathWater',(7,.53,-1),(2.32,.02,1.51),watermat,.02)
 tube('GardenFaucet',[(8,.78,-1.7),(8,1.48,-1.7),(7.7,1.57,-1.7)],[.036,.036,.036],gold)
 cube('GardenTableTop',(6,.72,3),(1.8,.12,1.5),wood,.045)
 for side in [-1,1]:
  for z in [2.47,3.53]:cube('GardenTableLeg',(6+side*.67,.34,z),(.13,.68,.13),wood,.012)
 export('cottage')

def room():
 clear();oak=material('RoomOak','#a7835d',.89);linen=material('RoomLinen','#ddd4bf',.95);plaster=material('RoomPlaster','#e1d9c8',.94);marble=material('RoomMarble','#e6e1d6',.35);brass=material('RoomBrass','#b39b68',.35,.6);steel=material('RoomSteel','#a5b5b2',.28,.45);glass=material('RoomGlass','#9ab7bb',.18,.3)
 for i in range(22):cube('Floorboard',(-5.75+i*.55,-.035,0),(.535,.07,10),oak,.008)
 cube('BackWall',(0,1.7,-5),(12,3.4,.16),plaster,.035);cube('SideWall',(-6,1.7,0),(.16,3.4,10),plaster,.035);cube('BathroomWall',(6,1.7,-2),(.16,3.4,6),marble,.025)
 cube('BedFrame',(-3,.47,-2),(2.7,.7,4.2),oak,.07);cube('UpholsteredHeadboard',(-3,1.4,-4.1),(2.9,1.85,.22),linen,.1);cube('Mattress',(-3,.94,-2),(2.65,.3,4.15),linen,.13)
 # A continuous draped quilt with stitched, softly wrinkled fabric and hanging sides.
 verts=[];faces=[];nx,nz=35,42
 for i in range(nx):
  x=-4.42+i*2.84/(nx-1)
  for j in range(nz):
   z=-3.1+j*3.35/(nz-1);edge=max(0,abs(x+3)-1.15);y=1.14-edge*1.8+math.sin(i*.62+j*.48)*.018+math.sin(j*.7)*.012;verts.append(tuple(v((x,y,z))))
 for i in range(nx-1):
  for j in range(nz-1):a=i*nz+j;faces.append((a,a+nz,a+nz+1,a+1))
 me=bpy.data.meshes.new('DrapedQuilt');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('DrapedQuilt',me);bpy.context.collection.objects.link(o);finish(o,o.name,linen)
 for x in [-3.65,-2.35]:o=ellipsoid('LinenPillow',(x,1.19,-3.5),(.58,.15,.38),linen)
 for x in [-4.9,-1.0]:
  cube('BedsideCabinet',(x,.6,-3.35),(.8,1.15,.85),oak,.045);cube('DrawerFront',(x,.86,-2.9),(.7,.32,.05),oak,.012);cube('DrawerPull',(x,.86,-2.85),(.18,.025,.035),brass,.006);tube('LampStem',[(x,1.2,-3.35),(x,1.75,-3.35)],[.028,.028],brass)
  shade=loft('LinenLampshade',[(1.64,.28,.28,-3.35),(2.02,.17,.17,-3.35)],linen)
  # Loft profiles are x-centered; translate to the cabinet.
  shade.location.x=x
 cube('Window',(0,2,-4.87),(2.65,2.2,.05),glass,.015)
 for side in [-1,1]:
  verts=[];faces=[]
  for i in range(18):
   for j in range(24):verts.append(tuple(v((side*1.6+(i/17-.5)*.58,3.2-j/23*3.0,-4.63+math.sin(i*math.pi/2)*.04))))
  for i in range(17):
   for j in range(23):a=i*24+j;faces.append((a,a+24,a+25,a+1))
  me=bpy.data.meshes.new('Curtain');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('WovenCurtain',me);bpy.context.collection.objects.link(o);finish(o,o.name,linen)
 cube('Vanity',(4,.63,-3.55),(2.8,1.25,1.0),oak,.045);counter=cube('StoneCounter',(4,1.31,-3.55),(2.94,.14,1.12),marble,.04)
 hole=ellipsoid('BasinCutout',(4,1.39,-3.4),(.58,.3,.3));bpy.context.view_layer.objects.active=counter;cut=counter.modifiers.new('Recessed basin opening','BOOLEAN');cut.operation='DIFFERENCE';cut.object=hole;bpy.ops.object.modifier_apply(modifier=cut.name);bpy.data.objects.remove(hole,do_unlink=True)
 # Recessed washbasin: visible inner bowl rather than a flattened sphere laid on a cube.
 verts=[];faces=[]
 for ring,(rx,rz,y) in enumerate([(.67,.37,1.4),(.57,.29,1.38),(.35,.16,1.2),(.08,.05,1.17)]):
  for i in range(40):a=i*math.tau/40;verts.append(tuple(v((4+math.cos(a)*rx,y,-3.4+math.sin(a)*rz))))
 for ring in range(3):
  for i in range(40):a=ring*40+i;b=ring*40+(i+1)%40;faces.append((a,b,b+40,a+40))
 me=bpy.data.meshes.new('Basin');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('InsetWashbasin',me);bpy.context.collection.objects.link(o);finish(o,o.name,marble)
 tube('BrassFaucet',[(4.75,1.39,-3.9),(4.75,1.72,-3.9),(4.5,1.75,-3.9)],[.028,.028,.028],brass)
 tube('MirrorFrame',[(4+math.cos(i*math.tau/64)*.81,2.38+math.sin(i*math.tau/64)*.81,-4.83)for i in range(65)],[.025]*65,brass,8);cube('Mirror',(4,2.38,-4.87),(1.48,1.5,.03),steel,.15)
 cube('FridgeBody',(4.6,1.28,1.1),(1.6,2.56,1.35),linen,.085)
 for y,h in [(2.02,.92),(.85,1.34)]:cube('FridgeDoor',(4.6,y,1.81),(1.54,h,.1),steel,.045);cube('FridgeHandle',(5.12,y,1.94),(.04,h*.42,.08),brass,.013)
 export('house-room')

def tree():
 clear();bark=material('ForestBark','#685442',.94);green=material('PineNeedles','#426447',.94);brown=material('PineTips','#638056',.94)
 tube('TaperedTrunk',[(0,0,0),(0,2.2,0),(.08,4.6,0)],[.21,.13,.015],bark,12)
 verts=[];faces=[]
 for ring in range(9):
  y=1.0+ring*.37;reach=1.7-ring*.15
  for branch in range(7):
   a=branch*math.tau/7+ring*.7;end=(math.cos(a)*reach,y+.13,math.sin(a)*reach);tube('Bough',[(0,y,0),end],[.04,.009],bark,7)
   for i in range(50):
    t=(i+.5)/50;cx=math.cos(a)*reach*t;cz=math.sin(a)*reach*t;cy=y+.13*t;spread=(1-t)*.35+.08;side=random.uniform(-1,1)*spread;length=random.uniform(.25,.6);p=(cx+math.cos(a+math.pi/2)*side,cy,cz+math.sin(a+math.pi/2)*side);idx=len(verts);verts += [tuple(v((p[0]-.065,p[1],p[2]))),tuple(v((p[0]+.065,p[1],p[2]))),tuple(v((p[0]+math.cos(a+side)*length,p[1]+random.uniform(.08,.22),p[2]+math.sin(a+side)*length)))];faces.append((idx,idx+1,idx+2))
 me=bpy.data.meshes.new('NeedleBranches');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('NeedleBranches',me);bpy.context.collection.objects.link(o);finish(o,o.name,green)
 # Backface culling stays off for the small foliage blades.
 green.use_backface_culling=False
 export('forest-tree')

jobs=[lambda:dragon(False),lambda:dragon(True)] if '--only-dragons' in sys.argv else [keeper] if '--only-keeper' in sys.argv else [cottage] if '--only-cottage' in sys.argv else [keeper,lambda:dragon(False),lambda:dragon(True),cottage,room,tree]
for job in jobs:job()
print('All original Dragon Adventures art assets rebuilt.',flush=True)
