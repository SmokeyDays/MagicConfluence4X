import { GameState, HexCell, Troop, TroopAbility, TroopTemplate, type TerrainType } from '../interfaces/GameState';
import { defineHex, Grid, rectangle, Orientation } from 'honeycomb-grid';

const TERRAIN_TYPES: TerrainType[] = ['Plain', 'Hill', 'Swamp', 'Lake', 'Mountain', 'Forest'];

// Use a temporary Hex class just for grid generation logic if needed, 
// or simply use loops if we just want coordinates. 
// However, honeycomb handles the offset->axial conversion for rectangle shapes nicely.
class GenHex extends defineHex({ orientation: Orientation.POINTY }) {}

const militiaAbility = new TroopAbility('Untrained', 'Gain -1|-1/-1 when no other friendly troops are in combat.');

const mockTroopTemplate = new TroopTemplate(
  'militia',
  'Assault',
  'Elite melee troops wielding enchanted swords.',
  [militiaAbility],
  'A',
  4,
  'Physical',
  { Physical: 0, Magical: 0 },
  1,
  4,
  { Forest: 1.2 },
  2,
);

export function generateMockTroops(): Troop[] {
  const troops = [
    new Troop('troop1', 'Player1', mockTroopTemplate, false, 3, [2, 2]),
    new Troop('troop2', 'Player1', mockTroopTemplate, false, 3, [2, 2]),
    new Troop('troop3', 'Player1', mockTroopTemplate, false, 3, [2, 2]),
    new Troop('troop4', 'Player1', mockTroopTemplate, false, 3, [2, 2]),
    new Troop('troop5', 'Player1', mockTroopTemplate, false, 3, [3, 3]),
    new Troop('troop6', 'Player1', mockTroopTemplate, false, 3, [3, 3]),
    new Troop('troop7', 'Player1', mockTroopTemplate, false, 3, [3, 3]),
    new Troop('troop8', 'Player1', mockTroopTemplate, false, 3, [3, 2]),
    new Troop('troop9', 'Player1', mockTroopTemplate, false, 3, [3, 2]),
    new Troop('troop10', 'Player1', mockTroopTemplate, false, 3, [4, 4]),
  ];
  return troops;
}

export function generateHWMap(width: number, height: number): Record<string, HexCell> {
  const grid = new Grid(GenHex, rectangle({ width, height }));
  
  const map: Record<string, HexCell> = {};
  
  grid.forEach(hex => {
    const key = `${hex.q},${hex.r}`;
    const randomTerrain = TERRAIN_TYPES[Math.floor(Math.random() * TERRAIN_TYPES.length)];
    map[key] = new HexCell(hex.q, hex.r, randomTerrain);
  });
  return map;
}

export function generateCircleMap(R: number): Record<string, HexCell> {
  const map: Record<string, HexCell> = {};
  
  // 约束条件：q + r + s = 0 且 abs(q), abs(r), abs(s) <= R
  for (let q = -R; q <= R; q++) {
    const r1 = Math.max(-R, -q - R);
    const r2 = Math.min(R, -q + R);
    
    for (let r = r1; r <= r2; r++) {
      const key = `${q},${r}`;
      const randomTerrain = TERRAIN_TYPES[Math.floor(Math.random() * TERRAIN_TYPES.length)];
      map[key] = new HexCell(q, r, randomTerrain);
    }
  }
  return map;
}

export function generateMockGame(): GameState {
  const troops = generateMockTroops();
  const map = generateCircleMap(10); // 半径为5的圆形地图
  
  return new GameState(troops, map, 'MockRoom');
}