export const CITY_POWER_SECONDS=30;
export const CITY_FOOD_POWERS={galaxyShake:'flight',fruitCup:'speed',cake:'flowers',whiteCake:'shapeshift'};
export function createCityPowers(){return {flight:0,speed:0,flowers:0,shapeshift:0,animal:'tiger'};}
export function cityGrantPower(powers,food){const kind=CITY_FOOD_POWERS[food];if(kind)powers[kind]=CITY_POWER_SECONDS;return kind??null;}
export function cityTickPowers(powers,dt,outside=true){for(const kind of Object.values(CITY_FOOD_POWERS)){if(kind==='shapeshift'&&!outside)continue;powers[kind]=Math.max(0,powers[kind]-Math.max(0,dt));}}
export function cityPowerMessage(powers,outside=true){return [powers.shapeshift>0?`Shapeshift! ${Math.ceil(powers.shapeshift)}s outdoors · ${outside?'Choose an animal below.':'Step outside to choose your animal!'}`:'',powers.flight>0?`Now fly! ${Math.ceil(powers.flight)}s · Outside, hold Space to rise; use arrows to fly. Release to land.`:'',powers.speed>0?`Golden speed! ${Math.ceil(powers.speed)}s · Run outside to leave a sparkling golden trail.`:'',powers.flowers>0?`Rainbow garden! ${Math.ceil(powers.flowers)}s · Hold Space outside to grow rainbow flowers.`:''].filter(Boolean).join('\n');}

export const CITY_ANIMALS=['tiger','dragon','cat','dog','giraffe','elephant'];
export function cityChooseAnimal(powers,animal){if(powers.shapeshift<=0||!CITY_ANIMALS.includes(animal))return false;powers.animal=animal;return true;}
