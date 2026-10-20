import { createKnightMaze, drawKnightPreview } from './knight-maze.js';
// Register future games here. Engines receive a canvas and shared character/modifiers.
// Each renderer returns start(), pause(), and destroy(); onFinish reports earned coins.
export const GAMES = [
  { id: 'knight-ember', name: 'Knights and Dragons', dimension: '2D', genre: 'ARCADE MAZE QUEST', description: 'Brave the dragon maze. Gather colorful gems, find a sword, and turn the chase around for 10 seconds.', tone: 'dungeon', mode: 'THREE LIVES · CLEAR THE MAZE', instructions: 'Move with WASD / arrow keys, swipe, or use the direction buttons. Collect every gem to win. Swords grant 10 seconds to defeat dragons on contact. Collect all gems for 30 coins, plus 2 per dragon (up to 10 bonus coins). Partial runs earn proportionally less. Defeated dragons return after 8 seconds.', width: 760, height: 760, directional: true, preview: drawKnightPreview, create: createKnightMaze },
];

export function drawPreview(canvas, game, character, modifiers) {
  game.preview?.(canvas, character, modifiers);
}
