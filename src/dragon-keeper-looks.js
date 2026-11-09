export const KEEPER_HAIRSTYLES=[
 ['short','Swept crop'],['long','Long straight'],['curly','Natural curls'],['wavy','Long waves'],
 ['side-braid','Side braid'],['twin-braids','Twin braids'],['bob','Classic bob'],['lob','Shoulder-length lob'],
 ['pixie','Pixie cut'],['side-swept','Side-swept fringe'],['curtain','Curtain hair'],['spiky','Tousled spikes'],
 ['quiff','Textured quiff'],['undercut','Swept undercut'],['ponytail','Low ponytail'],['high-ponytail','High ponytail'],
 ['bun','Loose bun'],['double-buns','Double buns'],['afro','Rounded afro'],['locs','Long locs'],
 ['half-up','Half-up waves'],['long-bangs','Long hair with bangs'],['braided-crown','Braided crown'],['wavy-bob','Wavy bob']
].map(([id,name])=>({id,name}));
export const KEEPER_OUTFITS=[
 ['ranger','Woodland ranger','Layered tunic, leather belt and boots'],
 ['hoodie','Everyday hoodie','Soft hood, drawstrings and relaxed trousers'],
 ['denim','Denim explorer','Open denim jacket over a light T-shirt'],
 ['cargo','Skyline cargo','Two-tone jacket, straps and cargo pockets'],
 ['scholar','Sunlit scholar','Cream capelet over a long embroidered dress'],
 ['starlight','Starlight dress','Gold-trimmed navy dress, bow and puff sleeves'],
 ['violet','Violet bloom','Purple sleeves, fitted bodice and layered skirt'],
 ['raincoat','Garden raincoat','Long coat, hood, buttons and rain boots'],
 ['puffer','Summit puffer','Padded jacket with a warm high collar'],
 ['adventurer','Trail adventurer','Shirt, fitted vest, satchel and sturdy boots'],
 ['knit','Cozy cardigan','Cable-knit cardigan and soft scarf'],
 ['coat','Wandering coat','Long tailored coat with lapels and a belt'],
 ['sport','Valley varsity','Sport jacket, striped cuffs and trainers'],
 ['festival','Meadow festival','Tiered dress with a ribbon and floral trim']
].map(([id,name,description])=>({id,name,description}));
export const KEEPER_SKIN_TONES=[['#f2d3be','Porcelain'],['#edc3a4','Fair peach'],['#c89b7f','Warm beige'],['#bd8c68','Honey'],['#ad7856','Golden brown'],['#946247','Chestnut'],['#79513d','Deep brown'],['#4b332b','Rich ebony']];
export const KEEPER_HAIR_COLORS=['#241b1a','#493024','#77503a','#ab7c3d','#d5ae68','#ddd5c3','#9a4f39','#754b6f'];
export const KEEPER_OUTFIT_PALETTES={
 ranger:{shirt:'#657c50',accent:'#c6b079',trousers:'#414b3e'},hoodie:{shirt:'#343a40',accent:'#a5a49b',trousers:'#30383f'},
 denim:{shirt:'#88a6b5',accent:'#c6c2a9',trousers:'#57594e'},cargo:{shirt:'#3c4c60',accent:'#8f9a9e',trousers:'#344459'},
 scholar:{shirt:'#30302f',accent:'#bca064',trousers:'#30302f'},starlight:{shirt:'#26384f',accent:'#d7b269',trousers:'#263344'},
 violet:{shirt:'#6b4c83',accent:'#242d37',trousers:'#365e59'},raincoat:{shirt:'#497c7d',accent:'#b9c9ac',trousers:'#40565c'},
 puffer:{shirt:'#d7a843',accent:'#e5cb8d',trousers:'#343c49'},adventurer:{shirt:'#73543b',accent:'#bc9e6e',trousers:'#4b5744'},
 knit:{shirt:'#aa7d6b',accent:'#ddc5a4',trousers:'#596268'},coat:{shirt:'#9e9279',accent:'#5a4c3d',trousers:'#434a50'},
 sport:{shirt:'#6c829e',accent:'#d9d7c9',trousers:'#39495e'},festival:{shirt:'#9e6877',accent:'#e1cba1',trousers:'#4b3d54'}
};
export function keeperHairNode(id){return 'KeeperHair'+id.split('-').map(p=>p[0].toUpperCase()+p.slice(1)).join('');}
export function keeperOutfitNode(id){return 'KeeperOutfit'+id[0].toUpperCase()+id.slice(1);}
