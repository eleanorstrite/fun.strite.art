"""Original fantasy-adventure keeper: sculpted face, strand hair and skinned wardrobes.
Loaded by build-dragon-art.py, which supplies the shared Blender mesh helpers.
Rebuild only this asset with --only-keeper after the output folder.
"""
def build_keeper():
 clear()
 skinmat=material('KeeperSkin','#c89b7f',.57);hair=material('KeeperHair','#493024',.47)
 facemat=material('KeeperFaceSkin','#c89b7f',.61)
 cloth=material('KeeperCloth','#71855d',.88);pants=material('KeeperTrousers','#344859',.92)
 accent=material('KeeperAccent','#d9bd7d',.69);linen=material('KeeperLinen','#efe4ce',.86)
 leather=material('KeeperLeather','#503d30',.74);gold=material('KeeperMetal','#b69b58',.35,.62)
 white=material('KeeperEyeWhite','#eee5db',.31);iris=material('KeeperIris','#6d8262',.29)
 dark=material('KeeperPupil','#182327',.24);glint=material('KeeperEyeGlint','#fff8ef',.14)
 lipmat=material('KeeperLips','#9e695b',.62);inner=material('KeeperSkinShade','#aa7965',.71)
 sole=material('KeeperSole','#2c3031',.88)
 bones=[('Root',(0,0,0),(0,.25,0),None),('Hips',(0,.96,0),(0,1.12,0),'Root'),('Spine',(0,1.12,0),(0,1.57,0),'Hips'),('Head',(0,1.64,0),(0,1.97,0),'Spine')]
 for side in [-1,1]:
  name='Left' if side<0 else 'Right';bones += [(name+'Arm',(side*.26,1.51,0),(side*.3,1.18,0),'Spine'),(name+'Forearm',(side*.3,1.18,0),(side*.31,.86,.025),name+'Arm'),(name+'Thigh',(side*.12,1.0,0),(side*.13,.55,0),'Hips'),(name+'Shin',(side*.13,.55,0),(side*.13,.08,.04),name+'Thigh')]
 arm=rig('KeeperRig',bones);segments=[(n,h,t) for n,h,t,p in bones if n!='Root']
 def attach(o,bone='Spine'):bind(o,arm,bone);return o
 def garment_skin(o,arms=False):
  # One continuous set of weights across seams. Skirts and coat hems follow the pelvis,
  # never separate left/right legs; sleeves blend into the shoulders without a hard cut.
  groups={name:o.vertex_groups.new(name=name) for name in ['Hips','Spine','LeftArm','RightArm','LeftForearm','RightForearm']}
  def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
  for vert in o.data.vertices:
   p=o.matrix_world@vert.co;x,y=p.x,p.z;side='Left' if x<0 else 'Right'
   arm_weight=smooth((abs(x)-.19)/.11)*smooth((1.60-y)/.12) if arms else 0
   elbow=smooth((1.29-y)/.21);spine=smooth((y-1.07)/.36)
   values={'Hips':(1-arm_weight)*(1-spine),'Spine':(1-arm_weight)*spine,side+'Arm':arm_weight*(1-elbow),side+'Forearm':arm_weight*elbow}
   for name,weight in values.items():
    if weight>0:groups[name].add([vert.index],weight,'REPLACE')
  mod=o.modifiers.new('Continuous garment deformation','ARMATURE');mod.object=arm;o.parent=arm;return o
 def merge(name,parts):
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=name;return o
 def smooth_path(points,steps=5):
  out=[]
  for i in range(len(points)-1):
   a,b,c,d=[Vector(points[max(0,min(len(points)-1,j))]) for j in [i-1,i,i+1,i+2]]
   for j in range(steps):
    t=j/steps;out.append(tuple(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)))
  return out+[points[-1]]
 def lock(points,width=.04,depth=.018,taper=True,mat=hair):
  pts=smooth_path(points,4 if len(points)<6 else 1);verts=[];faces=[];count=len(pts);sides=12;depth=min(depth,.014) if mat==hair else depth
  for i,p in enumerate(pts):
   q=v(p);tangent=(v(pts[min(i+1,count-1)])-v(pts[max(0,i-1)])).normalized();axis=Vector((1,0,0))-tangent*tangent.x
   if axis.length<.05:axis=Vector((0,1,0))-tangent*tangent.y
   axis.normalize();other=tangent.cross(axis).normalized();u=i/(count-1);scale=max(.025,(1-u)**.48) if taper else .85+.15*math.sin(u*math.pi)
   for j in range(sides):
    a=j*math.tau/sides;ridge=1+.018*math.cos(a*10);verts.append(tuple(q+scale*ridge*(axis*math.cos(a)*width+other*math.sin(a)*depth)))
  for i in range(count-1):
   for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
  faces += [tuple(reversed(range(sides))),tuple((count-1)*sides+j for j in range(sides))]
  me=bpy.data.meshes.new('SculptedStrand');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('SculptedStrand',me);bpy.context.collection.objects.link(o);return finish(o,o.name,mat)
 # A continuous cheek, jaw and forehead surface; the eye sockets are recessed into it.
 levels=[(1.68,.043,.049,.028),(1.70,.071,.066,.025),(1.73,.094,.08,.018),(1.77,.111,.10,.009),(1.81,.127,.111,0),(1.85,.134,.117,-.003),(1.89,.137,.118,-.005),(1.93,.139,.116,-.009),(1.97,.121,.105,-.014),(2.005,.083,.077,-.019),(2.025,.006,.006,-.02)]
 levels=smooth_path(levels,5)
 verts=[];faces=[];sides=80
 for y,rx,rz,offset in levels:
  for j in range(sides):
   a=j*math.tau/sides;x=math.cos(a)*rx;z=math.sin(a)*rz+offset
   if math.sin(a)>0:
    socket=sum(math.exp(-((x-s*.058)/.031)**2-((y-1.868)/.025)**2) for s in [-1,1]);z-=socket*.009
    z+=.012*math.exp(-((y-1.815)/.030)**2)*math.exp(-((abs(x)-.075)/.039)**2)
    # The bridge, tip and wings are part of the facial surface, not attached primitives.
    z+=.010*math.exp(-(x/.019)**2-((y-1.845)/.045)**2)
    z+=.012*math.exp(-(x/.025)**2-((y-1.802)/.023)**2)
    z+=.007*math.exp(-((abs(x)-.021)/.011)**2-((y-1.798)/.011)**2)
   verts.append(tuple(v((x,y,z))))
 for i in range(len(levels)-1):
  for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
 faces += [tuple(reversed(range(sides))),tuple((len(levels)-1)*sides+j for j in range(sides))]
 me=bpy.data.meshes.new('SculptedFace');me.from_pydata(verts,[],[tuple(reversed(f)) for f in faces]);me.update();head=bpy.data.objects.new('KeeperFace',me);bpy.context.collection.objects.link(head);finish(head,head.name,facemat)
 sub=head.modifiers.new('Soft facial contours','SUBSURF');sub.levels=2;bpy.context.view_layer.objects.active=head;bpy.ops.object.modifier_apply(modifier=sub.name);
 uv=head.data.uv_layers.new(name='FaceUV')
 for poly in head.data.polygons:
  for li in poly.loop_indices:
   co=head.data.vertices[head.data.loops[li].vertex_index].co;uv.data[li].uv=((math.atan2(-co.y,co.x)/math.tau)%1,(co.z-1.68)/.345)
 attach(head,'Head')
 attach(tube('KeeperNeck',[(0,1.57,-.005),(0,1.70,.005)],[.057,.056],skinmat,24),'Head')
 for side in [-1,1]:
  ear=ellipsoid('KeeperEar',(side*.137,1.841,-.007),(.025,.044,.022),skinmat);attach(ear,'Head')
  attach(tube('KeeperEarHelix',[(side*.145,1.868,.012),(side*.153,1.847,.017),(side*.146,1.823,.013)],[.005,.006,.004],inner,8),'Head')
  # Convex almond whites, iris rims, pupils, catchlights and fitted upper/lower eyelids.
  cx=side*.057;ey=1.869
  outline=[(-.034,0),(-.022,.012),(0,.015),(.022,.010),(.034,0),(.018,-.009),(0,-.011),(-.02,-.008)]
  outline=smooth_path([(x*.90,y*.94,0) for x,y in outline+[outline[0]]],3)[:-1];verts=[tuple(v((cx,ey,.125)))];faces=[]
  for x,y,_ in outline:verts.append(tuple(v((cx+x,ey+y,.109+(.004 if y>0 else 0)))))
  for j in range(len(outline)):faces.append((0,j+1,(j+1)%len(outline)+1))
  me=bpy.data.meshes.new('AlmondEye');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('KeeperEye',me);bpy.context.collection.objects.link(o);finish(o,o.name,white);attach(o,'Head')
  attach(ellipsoid('KeeperIrisRim',(cx,ey,.126),(.0115,.0115,.002),dark),'Head');attach(ellipsoid('KeeperIris',(cx,ey,.128),(.010,.011,.002),iris),'Head');attach(ellipsoid('KeeperPupil',(cx,ey,.131),(.0038,.0065,.001),dark),'Head');attach(ellipsoid('KeeperCatchlight',(cx-.003,ey+.004,.133),(.002,.002,.0008),glint),'Head')
  blinkverts=[tuple(v((0,0,.007)))]+[tuple(v((x,y,0))) for x,y,_ in outline]
  me=bpy.data.meshes.new('BlinkLid');me.from_pydata(blinkverts,[],faces);me.update();o=bpy.data.objects.new('KeeperBlink'+('Left' if side<0 else 'Right'),me);bpy.context.collection.objects.link(o);o.location=v((cx,ey,.137));finish(o,o.name,skinmat);attach(o,'Head')
  attach(tube('KeeperUpperLid',[(cx-.027,ey,.123),(cx-.02,ey+.012,.128),(cx,ey+.015,.129),(cx+.02,ey+.01,.125),(cx+.027,ey,.12)],[.0015,.002,.002,.0015,.001],skinmat,8),'Head')
  attach(tube('KeeperLash',[(cx-.025,ey+.002,.128),(cx-.012,ey+.014,.133),(cx+.012,ey+.014,.13),(cx+.026,ey+.002,.124)],[.0007,.001,.001,.0005],hair,6),'Head')
  attach(tube('KeeperLowerLid',[(cx-.025,ey-.001,.122),(cx-.014,ey-.009,.127),(cx+.011,ey-.01,.126),(cx+.026,ey,.12)],[.001,.0015,.0015,.001],skinmat,8),'Head')
  attach(tube('KeeperBrow',smooth_path([(side*.028,1.905,.112),(side*.056,1.911,.112),(side*.085,1.902,.102)],5),[.0017]*11,hair,8),'Head')
 attach(tube('KeeperUpperLip',[(-.025,1.762,.113),(-.011,1.764,.121),(0,1.761,.123),(.011,1.764,.121),(.025,1.762,.113)],[.0008,.0018,.0015,.0018,.0008],lipmat,10),'Head')
 attach(tube('KeeperLowerLip',[(-.028,1.765,.114),(0,1.753,.122),(.028,1.765,.114)],[.0008,.002,.0008],lipmat,10),'Head')
 # Two continuous forearms/hands, with separated fingers and joint creases.
 for side in [-1,1]:
  name='Left' if side<0 else 'Right';parts=[tube('Forearm',[(side*.29,1.30,0),(side*.305,1.08,.005),(side*.31,.91,.02)],[.058,.049,.037],None,20),ellipsoid('Palm',(side*.31,.86,.025),(.039,.063,.023))]
  for i in range(4):
   x=side*.31+(i-1.5)*.018;parts.append(tube('Finger',[(x,.823,.028),(x,.786+(i%3)*.006,.034),(x,.757+(i%3)*.008,.043)],[.009,.008,.006],None,10))
  parts.append(tube('Thumb',[(side*.31-side*.029,.875,.04),(side*.31-side*.052,.842,.053),(side*.31-side*.054,.817,.049)],[.013,.01,.007],None,10));hand=fuse(name+'Hand',parts,skinmat,.007);skin(hand,arm,segments,lambda n,p:n in [name+'Arm',name+'Forearm'])
 # Every hair option is a single independently selectable skinned mesh.
 def cap(cropped=False):
  verts=[];faces=[];rings=24;sides=96
  for i in range(rings+1):
   for j in range(sides):
    a=j*math.tau/sides;end=1.18+abs(math.cos(a))**4*.72 if math.sin(a)>0 else 2.10;theta=.008+(end-.008)*i/rings;rx=.153 if cropped else .160;rz=.137 if cropped else .149
    # Fine, continuous comb lines follow the crown down toward the hairline.
    ridge=.0008*math.cos(a*64+theta*5)*math.sin(theta)
    verts.append(tuple(v((math.cos(a)*math.sin(theta)*(rx+ridge),1.887+math.cos(theta)*.166,math.sin(a)*math.sin(theta)*(rz+ridge)-.014))))
  for i in range(rings):
   for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
  faces.append(tuple(reversed(range(sides))))
  me=bpy.data.meshes.new('HairScalp');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('HairScalp',me);bpy.context.collection.objects.link(o);finish(o,o.name,hair)
  # Voxel union needs a closed volume. An open, zero-thickness cap gets erased,
  # leaving bald patches between otherwise intact locks.
  solid=o.modifiers.new('Solid fitted hair roots','SOLIDIFY');solid.thickness=.016;solid.offset=-1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=solid.name)
  return o
 def fringe(kind='swept'):
  parts=[]
  for i in range(9):
   x=-.125+i*.03
   if kind=='curtain':
    side=-1 if i<4 else 1;k=i if i<4 else i-4;points=[(side*.012,2.034,-.015),(side*(.05+k*.012),2.047,.045),(side*(.107+k*.009),1.99-k*.004,.10),(side*(.133+k*.006),1.858+k*.023,.055)]
   elif kind=='bangs':points=[(x,2.015,.035),(x,1.96,.13),(x,1.913+.009*math.sin(i),.139)]
   else:points=[(x,2.016,-.025),(x+.015,2.041,.035),(min(.14,x+.06),1.962,.117),(min(.145,x+.08),1.918+abs(x)*.18,.13)]
   parts.append(lock(points,.033,.008))
  return parts
 def flowing(length,waves=0):
  parts=[]
  for i in range(9):
   a=math.pi+i*math.pi/8;x=math.cos(a)*.14;z=math.sin(a)*.13-.02;pts=[]
   for j in range(7):
    u=j/6;pts.append((x*(1+.22*u)+math.sin(u*math.tau*1.3+i)*waves,1.94-u*length,z-.055*u+math.cos(u*math.tau+i)*waves*.4))
   parts.append(lock(pts,.035,.021))
  for side in [-1,1]:parts.append(lock([(side*.1,1.99,.08),(side*.144,1.85,.10),(side*(.15+waves),1.65 if length>.4 else 1.72,.06),(side*.17,1.94-length,.015)],.027,.013))
  return parts
 def braid(x,y,z,length,side=0):
  return [lock([(x+math.sin(j*.8+k*math.tau/3)*.025+side*j/22*.04,y-j/22*length,z+math.cos(j*.8+k*math.tau/3)*.02) for j in range(23)],.015,.013,False) for k in range(3)]
 styles=['short','long','curly','wavy','side-braid','twin-braids','bob','lob','pixie','side-swept','curtain','spiky','quiff','undercut','ponytail','high-ponytail','bun','double-buns','afro','locs','half-up','long-bangs','braided-crown','wavy-bob','feathered-crop','messy-shag','layered-waves','loose-side-braid','soft-bob','flipped-lob','long-side-part','blunt-bob','wispy-bangs','side-flick','wavy-curtain','tousled-quiff']
 for style in styles:
  parts=[cap(style in ['pixie','undercut'])]
  if style in ['short','long','wavy','side-braid','twin-braids','bob','lob','side-swept','ponytail','high-ponytail','bun','double-buns','half-up','wavy-bob','braided-crown']:parts+=fringe()
  if style in ['long','wavy','bob','lob','wavy-bob','long-bangs','half-up']:parts+=flowing({'bob':.29,'wavy-bob':.32,'lob':.43}.get(style,.64),.024 if style in ['wavy','half-up','wavy-bob'] else .003)
  if style=='long-bangs':parts+=fringe('bangs')
  if style in ['curtain','pixie']:parts+=fringe('curtain')
  if style=='side-swept':parts += [lock([(-.1,2.02,.01),(.02,2.075,.09),(.13,1.90,.14)],.06,.023)]
  if style in ['quiff','undercut','spiky']:
   for i in range(14):
    x=-.115+(i%7)*.036;front=i>=7
    if style=='spiky':
     z=.095 if front else -.07;points=[(x,1.95 if front else 2.0,z),(x+math.sin(i)*.015,2.055,z+.015),(x+math.sin(i*1.7)*.055,2.10+(i%3)*.022,z+math.cos(i)*.045)]
    elif front:points=[(x,1.945,.122),(x+.012,2.035,.13),(x+.025,2.105,.035),(x+.047,2.027,-.075)]
    else:points=[(x,2.0,-.09),(x+.02,2.06,-.06),(x+.04,2.067,-.13),(x+.06,2.005,-.16)]
    parts.append(lock(points,.027,.012))
  if style in ['curly','afro']:
   count=36 if style=='afro' else 26
   for i in range(count):
    a=i*2.399;u=(i+.5)/count;theta=math.acos(1-u*1.25);radius=.178 if style=='afro' else .151;x=math.cos(a)*math.sin(theta)*radius;z=math.sin(a)*math.sin(theta)*radius-.012;y=1.893+math.cos(theta)*(.20 if style=='afro' else .17)
    parts.append(lock([(x+math.sin(t*.55)*.017,y+math.cos(t*.55)*.017,z+t*.001) for t in range(13)],.012,.012,False))
  if style in ['side-braid','twin-braids']:
   sides=[1] if style=='side-braid' else [-1,1]
   for side in sides:
    parts += braid(side*.17,1.81,.07,.55,side);parts.append(tube('HairTie',[(side*.195,1.28,.07),(side*.195,1.30,.07)],[.025,.025],accent,12))
  if style=='braided-crown':
   for k in range(3):parts.append(lock([(.145*math.cos(a),1.945+.07*math.sin(a)+math.sin(a*15+k*math.tau/3)*.01,.13*math.sin(a)-.014+math.cos(a*15+k*math.tau/3)*.008) for a in [j*math.tau/48 for j in range(49)]],.012,.012,False))
   parts+=flowing(.38,.008)
  if style in ['ponytail','high-ponytail','half-up']:
   y=2.005 if style=='high-ponytail' else 1.85;length=.53 if style!='half-up' else .34
   for i in range(6):parts.append(lock([((i-2.5)*.01,y,-.13),((i-2.5)*.015,y-.08,-.24),((i-2.5)*.02+.03,y-length*.65,-.28),((i-2.5)*.015-.025,y-length,-.22)],.028,.02))
   parts.append(ellipsoid('HairTie',(0,y-.025,-.165),(.047,.02,.024),accent))
  if style in ['bun','double-buns']:
   for cx in ([0] if style=='bun' else [-.13,.13]):
    for i in range(6):parts.append(lock([(cx+math.cos(a)*(.05+i*.003),2.015+math.sin(a)*.049,-.12+(i-2.5)*.011) for a in [j*math.tau/24 for j in range(25)]],.013,.012,False))
  if style=='locs':
   for i in range(16):
    a=math.pi+i*math.pi/15;x=math.cos(a)*.15;z=math.sin(a)*.14-.015;parts.append(lock([(x,1.99,z),(x*1.15,1.78,z-.025),(x*1.25+.009*math.sin(i),1.50,z-.035),(x*1.3,1.30+(i%3)*.03,z-.025)],.015,.014,False))
   parts+=fringe('curtain')
  if style in ['feathered-crop','messy-shag','side-flick','tousled-quiff']:
   for row in range(3):
    for j in range(7):
     x=-.12+j*.038;z=-.12+row*.095;lift=.035+((j*3+row)%4)*.009
     endy=1.875+abs(x)*.25 if style=='messy-shag' else 1.93+abs(x)*.25
     if style=='tousled-quiff':points=[(x,1.95,z+.06),(x-.025,2.08+lift,z+.055),(x+.055,2.07,z-.08)]
     elif style=='side-flick':points=[(x,2.0,z),(x+.035,2.04+lift,z+.055),(x+.09,1.95,z+.09)]
     else:points=[(x,2.01,z),(x+math.sin(j)*.015,2.04+lift,z+.06),(x+math.sin(j*1.7)*.03,endy,z+.12)]
     parts.append(lock(points,.031 if style=='messy-shag' else .024,.012))
   if style in ['feathered-crop','messy-shag']:
    for side in [-1,1]:
     for j in range(4):parts.append(lock([(side*.12,1.98,-.06+j*.035),(side*.16,1.86,-.025+j*.035),(side*(.17+j*.008),1.79+j*.012,.01)],.023,.012))
  if style in ['layered-waves','long-side-part','wispy-bangs','flipped-lob','soft-bob','blunt-bob','wavy-curtain']:
   length={'flipped-lob':.43,'soft-bob':.30,'blunt-bob':.31,'wavy-curtain':.22}.get(style,.70)
   parts+=flowing(length,.026 if style in ['layered-waves','flipped-lob','wavy-curtain'] else .004)
   if style in ['wispy-bangs','blunt-bob']:parts+=fringe('bangs')
   elif style=='wavy-curtain':parts+=fringe('curtain')
   else:
    for j in range(7):
     x=-.12+j*.026;parts.append(lock([(x,2.025,-.035),(x+.045,2.055,.045),(.09+j*.01,1.91-j*.012,.13),(.16,1.78+j*.01,.035)],.027,.010))
   if style=='flipped-lob':
    for side in [-1,1]:
     for j in range(5):parts.append(lock([(side*.14,1.75,-.10+j*.04),(side*.18,1.55,-.08+j*.04),(side*.235,1.54,-.07+j*.04)],.025,.014))
   if style=='layered-waves':
    for side in [-1,1]:
     for j in range(3):parts.append(lock([(side*.14,1.94,.075),(side*.18,1.67,.12),(side*.14,1.43,.07),(side*.20,1.20,.035+j*.022)],.028,.016))
  if style=='loose-side-braid':
   parts+=fringe('curtain');parts+=flowing(.22,.013);parts+=braid(.18,1.79,.09,.68,1)
   for side in [-1,1]:parts.append(lock([(side*.10,2.015,.035),(side*.145,1.88,.11),(side*.17,1.72,.065)],.018,.008))
   parts.append(tube('BraidRibbon',[(.22,1.11,.09),(.22,1.14,.09)],[.029,.029],accent,12))
  hair_parts=[o for o in parts if o.data.materials and o.data.materials[0]==hair]
  accessories=[o for o in parts if o not in hair_parts]
  sculpt=fuse('ContinuousHair',hair_parts,hair,.004)
  dec=sculpt.modifiers.new('Hair detail budget','DECIMATE');dec.ratio=.18;bpy.context.view_layer.objects.active=sculpt;bpy.ops.object.modifier_apply(modifier=dec.name)
  node='KeeperHair'+''.join(p.title() for p in style.split('-'));o=merge(node,[sculpt]+accessories);attach(o,'Head');print('HAIR',style,flush=True)
 # Skinning is kept on every wardrobe part before joining so shoulders, elbows and knees stay separate.
 def piece(o,bone=None):
  return attach(o,bone) if bone else garment_skin(o)
 def top(name,mat=cloth,bottom=1.01,wide=.235):
  o=loft(name,[(bottom,wide,.153,0),(bottom+.018,wide,.153,0),(1.12,.211,.145,0),(1.30,.212,.149,0),(1.47,.248,.153,0),(1.55,.25,.131,0),(1.595,.12,.095,0)],mat,32)
  return piece(o)
 def sleeves(mat=cloth,puff=False,long=True,loose=False):
  out=[]
  for side in [-1,1]:
   name='Left' if side<0 else 'Right';pts=[(side*.233,1.51,0),(side*.275,1.40,0),(side*.297,1.25,0)]
   radii=[.10 if loose else .092,.125 if puff else .112 if loose else .084,.095 if loose else .075]
   if long:pts += [(side*.306,1.05,.012),(side*.31,.935,.02)];radii += [.098 if loose else .066,.069 if loose else .052]
   o=tube(name+'Sleeve',pts,radii,mat,20);skin(o,arm,segments,lambda n,p:n in [name+'Arm',name+'Forearm']);out.append(o)
   out.append(piece(tube('SleeveCuff',[(side*.31,.93 if long else 1.235,.02 if long else 0),(side*.31,.96 if long else 1.27,.02 if long else 0)],[.054 if long else .078]*2,accent,16),name+'Forearm' if long else name+'Arm'))
  return out
 def trousers(baggy=False,wide=False):
  parts=[ellipsoid('Waist',(0,1.02,0),(.2,.13,.135),pants)]
  for side in [-1,1]:parts.append(tube('TrouserLeg',[(side*.12,.99,0),(side*.13,.76,0),(side*.13,.54,0),(side*.13,.12 if wide else .27,.01)],[.105,.12 if wide else .111 if baggy else .085,.12 if wide else .099 if baggy else .072,.11 if wide else .07],pants,24))
  o=fuse('ContinuousTrousers',parts,pants,.009)
  dec=o.modifiers.new('Trouser detail budget','DECIMATE');dec.ratio=.30;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=dec.name)
  groups={n:o.vertex_groups.new(name=n) for n in ['Hips','LeftThigh','RightThigh','LeftShin','RightShin']}
  for vert in o.data.vertices:
   p=o.matrix_world@vert.co;x,y=p.x,p.z;u=max(0,min(1,(1.015-y)/.19));u=u*u*(3-2*u);k=max(0,min(1,(.65-y)/.20));k=k*k*(3-2*k);left=max(0,min(1,(.035-x)/.07))
   values={'Hips':1-u,'LeftThigh':u*left*(1-k),'RightThigh':u*(1-left)*(1-k),'LeftShin':u*left*k,'RightShin':u*(1-left)*k}
   for name,weight in values.items():
    if weight>0:groups[name].add([vert.index],weight,'REPLACE')
  mod=o.modifiers.new('Connected hip and knee weights','ARMATURE');mod.object=arm;o.parent=arm;return o
 def shoes(sneaker=False):
  out=[]
  for side in [-1,1]:
   name='Left' if side<0 else 'Right';mat=linen if sneaker else leather
   out.append(piece(tube('AnkleSock',[(side*.13,.39,.005),(side*.13,.12,.03)],[.059,.054],pants,20),name+'Shin'))
   out.append(piece(tube('BootShaft',[(side*.13,.32 if not sneaker else .18,.01),(side*.13,.10,.03)],[.077,.071],mat,20),name+'Shin'))
   out.append(piece(ellipsoid('ShapedToe',(side*.13,.075,.10),(.078,.055,.137),mat),name+'Shin'));out.append(piece(cube('ShoeSole',(side*.13,.025,.09),(.16,.027,.26),sole,.019),name+'Shin'))
   for j in range(3):out.append(piece(tube('BootLace',[(side*.13-.035,.12-j*.009,.10+j*.027),(side*.13+.035,.12-j*.009,.10+j*.027)],[.002]*2,linen,6),name+'Shin'))
  return out
 def trim(y,width=.23,z=.155,mat=accent):return piece(tube('HemTrim',[(math.cos(j*math.tau/64)*(width+.006),y,math.sin(j*math.tau/64)*(z+.006))for j in range(65)],[.004]*65,mat,8))
 def belt(y=1.13):return [piece(loft('LeatherBelt',[(y-.022,.216,.15,0),(y+.022,.216,.15,0)],leather,28)),piece(cube('BeltBuckle',(0,y,.158),(.055,.048,.015),gold,.006))]
 def buttons():return [piece(ellipsoid('JacketButton',(0,1.48-i*.09,.157),(.009,.009,.005),gold)) for i in range(4)]
 def hood():return [piece(loft('FoldedHood',[(1.48,.16,.08,-.085),(1.57,.18,.10,-.085),(1.64,.12,.07,-.055)],cloth,28)),piece(tube('HoodEdge',[(-.11,1.58,.09),(-.14,1.63,.005),(0,1.67,-.12),(.14,1.63,.005),(.11,1.58,.09)],[.018]*5,accent,12))]
 def bow(y=1.49):
  return [piece(lock([(-.09,y+.04,.17),(-.06,y+.06,.18),(0,y,.18)],.028,.012,False,accent)),piece(lock([(.09,y+.04,.17),(.06,y+.06,.18),(0,y,.18)],.028,.012,False,accent)),piece(tube('RibbonTail',[(-.006,y,.18),(-.045,y-.13,.17)],[.015,.008],accent,8)),piece(tube('RibbonTail',[(.006,y,.18),(.035,y-.13,.17)],[.015,.008],accent,8))]
 def skirt(length=.65,flared=.35,tier=False):
  hem=1.15-length;parts=[piece(loft('TailoredSkirt',[(hem,flared,.25,0),(hem+.045,flared*.98,.247,0),(1.02,.245,.165,0),(1.17,.207,.143,0)],cloth,40)),trim(hem,flared,.25)]
  # The pleats are sculpted into the fabric, with a soft scalloped hem.
  for vert in parts[0].data.vertices:
   p=vert.co;u=max(0,min(1,(1.12-p.z)/(1.12-hem)));angle=math.atan2(-p.y/.25,p.x/flared)
   fold=math.cos(angle*16)*.012*u*u;p.x*=1+fold/flared;p.y*=1+fold/.25;p.z+=math.sin(angle*16)*.003*u
  parts[0].data.update()
  if tier:parts += [piece(loft('LayeredHem',[(hem-.06,flared*1.035,.268,0),(hem+.04,flared*1.035,.268,0)],linen,40)),trim(hem+.12,flared*.96,.252)]
  return parts
 def embroidered(skirt_mesh,hem=.53,width=.35,size=1):
  from mathutils.bvhtree import BVHTree
  tree=BVHTree.FromPolygons([vert.co for vert in skirt_mesh.data.vertices],[list(face.vertices) for face in skirt_mesh.data.polygons]);parts=[]
  for row in range(2):
   for i in range(9):
    a=math.pi*.10+(i+row*.5)*math.pi*.8/9;target=v((math.cos(a)*width*.93,hem+.085+row*.115,math.sin(a)*.25));hit,normal,index,distance=tree.find_nearest(target)
    if hit is None:continue
    horizontal=normal.cross(Vector((0,0,1))).normalized();vertical=normal.cross(horizontal).normalized();center=hit+normal*.002;verts=[];faces=[]
    for petal in range(5):
     angle=petal*math.tau/5;direction=horizontal*math.cos(angle)+vertical*math.sin(angle);across=normal.cross(direction);start=len(verts)
     verts += [tuple(center),tuple(center+direction*.012*size+across*.006*size),tuple(center+direction*.024*size),tuple(center+direction*.012*size-across*.006*size)];faces.append((start,start+1,start+2,start+3))
    me=bpy.data.meshes.new('GoldThreadFlower');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('GoldThreadFlower',me);bpy.context.collection.objects.link(o);finish(o,o.name,gold);parts.append(piece(o))
  return parts
 def ruffle(y,rx=.36,rz=.25,mat=linen):
  rx=max(rx,.415);rz=max(rz,.273) # Keep layers outside the skirt instead of intersecting it.
  verts=[];faces=[];count=80
  for row in range(4):
   u=row/3
   for j in range(count):
    a=j*math.tau/count;wave=math.sin(a*20);verts.append(tuple(v((math.cos(a)*(rx+wave*.012*u),y-u*.052+math.sin(a*20)*.007*u,math.sin(a)*(rz+wave*.011*u)))))
  for row in range(3):
   for j in range(count):faces.append((row*count+j,row*count+(j+1)%count,(row+1)*count+(j+1)%count,(row+1)*count+j))
  me=bpy.data.meshes.new('GatheredRuffle');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('GatheredRuffle',me);bpy.context.collection.objects.link(o);finish(o,o.name,mat);return piece(o)
 def ribbon(y,width=.12,z=.205,mat=accent):
  parts=[]
  for side in [-1,1]:
   parts.append(piece(lock([(0,y,z),(side*width*.7,y+.05,z+.012),(side*width,y+.005,z),(side*width*.65,y-.035,z+.01),(0,y,z)],.021,.008,False,mat)))
   parts.append(piece(lock([(side*.01,y,z+.01),(side*.025,y-.08,z+.012),(side*width*.55,y-.18,z+.005)],.017,.006,True,mat)))
  parts.append(piece(ellipsoid('RibbonKnot',(0,y,z+.02),(.022,.018,.012),mat)));return parts
 def star(cx,y,z,r=.025,mat=accent):
  verts=[tuple(v((cx,y,z)))]+[tuple(v((cx+math.sin(i*math.pi/5)*(r if i%2==0 else r*.43),y+math.cos(i*math.pi/5)*(r if i%2==0 else r*.43),z))) for i in range(10)]
  me=bpy.data.meshes.new('EmbroideredStar');me.from_pydata(verts,[],[(0,i+1,(i+1)%10+1)for i in range(10)]);me.update();o=bpy.data.objects.new('EmbroideredStar',me);bpy.context.collection.objects.link(o);finish(o,o.name,mat);return piece(o)
 def undershirt():return piece(loft('WhiteTee',[(.95,.20,.012,.159),(.97,.20,.012,.159),(1.13,.105,.013,.172),(1.42,.10,.012,.170),(1.56,.069,.012,.119)],linen,28))
 def cargo_pockets():
  parts=[]
  for side in [-1,1]:
   name='Left' if side<0 else 'Right'
   for y in [.72,.50]:
    parts.append(piece(cube('UtilityPocket',(side*.18,y,.085),(.13,.15,.035),pants,.012),name+'Thigh' if y>.6 else name+'Shin'))
    parts.append(piece(cube('PocketFlap',(side*.18,y+.06,.108),(.14,.045,.012),cloth,.006),name+'Thigh' if y>.6 else name+'Shin'))
  return parts
 def coat_lapels():
  return [piece(tube('TurnedLapel',[(side*.065,1.59,.11),(side*.145,1.43,.178),(side*.085,1.17,.18)],[.024,.032,.013],cloth,12)) for side in [-1,1]]
 outfits=['city-sweatshirt','ranger','hoodie','denim','cargo','scholar','starlight','violet','raincoat','puffer','adventurer','knit','coat','sport','festival','utility-cargo','slouch-hoodie','blue-jacket','olive-knit','mono-ruffle','mooncoat','rose-dress','cosmic-dress','anemone','nouveau']
 for style in outfits:
  dress=style in ['scholar','starlight','violet','festival','mono-ruffle','mooncoat','rose-dress','cosmic-dress','anemone','nouveau'];parts=[]
  parts.append(trousers(style in ['cargo','hoodie','utility-cargo','slouch-hoodie','olive-knit'],wide=style=='city-sweatshirt'));parts+=shoes(style in ['hoodie','denim','cargo','sport','utility-cargo','slouch-hoodie','blue-jacket','olive-knit','city-sweatshirt'])
  parts.append(top('KeeperTailoredTop',bottom=1.04 if dress else 1.0,wide=.22 if dress else .235));parts+=sleeves(puff=style in ['starlight','violet','festival','mono-ruffle','rose-dress','cosmic-dress','anemone'],long=style not in ['ranger','adventurer','festival','mono-ruffle','cosmic-dress'],loose=style in ['city-sweatshirt','slouch-hoodie','olive-knit','nouveau','anemone'])
  shell=[o for o in parts if o.name.startswith('KeeperTailoredTop') or o.name.endswith('Sleeve')]
  for o in shell:
   for mod in list(o.modifiers):o.modifiers.remove(mod)
   o.vertex_groups.clear();o.parent=None
  fabric=fuse('ContinuousTailoredFabric',shell,cloth,.009)
  dec=fabric.modifiers.new('Game-ready fabric','DECIMATE');dec.ratio=.40;bpy.context.view_layer.objects.active=fabric;bpy.ops.object.modifier_apply(modifier=dec.name)
  # Low-amplitude gathered folds give the cloth a draped silhouette, not a rigid tube.
  for vert in fabric.data.vertices:
   p=vert.co;x,y,z=p.x,p.z,-p.y
   if abs(x)<.23:
    angle=math.atan2(z,x);amount=.0035*(math.exp(-((y-1.10)/.09)**2)+.65*math.exp(-((y-1.36)/.17)**2))
    fold=math.sin(angle*9+y*16)*amount;p.x+=math.cos(angle)*fold;p.y-=math.sin(angle)*fold
   elif y<1.38:
    fold=math.sin(y*64+x*9)*.0025;p.x+=fold;p.y+=fold*.6
  fabric.data.update()
  garment_skin(fabric,True);parts=[o for o in parts if o not in shell]+[fabric]
  if dress:
   length=.83 if style in ['scholar','starlight','nouveau'] else .59;dress_parts=skirt(length,.39 if style!='violet' else .35,style in ['festival','violet','mono-ruffle','rose-dress','cosmic-dress','anemone']);parts+=dress_parts;parts+=bow();parts+=belt(1.17)
   if style in ['scholar','starlight']:parts+=embroidered(dress_parts[0],1.15-length,.39)
   if style=='scholar':parts.append(piece(loft('CreamCapelet',[(1.32,.34,.20,-.015),(1.40,.33,.20,-.01),(1.55,.275,.16,0),(1.635,.09,.075,0)],linen,40)));parts.append(trim(1.33,.34,.19));parts.append(piece(ellipsoid('SunBrooch',(0,1.46,.202),(.024,.024,.008),gold)))
   if style=='violet':parts.append(piece(loft('Corset',[(1.115,.233,.174,0),(1.135,.233,.174,0),(1.23,.22,.171,0),(1.415,.24,.18,0),(1.43,.24,.18,0)],pants,32)));parts += [piece(tube('CorsetLacing',[(-.035,1.16+i*.038,.182),(.035,1.195+i*.038,.182)],[.003]*2,accent,6)) for i in range(5)]
  else:
   if style in ['ranger','denim','knit','coat','raincoat','adventurer']:parts+=buttons()
   elif style not in ['hoodie','city-sweatshirt']:parts.append(piece(tube('JacketZip',[(0,1.055,.165),(0,1.53,.148)],[.003]*2,accent,6)))
   if style in ['ranger','adventurer','coat']:parts+=belt()
   if style in ['hoodie','cargo','raincoat']:parts+=hood()
   if style=='hoodie':
    parts.append(piece(loft('KangarooPocket',[(1.05,.15,.02,.145),(1.12,.17,.028,.15),(1.23,.12,.02,.15)],cloth,24)))
    for side in [-1,1]:parts.append(piece(tube('HoodDrawstring',[(side*.07,1.58,.12),(side*.055,1.39,.17)],[.003]*2,linen,6)))
   if style in ['denim','adventurer']:
    parts.append(piece(loft('LightUndershirt',[(1.10,.10,.01,.156),(1.42,.085,.012,.158),(1.56,.065,.01,.114)],linen,24)))
    for side in [-1,1]:
     parts.append(piece(tube('OpenJacketLapel',[(side*.065,1.57,.12),(side*.11,1.43,.169),(side*.085,1.13,.164)],[.02,.028,.012],accent,10)))
     parts.append(piece(cube('ChestPocket',(side*.14,1.40,.148),(.09,.075,.016),cloth,.008)))
   if style=='adventurer':
    parts.append(piece(tube('SatchelStrap',[(-.20,1.53,.1),(0,1.30,.18),(.22,1.08,.1)],[.017]*3,leather,10)));parts.append(piece(cube('Satchel',(.24,1.02,.02),(.13,.17,.11),leather,.025),'Hips'))
   if style=='cargo':
    for side in [-1,1]:
     name='Left' if side<0 else 'Right';parts.append(piece(cube('CargoPocket',(side*.18,.70,.075),(.115,.15,.045),pants,.012),name+'Thigh'));parts.append(piece(cube('JacketPanel',(side*.145,1.42,.147),(.125,.24,.012),linen,.006)))
     parts.append(piece(tube('UtilityStrap',[(side*.2,1.57,.08),(side*.18,1.11,.16)],[.017]*2,pants,8)))
   if style in ['coat','raincoat']:
    parts.append(piece(loft('CoatSkirt',[(.64,.31,.18,0),(.68,.31,.18,0),(1.10,.22,.15,0),(1.25,.212,.147,0)],cloth,36)));parts.append(trim(.66,.31,.18))
    for side in [-1,1]:parts.append(piece(tube('CoatLapel',[(side*.06,1.60,.08),(side*.14,1.43,.17),(side*.04,1.34,.17)],[.025,.035,.02],accent,10)))
   if style=='puffer':
    for i in range(5):parts.append(piece(loft('PaddedBaffle',[(1.03+i*.10,.24,.163,0),(1.075+i*.10,.26,.18,0),(1.12+i*.10,.24,.163,0)],cloth,28)))
    parts.append(piece(loft('PufferCollar',[(1.52,.14,.10,0),(1.64,.12,.085,0)],accent,24)))
   if style=='knit':
    for x in [-.16,-.10,.10,.16]:parts.append(piece(tube('CableKnit',[(x+math.sin(j*.9)*.005,1.05+j*.025,.157) for j in range(20)],[.003]*20,accent,6)))
    parts.append(piece(loft('SoftScarf',[(1.49,.14,.12,.01),(1.60,.12,.10,.01)],accent,24)));parts.append(piece(tube('ScarfTail',[(.07,1.52,.16),(.08,1.22,.18)],[.035,.03],accent,12)))
   if style=='sport':
    for side in [-1,1]:parts.append(piece(tube('VarsityStripe',[(side*.22,1.53,.085),(side*.29,1.38,.074)],[.013]*2,linen,10)))
  if style=='city-sweatshirt':
   # The reference's layered college sweatshirt, wide jeans, trainers and hand-carried bag.
   parts.append(piece(loft('WhiteShirtHem',[(.965,.235,.157,0),(.975,.235,.157,0),(1.04,.226,.153,0)],linen,40)))
   for side in [-1,1]:
    verts=[tuple(v((side*x,y,z)))for x,y,z in [(.095,1.59,.104),(.018,1.54,.165),(.055,1.475,.172),(.15,1.55,.127)]]
    me=bpy.data.meshes.new('ShirtCollar');me.from_pydata(verts,[],[(0,1,2,3) if side<0 else (3,2,1,0)]);me.update();o=bpy.data.objects.new('WhiteShirtCollar',me);bpy.context.collection.objects.link(o);finish(o,o.name,linen);parts.append(piece(o))
   for words,y,size in [('NEW YORK',1.405,.046),('THE EMPIRE STATE',1.345,.014)]:
    bpy.ops.object.text_add(location=v((0,y,.167)),rotation=(math.pi/2,0,0));text=bpy.context.object;text.data.body=words;text.data.align_x='CENTER';text.data.size=size;text.data.extrude=.0006;text.data.bevel_depth=.0002;bpy.ops.object.convert(target='MESH');finish(text,'SweatshirtLettering',linen);parts.append(piece(text))
   parts.append(piece(ellipsoid('NavyCrescentBag',(-.41,.65,.045),(.15,.105,.065),cloth),'LeftForearm'))
   parts.append(piece(tube('BagHandle',[(-.31,.86,.04),(-.46,.82,.045),(-.53,.69,.045),(-.48,.66,.045)],[.012]*4,cloth,10),'LeftForearm'))
   for side in [-1,1]:parts.append(piece(tube('JeansPocketSeam',[(side*.05,1.00,.13),(side*.13,.945,.13),(side*.19,1.00,.07)],[.0015]*3,linen,6),'Hips'))
  if style=='utility-cargo':
   parts+=hood();parts+=cargo_pockets();parts+=belt(1.10)
   white=tube('CreamUtilitySleeve',[(-.235,1.51,0),(-.29,1.32,0),(-.31,1.04,.012),(-.31,.95,.02)],[.10,.091,.074,.059],linen,20);garment_skin(white,True);parts.append(white)
   parts.append(piece(cube('AsymmetricJacketPanel',(-.125,1.39,.156),(.17,.31,.016),linen,.008)))
   for side in [-1,1]:
    parts.append(piece(tube('HarnessStrap',[(side*.18,1.58,.09),(side*.18,1.34,.178),(side*.16,1.06,.17)],[.016]*3,leather,8)))
    parts.append(piece(cube('HarnessBuckle',(side*.18,1.33,.193),(.055,.05,.015),gold,.006)))
    parts.append(piece(tube('HangingStrap',[(side*.21,1.10,.11),(side*.23,.81,.12)],[.014,.012],leather,8),'Hips'))
   parts.append(piece(cube('UtilityChestPocket',(.12,1.44,.171),(.15,.12,.027),pants,.010)))
  if style=='slouch-hoodie':
   parts+=hood();parts+=cargo_pockets();parts.append(piece(loft('LayeredTeeHem',[(.94,.225,.15,0),(.96,.225,.15,0),(1.06,.217,.15,0)],linen,32)))
   parts.append(piece(loft('WideKangarooPocket',[(1.035,.15,.014,.155),(1.07,.18,.025,.164),(1.22,.14,.02,.163),(1.24,.14,.016,.16)],cloth,28)))
   for side in [-1,1]:parts.append(piece(tube('LooseDrawstring',[(side*.075,1.58,.13),(side*.066,1.44,.18),(side*.06,1.36,.18)],[.0035]*3,accent,6)))
  if style=='blue-jacket':
   parts.append(undershirt());parts+=coat_lapels()
   for side in [-1,1]:parts.append(piece(tube('AngledZipPocket',[(side*.16,1.39,.17),(side*.105,1.24,.178)],[.006]*2,accent,8)))
   parts.append(piece(tube('JacketSideTie',[(-.22,1.03,.04),(-.30,.78,.09)],[.017,.012],cloth,8),'Hips'))
   parts.append(piece(tube('WatchBand',[(-.31,.95,.02),(-.31,.98,.02)],[.057,.057],leather,16),'LeftForearm'));parts.append(piece(ellipsoid('WatchFace',(-.31,.966,.079),(.028,.028,.007),gold),'LeftForearm'))
  if style=='olive-knit':
   parts.append(piece(loft('RibbedHighNeck',[(1.55,.115,.088,0),(1.58,.115,.088,0),(1.68,.092,.071,0),(1.69,.092,.071,0)],cloth,32)))
   for side in [-1,1]:
    for j in range(6):parts.append(piece(tube('CollarRib',[(side*(.01+j*.014),1.585,.09),(side*(.008+j*.013),1.675,.075)],[.002]*2,accent,6)))
   parts.append(piece(tube('BagShoulderStrap',[(.20,1.54,.10),(.14,1.26,.18),(-.27,.94,.11)],[.018]*3,leather,10)));parts.append(piece(cube('SoftShoulderBag',(-.31,.91,.06),(.22,.29,.14),leather,.055),'Hips'))
  if style in ['mono-ruffle','rose-dress']:
   parts.append(piece(loft('WhiteDressBib',[(1.19,.125,.012,.177),(1.22,.135,.012,.177),(1.49,.13,.015,.161),(1.56,.075,.012,.12)],linen,28)))
   parts+=ribbon(1.47,.13,.21,linen if style=='mono-ruffle' else accent)
   hem=1.15-length;parts.append(ruffle(hem,.36,.25,linen));parts.append(ruffle(hem+.13,.35,.25,linen))
   for side in [-1,1]:parts+= [piece(tube('TallBoot',[(side*.13,.49,.01),(side*.13,.14,.03)],[.078,.071],leather,20),('Left' if side<0 else 'Right')+'Shin')]
   if style=='mono-ruffle':
    for side in [-1,1]:parts.append(piece(cube('SkirtBuckle',(side*.25,hem+.17,.20),(.065,.05,.012),gold,.008)))
   else:
    parts.append(piece(loft('WhiteApron',[(hem+.01,.25,.012,.245),(hem+.03,.25,.012,.245),(1.04,.17,.012,.17),(1.16,.12,.012,.162)],linen,32)))
    parts+=ribbon(1.16,.085,.19,cloth)
    heartverts=[tuple(v((.016*math.sin(a)**3,1.54+.001*(13*math.cos(a)-5*math.cos(2*a)-2*math.cos(3*a)-math.cos(4*a)),.226))) for a in [j*math.tau/40 for j in range(40)]]
    me=bpy.data.meshes.new('HeartBrooch');me.from_pydata(heartverts,[],[tuple(reversed(range(40)))]);me.update();o=bpy.data.objects.new('HeartBrooch',me);bpy.context.collection.objects.link(o);finish(o,o.name,material('KeeperRoseJewel','#9b4d68',.32));parts.append(piece(o))
  if style=='mooncoat':
   parts.append(undershirt());parts+=coat_lapels();parts+=belt(1.20)
   for side in [-1,1]:
    points=[(side*.06,1.13,-.16),(side*.20,.89,-.19),(side*.22,.56,-.20),(side*.28,.34,-.19)]
    parts.append(piece(lock(points,.095,.014,True,cloth)));parts.append(piece(tube('LongBoot',[(side*.13,.55,.01),(side*.13,.14,.03)],[.077,.073],leather,20),('Left' if side<0 else 'Right')+'Shin'))
    for j in range(6):parts.append(piece(tube('BootCrossLace',[(side*.13-.035,.48-j*.045,.082),(side*.13+.035,.45-j*.045,.082)],[.0025]*2,accent,6),('Left' if side<0 else 'Right')+'Shin'))
  if style=='cosmic-dress':
   parts+=ribbon(1.48,.14,.21);hem=1.15-length;parts.append(ruffle(hem,.37,.25,accent));parts.append(ruffle(hem+.11,.36,.25,cloth))
   for x,y,r in [(-.15,.89,.025),(.13,.96,.022),(-.22,.75,.02),(.22,.73,.025),(0,1.03,.018)]:parts.append(star(x,y,.248,r))
   parts.append(piece(ellipsoid('EmbroideredPlanet',(0,.78,.253),(.047,.047,.003),accent)))
   parts.append(piece(tube('PlanetOrbit',[(math.cos(a)*.077,.78+math.sin(a)*.025,.258) for a in [j*math.tau/32 for j in range(33)]],[.003]*33,accent,6)))
   for side in [-1,1]:parts+=ribbon(hem+.13,.055,.22,accent) if side==1 else []
  if style=='anemone':
   hem=1.15-length;parts.append(piece(loft('GreenLacedBodice',[(1.115,.233,.174,0),(1.135,.233,.174,0),(1.23,.22,.171,0),(1.415,.24,.18,0),(1.43,.24,.18,0)],pants,32)))
   for j in range(5):parts.append(piece(tube('BodiceCrossLace',[(-.035,1.17+j*.04,.184),(.035,1.205+j*.04,.184)],[.003]*2,accent,6)))
   for x in [-.22,-.11,0,.11,.22]:parts.append(piece(lock([(x*.55,1.16,.18),(x*.85,.98,.233),(x,.78,.25),(x*.8,.68,.235)],.083,.012,True,pants)))
   parts.append(ruffle(hem,.36,.25,accent));parts.append(piece(tube('ShoulderWrap',[(-.22,1.53,.10),(0,1.45,.18),(.22,1.53,.10)],[.045,.045,.045],cloth,14)));parts+=ribbon(1.42,.065,.205,accent)
  if style=='nouveau':
   parts.append(piece(loft('GoldEdgedCapelet',[(1.28,.35,.21,-.015),(1.30,.35,.21,-.015),(1.45,.32,.20,-.01),(1.60,.18,.13,0),(1.63,.085,.07,0)],cloth,40)))
   parts.append(trim(1.30,.35,.21,accent));parts+=ribbon(1.49,.15,.225,accent);parts+=embroidered(dress_parts[0],1.15-length,.39,1.4)
   parts.append(ruffle(1.15-length,.39,.25,accent))
  parts.append(trim(1.01 if not dress else 1.17));node='KeeperOutfit'+''.join(p.title() for p in style.split('-'));outfit=merge(node,parts)
  if style in ['scholar','starlight','violet','festival','mono-ruffle','mooncoat','rose-dress','cosmic-dress','anemone','nouveau','coat','raincoat']:
   outfit.shape_key_add(name='Basis');drape=outfit.shape_key_add(name='RidingDrape');inverse=outfit.matrix_world.inverted();names={g.index:g.name for g in outfit.vertex_groups}
   for vert in outfit.data.vertices:
    p=outfit.matrix_world@vert.co;y=p.z;forward=-p.y;torso=sum(g.weight for g in vert.groups if names.get(g.group) in ['Hips','Spine'])
    if y<1.14 and torso>.95:
     u=max(0,min(1,(1.14-y)/.70));front=max(0,min(1,forward/.15));p.y-=.30*u*front;p.z+=.22*u*front;p.x+=p.x/math.sqrt(p.x*p.x+.04*.04)*.07*u;drape.data[vert.index].co=inverse@p
  print('OUTFIT',style,flush=True)
 # Thin metal glasses follow the head and never add body parts.
 parts=[]
 for side in [-1,1]:parts.append(tube('LensRim',[(side*.057+math.cos(j*math.tau/28)*.041,1.869+math.sin(j*math.tau/28)*.027,.156) for j in range(29)],[.0027]*29,gold,6))
 parts.append(tube('Bridge',[(-.016,1.875,.156),(0,1.881,.160),(.016,1.875,.156)],[.0025]*3,gold,6));attach(merge('KeeperGlasses',parts),'Head')
 export('keeper')
