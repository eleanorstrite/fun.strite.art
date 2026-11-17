"""Rigged, complete companions modeled from the approved three-babies reference.
Invoked by build-dragon-art.py --only-dragons. Game axes: x, height, forward.
"""
def build_companion(mature):
 clear();prefix='Adult' if mature else 'Baby'
 skinmat=material('DragonSkin','#5b91bf',.52);cream=material('DragonBelly','#efdbad',.65);edge=material('DragonBellyEdge','#d2ba86',.76)
 horn=material('DragonHorn','#e0c494',.5);claw=material('DragonClaw','#f1dfb9',.5);black=material('DragonPupil','#131b22',.12)
 iris=material('DragonIris','#96632d',.2);white=material('DragonEyeGlint','#fff8e6',.12);wingmat=material('DragonMembrane','#7598c2',.65)
 browmat=material('DragonBrow','#395570',.85);oral=material('DragonMouthInterior','#573944',.88);tonguemat=material('DragonTongue','#d28d98',.7)
 leather=material('DragonSaddle','#6f5039',.8)
 sy=.70;heady=1.65;headz=.30;eye_y=heady+.07;eye_z=headz+.47
 def orb(name,p,r,mat=None):
  bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=v(p));o=bpy.context.object;o.scale=(r[0],r[2],r[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,mat)
 def curve(points,steps=6):
  out=[]
  for i in range(len(points)-1):
   a=points[max(0,i-1)];b=points[i];c=points[i+1];d=points[min(len(points)-1,i+2)]
   for j in range(steps):
    t=j/steps;out.append(tuple(.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t) for k in range(3)))
  return out+[points[-1]]
 def curved_tube(name,points,radii,mat=None,sides=14):
  dense=curve(points);rs=[]
  for i in range(len(dense)):
   t=i/(len(dense)-1)*(len(radii)-1);j=min(len(radii)-2,int(t));f=t-j;rs.append(radii[j]*(1-f)+radii[j+1]*f)
  return tube(name,dense,rs,mat,sides)
 tail=curve([(0,.66,-.49),(.24,.42,-.96),(.85,.22,-1.12),(1.39,.18,-.65),(1.49,.19,.08),(1.25,.22,.63),(.89,.36,.62),(.79,.59,.37),(1.00,.69,.27),(1.18,.56,.37),(1.10,.45,.49),(.98,.48,.44)],5)
 tail_r=[.23*(1-i/(len(tail)-1))**.84+.010 for i in range(len(tail))]
 ti=[0,10,20,30,len(tail)-1]
 bones=[('Root',(0,0,0),(0,.3,0),None),('Spine',(0,.65,-.2),(0,1.15,.1),'Root'),('Neck',(0,1.08,.13),(0,1.43,.28),'Spine'),('Head',(0,1.43,.28),(0,1.72,.75),'Neck'),('Jaw',(0,1.39,.64),(0,1.34,.96),'Head')]
 for i in range(4):bones.append(('Tail'+str(i),tail[ti[i]],tail[ti[i+1]],'Spine' if i==0 else 'Tail'+str(i-1)))
 for side in [-1,1]:
  for rear in [False,True]:
   label=('L' if side<0 else 'R')+('Hind' if rear else 'Fore');z=-.35 if rear else .42
   hx,kx,px=(.43,.55,.53)if rear else(.33,.35,.35)
   bones.extend([(label+'Upper',(side*hx,sy,z),(side*kx,.43,z+(-.12 if rear else .12)),'Spine'),(label+'Lower',(side*kx,.43,z+(-.12 if rear else .12)),(side*px,.1,z+.28),label+'Upper')])
  label='LeftWing' if side<0 else 'RightWing'
  bones.extend([(label,(side*.39,1.08,-.13),(side*.88,1.65,-.22),'Spine'),(label+'Tip',(side*.88,1.65,-.22),(side*1.76,1.30,-.50),label)])
 arm=rig(prefix+'DragonRig',bones);segments=[(n,a,b)for n,a,b,p in bones if 'Wing' not in n and n!='Root'];tail_segments=[s for s in segments if s[0].startswith('Tail')]
 # A pear-shaped chest and compact haunches replace the long, low lizard torso.
 parts=[orb('RoundedChest',(0,.84,-.03),(.43,.64,.39)),orb('SoftHips',(0,.49,-.29),(.45,.38,.40)),orb('Shoulders',(0,1.10,.15),(.36,.40,.32))]
 parts.append(curved_tube('UprightNeck',[(0,.98,.13),(0,1.27,.20),(0,1.45,.32)],[.27,.25,.28]))
 for side in [-1,1]:parts.append(orb('SoftBrowPlane',(side*.24,heady+.12,headz+.33),(.22,.28,.23)))
 parts.extend([orb('Forehead',(0,heady+.04,headz+.08),(.50,.49,.45)),orb('Cheeks',(0,heady-.14,headz+.33),(.43,.205,.30)),orb('RoundedNose',(0,heady-.13,headz+.44),(.335,.18,.235))])
 parts.append(tube('CurledTail',tail,tail_r,None,16))
 for side in [-1,1]:
  for rear in [False,True]:
   z=-.35 if rear else .42;hx,kx,px=(.43,.55,.53)if rear else(.33,.35,.35)
   parts.extend([orb('Haunch' if rear else 'Forearm',(side*hx,.58,z),(.245,.30,.27) if rear else (.17,.26,.20)),curved_tube('ConnectedLimb',[(side*hx,.7,z),(side*kx,.43,z+(-.12 if rear else .12)),(side*px,.12,z+.28)],[.18,.13,.105]),orb('PlumpPaw',(side*px,.105,z+.34),(.205,.115,.22))])
   for j in range(4):parts.append(orb('RoundedToe',(side*px+(j-1.5)*.095,.10,z+.45),(.065,.078,.115)))
 body=fuse(prefix+'DragonBody',parts,skinmat,.026)
 def cut_shape(obj):
  bpy.context.view_layer.objects.active=body;m=body.modifiers.new('Sculpted recess','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=obj;bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(obj,do_unlink=True)
 # Small upturned smile and inset eyes, with rounded cheeks around the openings.
 mouth=[]
 for i in range(33):
  x=-.215+.43*i/32;mouth.append((x,heady-.25+.045*(x/.215)**2))
 for i in range(32,-1,-1):
  x=-.215+.43*i/32;mouth.append((x,heady-.32+.115*(abs(x)/.215)**1.8))
 verts=[tuple(v((x,y,z)))for z in [.78,1.12]for x,y in mouth];n=len(mouth);faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)]
 me=bpy.data.meshes.new('SmileRecess');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('SmileRecess',me);bpy.context.collection.objects.link(o)
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();cut_shape(o)
 for side in [-1,1]:cut_shape(orb('EyeSocket',(side*.27,eye_y,eye_z),(.140,.166,.155)))
 # Surface-space UVs keep fine pebbled scales consistent across the fused body.
 uv=body.data.uv_layers.active
 for face in body.data.polygons:
  axis=max(range(3),key=lambda i:abs(face.normal[i]));axes=[i for i in range(3)if i!=axis]
  for li in face.loop_indices:
   co=body.data.vertices[body.data.loops[li].vertex_index].co;uv.data[li].uv=(co[axes[0]],co[axes[1]])
 def ease(t):t=max(0,min(1,t));return t*t*(3-2*t)
 groups={n:body.vertex_groups.new(name=n)for n,a,b in segments}
 def distances(point,choices):
  out=[]
  for n,a,b in choices:
   aa=v(a);d=v(b)-aa;t=max(0,min(1,(point-aa).dot(d)/max(d.length_squared,1e-8)));out.append(((point-aa-d*t).length,n))
  return sorted(out)
 for vertex in body.data.vertices:
  point=body.matrix_world@vertex.co;x,y,z=point.x,point.z,-point.y
  jaw=ease((z-.79)/.12)*ease((1.45-y)/.12)*ease((y-1.22)/.12)
  head=ease((y-1.25)/.24)*(1-jaw);neck=(1-head-jaw)*ease((y-.94)/.30)
  td=distances(point,tail_segments);tail_weight=max(ease((x-.60)/.21),ease((-z-.56)/.25))*(1-ease((y-.90)/.3))*ease((.36-td[0][0])/.22)
  leg=(max(ease((abs(x)-.10)/.20),ease((z-.42)/.16))if z>.03 else ease((abs(x)-.24)/.21))*(1-ease((y-.65)/.25))*(1-tail_weight)
  base=(1-leg)*(1-tail_weight);values={'Head':head*base,'Jaw':jaw*base,'Neck':neck*base,'Spine':max(0,1-head-jaw-neck)*base}
  label=('L' if x<0 else 'R')+('Fore'if z>.03 else 'Hind');knee=ease((.56-y)/.21);values[label+'Upper']=leg*(1-knee);values[label+'Lower']=leg*knee
  weights=[math.exp(-d*16)for d,n in td[:2]];total=sum(weights)or 1
  for (d,n),w in zip(td[:2],weights):values[n]=values.get(n,0)+tail_weight*w/total
  total=sum(values.values())or 1
  for name,weight in values.items():
   if weight>1e-7:groups[name].add([vertex.index],weight/total,'REPLACE')
 mod=body.modifiers.new('Continuous anatomical skin','ARMATURE');mod.object=arm;body.parent=arm
 # Fit armor and brow details directly onto the fused skin, including the curved throat.
 from mathutils.bvhtree import BVHTree
 deps=bpy.context.evaluated_depsgraph_get();bvh=BVHTree.FromObject(body,deps);inverse=body.matrix_world.inverted()
 def front_surface(x,y):
  start=inverse@v((x,y,2.0));direction=(inverse.to_3x3()@v((0,0,-1))).normalized();hit=bvh.ray_cast(start,direction)
  return -(body.matrix_world@hit[0]).y if hit[0]is not None else .35
 # Individual, softly rounded belly scutes follow the upright chest.
 profile=[(.25,.22,.11),(.42,.32,.115),(.65,.377,.145),(.88,.382,.215),(1.10,.39,.205),(1.30,.445,.15),(1.43,.53,.115)]
 def breast(y):
  for i in range(1,len(profile)):
   if y<=profile[i][0]:
    a,b=profile[i-1],profile[i];t=(y-a[0])/(b[0]-a[0]);return (a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t)
  return profile[-1][1:]
 for band in range(9):
  low=.26+band*.128;high=min(1.43,low+.116);verts=[];faces=[]
  for row in range(5):
   t=row/4;y=low+(high-low)*t;z,w=breast(y)
   for j in range(17):
    u=j/16*2-1;yy=y+.018*u*u;zz=front_surface(w*u,yy)+.009+.012*math.sin(t*math.pi)*(1-u*u);verts.append(tuple(v((w*u,yy,zz))))
  for row in range(4):
   for j in range(16):a=row*17+j;faces.append((a,a+1,a+18,a+17))
  me=bpy.data.meshes.new('BellyScute');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('DragonBreast' if band==0 else 'DragonBellyPlate',me);bpy.context.collection.objects.link(o);finish(o,o.name,cream);skin(o,arm,segments,lambda n,p:n in ['Spine','Neck','Head'])
 # Round toes, tiny cream nails and paw pads, with four toes on each of four paws.
 for side in [-1,1]:
  for rear in [False,True]:
   label=('L'if side<0 else'R')+('Hind'if rear else'Fore');z=-.35 if rear else .42;px=.53 if rear else .35
   for j in range(4):
    x=side*px+(j-1.5)*.095;nail=orb('Claw',(x,.105,z+.535),(.034,.037,.057),claw);bind(nail,arm,label+'Lower')
   pad=orb('PawPad',(side*px,.035,z+.36),(.105,.014,.125),material('DragonPawPad'+label,'#cc8f90',.8));bind(pad,arm,label+'Lower')
 # Eyes, lids, cheek fins and swept ivory horns share the head bone.
 for side in [-1,1]:
  eye=orb(prefix+'Eye',(side*.27,eye_y,eye_z),(.126,.15,.061),cream);bind(eye,arm,'Head')
  eye=orb(prefix+'Iris',(side*.259,eye_y+.012,eye_z+.048),(.107,.13,.024),iris);bind(eye,arm,'Head')
  eye=orb(prefix+'Pupil',(side*.254,eye_y+.018,eye_z+.070),(.071,.096,.014),black);bind(eye,arm,'Head')
  for dx,dy,r in [(-.028,.045,.014),(.025,-.030,.005)]:
   o=orb(prefix+'Catchlight',(side*.254+dx,eye_y+.018+dy,eye_z+.087),(r,r,.005),white);bind(o,arm,'Head')
  nose=orb('Nostril',(side*.11,heady-.08,.963),(.022,.013,.007),black);nose.rotation_euler[1]=side*.18;bind(nose,arm,'Head')
  verts=[];faces=[];cols=32;rows=5
  for row in range(rows+1):
   t=row/rows
   for j in range(cols+1):
    a=j/cols*math.pi;verts.append(tuple(v((side*.27+(.13+.025*t)*math.cos(a),eye_y+(.135+.032*t)*math.sin(a),(eye_z+.090*math.sin(a))*(1-t**8)+front_surface(side*.27+(.13+.025*t)*math.cos(a),eye_y+(.135+.032*t)*math.sin(a))*t**8))))
  for row in range(rows):
   for j in range(cols):a=row*(cols+1)+j;faces.append((a,a+1,a+cols+2,a+cols+1))
  me=bpy.data.meshes.new('AttachedEyeLid');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('RelaxedEyeHood',me);bpy.context.collection.objects.link(o);finish(o,o.name,skinmat)
  bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();o.shape_key_add(name='Basis');closed=o.shape_key_add(name='Blink')
  for row in range(rows+1):
   t=row/rows
   for j in range(cols+1):
    a=j/cols*math.pi;closed.data[row*(cols+1)+j].co=v((side*.27+(.13+.025*t)*math.cos(a),eye_y+(-.15*(1-t)+.167*t)*math.sin(a),(eye_z+.102*math.sin(a))*(1-t**8)+front_surface(side*.27+(.13+.025*t)*math.cos(a),eye_y+(-.15*(1-t)+.167*t)*math.sin(a))*t**8))
  bind(o,arm,'Head')
  # Slim curved lid edges and a softly arched brow, not heavy raised tubes.
  for top in [True,False]:
   start,end=(0,math.pi)if top else(math.pi,math.tau);points=[]
   for j in range(33):
    a=start+(end-start)*j/32;points.append((side*.27+.13*math.cos(a),eye_y+(.135 if top else .15)*math.sin(a),eye_z+(.09*math.sin(a)if top else .002)))
   o=tube('GentleUpperLid'if top else'SoftLowerLid',points,[.010]*len(points),skinmat,12)
   if top:
    o.shape_key_add(name='Basis');closed=o.shape_key_add(name='Blink')
    for vertex in closed.data:
     q=vertex.co.copy();a=math.acos(max(-1,min(1,(q.x-side*.27)/.13)));q.z-=.285*math.sin(a);q.y-=.012*math.sin(a);vertex.co=q
   bind(o,arm,'Head')
  brow_points=[(side*x,eye_y+y,front_surface(side*x,eye_y+y)+.012)for x,y in[(.15,.21),(.23,.245),(.33,.225),(.40,.185)]]
  brow=curved_tube('FriendlyBrow',brow_points,[.006,.022,.020,.005],browmat);bind(brow,arm,'Head')
  points=[(side*.30,heady+.33,headz-.12),(side*.39,heady+.48,headz-.18),(side*.43,heady+.62,headz-.28),(side*.40,heady+.69,headz-.33)]
  o=curved_tube('SweptHorn',points,[.095,.070,.033,.006],horn,18);bind(o,arm,'Head')
  # A three-lobed cheek fan gives the blue, green and red dragons their little ears.
  fin_points=[(side*.42,heady+.10,headz+.02),(side*.69,heady+.20,headz-.04),(side*.57,heady+.015,headz-.03),(side*.71,heady-.07,headz-.09),(side*.52,heady-.13,headz-.03),(side*.59,heady-.23,headz-.15),(side*.38,heady-.18,headz+.08)]
  center=(side*.44,heady-.02,headz+.01);verts=[tuple(v(center))]+[tuple(v(q))for q in fin_points];faces=[(0,i+1,(i+1)%len(fin_points)+1)for i in range(len(fin_points))]
  me=bpy.data.meshes.new('SoftCheekFan');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('CheekFan',me);bpy.context.collection.objects.link(o);finish(o,o.name,wingmat);th=o.modifiers.new('Soft fin thickness','SOLIDIFY');th.thickness=.016;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=th.name);bind(o,arm,'Head')
  for tip in [1,3,5]:
   o=curved_tube('CheekFanRib',[center,fin_points[tip]],[.026,.006],skinmat,12);bind(o,arm,'Head')
 # A small scalloped crest follows the crown into the back, just like the image.
 for j in range(6):
  y=heady+[.48,.49,.49,.43,.33,.16][j];z=[.65,.48,.31,.14,-.03,-.12][j];o=curved_tube('SoftCrownSpine',[(0,y-.045,z),(0,y+.10,z-.055),(0,y+.13,z-.11)],[.070,.042,.006],skinmat);bind(o,arm,'Head')
 # Curved, scalloped bat wings with real membrane thickness and softly bent fingers.
 for side in [-1,1]:
  label='LeftWing'if side<0 else'RightWing';root=(side*.39,1.08,-.13);wrist=(side*.88,1.65,-.22)
  tips=[(side*1.76,1.30,-.50),(side*1.49,.84,-.63),(side*1.06,.68,-.65),(side*.56,.77,-.46)]
  edge_points=curve([root,wrist,tips[0]],8)
  for a,b in zip(tips,tips[1:]):
   for j in range(1,13):
    t=j/12;inset=math.sin(t*math.pi);edge_points.append(tuple(a[k]*(1-t)+b[k]*t+([-.14*side,.14,.06][k])*inset for k in range(3)))
  edge_points+=curve([tips[-1],(side*.42,.88,-.22),root],5)[1:]
  center=(side*.77,1.10,-.35);verts=[tuple(v(center))]+[tuple(v(q))for q in edge_points];faces=[(0,i+1,(i+1)%len(edge_points)+1)for i in range(len(edge_points))]
  me=bpy.data.meshes.new('SculptedWingMembrane');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(label+'Membrane',me);bpy.context.collection.objects.link(o);finish(o,o.name,wingmat);th=o.modifiers.new('Supple wing thickness','SOLIDIFY');th.thickness=.016;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=th.name);skin(o,arm,[s for s in [(n,a,b)for n,a,b,p in bones]if s[0]in[label,label+'Tip']])
  for tip in tips[:3]:
   o=curved_tube('WingFinger',[root,wrist,tip],[.048,.033,.006],skinmat,14);skin(o,arm,[s for s in [(n,a,b)for n,a,b,p in bones]if s[0]in[label,label+'Tip']])
 for i in range(4,len(tail)-3,5):
  p=tail[i];r=tail_r[i];o=curved_tube('TailCrest',[(p[0],p[1]+r*.85,p[2]),(p[0],p[1]+r+.085,p[2]-.025),(p[0],p[1]+r+.09,p[2]-.065)],[.045,.025,.005],skinmat);skin(o,arm,tail_segments)
 # The underside of the curled tail has a lighter, continuous belly stripe.
 verts=[];faces=[];last_down=Vector((0,-1,0))
 for i,p in enumerate(tail):
  tangent=(Vector(tail[min(len(tail)-1,i+1)])-Vector(tail[max(0,i-1)])).normalized();down=Vector((0,-1,0));down-=tangent*down.dot(tangent)
  if down.length<.15:down=last_down-tangent*last_down.dot(tangent)
  down.normalize()
  if down.dot(last_down)<0:down=-down
  last_down=down.copy();across=tangent.cross(down).normalized();r=tail_r[i]+.003
  for j in range(7):
   angle=(j/6-.5)*1.3;point=Vector(p)+(down*math.cos(angle)+across*math.sin(angle))*r;verts.append(tuple(v(point)))
 for i in range(len(tail)-1):
  for j in range(6):a=i*7+j;faces.append((a,a+1,a+8,a+7))
 me=bpy.data.meshes.new('TailBellyStripe');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('TailBellyStripe',me);bpy.context.collection.objects.link(o);finish(o,o.name,cream);skin(o,arm,tail_segments)
 # Closed, gentle smiles for the green and red reference poses; the blue baby smiles open.
 verts=[];faces=[]
 for row in range(9):
  t=row/8
  for j in range(33):
   x=-.215+.43*j/32;upper=heady-.25+.045*(x/.215)**2;lower=heady-.32+.115*(abs(x)/.215)**1.8;y=lower*(1-t)+upper*t
   z=.74+.235*math.sqrt(max(.02,1-(x/.335)**2-((y-(heady-.13))/.18)**2))+.006;verts.append(tuple(v((x,y,z))))
 for row in range(8):
  for j in range(32):a=row*33+j;faces.append((a,a+1,a+34,a+33))
 me=bpy.data.meshes.new('ReferenceClosedSmile');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('DragonSmileCover',me);bpy.context.collection.objects.link(o);finish(o,o.name,skinmat);bind(o,arm,'Head')
 points=[]
 for j in range(33):
  x=-.20+.40*j/32;y=heady-.25+.045*(x/.215)**2;z=.74+.235*math.sqrt(max(.02,1-(x/.335)**2-((y-(heady-.13))/.18)**2))+.012;points.append((x,y,z))
 o=tube('DragonSmileCrease',points,[.002+.003*math.sin(j/32*math.pi)for j in range(33)],oral,10);bind(o,arm,'Head')
 # The smile sits inside the muzzle; it never becomes an oversized floating grin.
 verts=[tuple(v((0,heady-.285,.83)))]+[tuple(v((x,y,.74+.235*math.sqrt(max(.02,1-(x/.335)**2-((y-(heady-.13))/.18)**2))-.008)))for x,y in mouth]
 faces=[(0,i+1,(i+1)%len(mouth)+1)for i in range(len(mouth))];me=bpy.data.meshes.new('SmileBowl');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('DragonHappyMouth',me);bpy.context.collection.objects.link(o);finish(o,o.name,oral);bind(o,arm,'Jaw')
 o=orb('DragonTongue',(0,heady-.295,.855),(.10,.022,.038),tonguemat);bind(o,arm,'Jaw')
 # The reference has a sweet smile rather than a row of exposed fangs.
 for side in [-1,1]:
  o=orb('DragonMilkTooth',(side*.137,heady-.23,.935),(.012,.017,.012),cream);bind(o,arm,'Head')
 saddle=orb('DragonSaddle',(0,1.52,-.1),(.30,.065,.31),leather);bind(saddle,arm,'Spine')
 arm['reference']='three-babies-reference.png';arm['design']='upright chest, rounded paws, swept horns, cheek fins, scalloped wings, curled tail'
 export('dragon-adult'if mature else'dragon-baby')
