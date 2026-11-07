export const COZY_TOWN_BUILDINGS=['cafe','bakery','market','cottage','townhouse','apartments','school','hospital','fire','office','glass','skyline'];
// Only a brand-new city receives a starter neighbourhood; saved maps stay intact.
export function seedCozyTown(state){
 if(state.size<12||state.tiles.some(Boolean))return false;
 const put=(x,z,id)=>state.tiles[z*state.size+x]=id;
 for(const z of [3,6,9])for(let x=1;x<=10;x++)put(x,z,'road');
 for(const x of [1,6,10])for(let z=1;z<=10;z++)put(x,z,'road');
 for(const [x,z,id]of [[2,2,'school'],[4,2,'hospital'],[7,2,'fire'],[9,2,'office'],[2,5,'cafe'],[4,5,'bakery'],[7,5,'market'],[9,5,'townhouse'],[2,8,'cottage'],[4,8,'apartments'],[7,8,'glass'],[9,8,'skyline']])put(x,z,id);
 for(const [x,z,id]of [[3,4,'flowers'],[8,4,'park'],[3,7,'park'],[8,7,'pond'],[4,4,'plaza'],[7,4,'flowers'],[3,10,'flowers'],[5,10,'park']])put(x,z,id);
 state.history=[];return true;
}
