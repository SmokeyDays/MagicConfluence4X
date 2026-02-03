<script setup lang="ts">
import { onMounted, onUnmounted, ref, type Ref } from 'vue';
import { Application, Graphics, Container, Assets, Sprite, type Texture } from 'pixi.js';
import { defineHex, Grid, rectangle, Orientation } from 'honeycomb-grid';
import { generateMockGame } from '../utils/mock';
import type { GameState, Troop } from '../interfaces/GameState';
import { createTroopVisual, STAT_ICONS } from '../utils/troopVisuals';

const pixiContainer: Ref<HTMLElement | null> = ref(null);
let app: Application | null = null;
const gridContainer = new Container();
const troopsLayer = new Container(); // Layer for troops

// Colors & Assets
const COLOR_STROKE = 0xffffff;
const COLOR_HOVER = 0xffea00;
const TERRAIN_TYPES = ['Plain', 'Hill', 'Swamp', 'Lake', 'Mountain', 'Forest'];
const terrainTextures: Record<string, Texture> = {};
const uiTextures: Record<string, Texture> = {};

// mocked game state
const gameState: Ref<GameState | null> = ref(null);

// Define Hex configuration
class Tile extends defineHex({ dimensions: 30, orientation: Orientation.POINTY }) {
  // terrainType logic removed, will read from gameState
}

function createGridFromGameState(state: GameState): Grid<Tile> {
  const hexes = Object.values(state.map).map(cell => new Tile({ q: cell.q, r: cell.r }));
  return new Grid(Tile, hexes);
}

onMounted(async () => {
  if (!pixiContainer.value) return;

  // 1. Initialize PixiJS Application
  app = new Application();
  
  await app.init({
    resizeTo: window,
    backgroundColor: 0x050a14, // Deep space background
    preference: 'webgpu',
    antialias: true,
  });

  if (pixiContainer.value) {
    pixiContainer.value.appendChild(app.canvas);
  }

  // 2. Preload Textures
  for (const t of TERRAIN_TYPES) {
    terrainTextures[t] = await Assets.load(`/images/terrains/light/${t}.svg`);
  }
  
  // Load UI Icons
  const uiAssets = [
    { key: STAT_ICONS.ATK_PHYSICAL, url: '/images/ui/atk_physical.svg' },
    { key: STAT_ICONS.ATK_MAGICAL, url: '/images/ui/atk_magical.svg' },
    { key: STAT_ICONS.DEF_PHYSICAL, url: '/images/ui/def_physical.svg' },
    { key: STAT_ICONS.DEF_MAGICAL, url: '/images/ui/def_magical.svg' },
    { key: STAT_ICONS.DAMAGE, url: '/images/ui/damage.svg' },
    { key: STAT_ICONS.SIZE, url: '/images/ui/size.svg' },
    { key: STAT_ICONS.DEFAULT_TROOP, url: '/images/troops/militia.svg' },
  ];

  for (const asset of uiAssets) {
    uiTextures[asset.key] = await Assets.load(asset.url);
  }

  // 3. Initialize Data
  // gameState.value = generateMockGame(30, 20);
  gameState.value = generateMockGame();

  // 4. Create Honeycomb Grid (geometry only)
  // Auto-detect grid shape from GameState
  const grid = createGridFromGameState(gameState.value);

  // 5. Setup Container
  gridContainer.x = 100;
  gridContainer.y = 100;
  app.stage.addChild(gridContainer);
  
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  // 6. Render Grid
  grid.forEach((hex) => {
    // A. Retrieve Cell Data
    const key = `${hex.q},${hex.r}`;
    const cellData = gameState.value?.map[key];
    
    // Safety check - if data doesn't exist, skip rendering terrain or render default
    if (!cellData) return;

    // B. Terrain Sprite
    const texture = terrainTextures[cellData.terrain];
    if (texture) {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.x = hex.x;
      sprite.y = hex.y;
      
      // Scaling: Hex height (pointy) = 60px. SVG content approx 190/200px.
      // Scale = 62 / 200 for slight overlap/fit
      const scale = 62 / 200; 
      sprite.scale.set(scale);
      gridContainer.addChild(sprite);
    }

    // B. Interaction Overlay
    const graphics = new Graphics();
    drawHighlight(graphics, hex, false);

    graphics.eventMode = 'static';
    graphics.cursor = 'pointer';

    graphics.on('pointerover', () => drawHighlight(graphics, hex, true));
    graphics.on('pointerout', () => drawHighlight(graphics, hex, false));

    gridContainer.addChild(graphics);
  });

  // Ensure troops layer is above terrain
  gridContainer.addChild(troopsLayer);

  // 7. Render Troops
  renderTroops(grid);

  setupInteraction();
});

function renderTroops(grid: Grid<Tile>) {
  if (!gameState.value) return;
  
  troopsLayer.removeChildren(); // clear previous

  gameState.value.troops.forEach((troop: Troop) => {
    // troop.location is [q, r]
    const [q, r] = troop.location;
    // Find the hex in the grid to get pixel coordinates
    // grid.getHex({ q, r }) might require exact object matching depending on version, 
    // easiest is to manually find or iterate if getHex isn't reliable, but usually it is.
    // Honeycomb 3.x+ uses createHex or getHex. 
    // Since we created the grid with `createGridFromGameState`, it should contain the hex.
    // If the troop is off-grid (not in map), we skip it or render at 0,0?
    
    // We can just construct a hex to get coordinates if the grid logic allows, 
    // but the grid instance manages coordinates relative to layout.
    
    // Safe lookup:
    let targetHex: Tile = grid.getHex({ q, r }) as Tile;
    console.log('Rendering troop:', troop.id, 'at hex:', targetHex);

    if (targetHex) {
      const troopContainer = createTroopVisual(troop, uiTextures);
      troopContainer.x = targetHex.x;
      troopContainer.y = targetHex.y;
      
      // Make troop interactive if needed
      troopContainer.eventMode = 'static';
      troopContainer.cursor = 'pointer';
      // troopContainer.on('pointerdown', () => console.log('Clicked troop:', troop.id));

      troopsLayer.addChild(troopContainer);
    }
  });
}


function drawHighlight(g: Graphics, hex: Tile, hover: boolean) {
  g.clear();
  g.poly(hex.corners);
  
  if (hover) {
    g.stroke({ width: 2, color: COLOR_HOVER, alpha: 1 });
    g.fill({ color: COLOR_HOVER, alpha: 0.1 });
  } else {
    g.stroke({ width: 0, color: 0, alpha: 0 });
    g.fill({ color: 0, alpha: 0 });
  }
}

// Pan and Zoom Logic
function setupInteraction() {
  if (!app) return;

  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let paramStart = { x: 0, y: 0 };

  // Panning
  app.stage.on('pointerdown', (e) => {
    isDragging = true;
    dragStart.x = e.global.x;
    dragStart.y = e.global.y;
    paramStart.x = gridContainer.x;
    paramStart.y = gridContainer.y;
  });

  app.stage.on('pointermove', (e) => {
    if (isDragging) {
      const dx = e.global.x - dragStart.x;
      const dy = e.global.y - dragStart.y;
      gridContainer.x = paramStart.x + dx;
      gridContainer.y = paramStart.y + dy;
    }
  });

  const stopDrag = () => { isDragging = false; };
  app.stage.on('pointerup', stopDrag);
  app.stage.on('pointerupoutside', stopDrag);

  // Zooming
  app.canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const direction = e.deltaY > 0 ? (1 - zoomIntensity) : (1 + zoomIntensity);
    
    // Limits
    const newScale = gridContainer.scale.x * direction;
    if (newScale < 0.1 || newScale > 5) return;

    // Zoom towards mouse
    const rect = app!.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const localPos = {
      x: (x - gridContainer.x) / gridContainer.scale.x,
      y: (y - gridContainer.y) / gridContainer.scale.y
    };

    gridContainer.scale.set(newScale);
    
    gridContainer.x = x - localPos.x * gridContainer.scale.x;
    gridContainer.y = y - localPos.y * gridContainer.scale.y;
  }, { passive: false });
}

onUnmounted(() => {
  if (app) {
    app.destroy(true, { children: true });
    app = null;
  }
});
</script>

<template>
  <div class="hex-map-page">
    <!-- <div class="title-overlay">
      <h2>MagicConfluence4X</h2>
      <p class="subtitle">Hex Grid System v1.0 // Pan & Zoom Enabled</p>
    </div> -->
    
    <div ref="pixiContainer" class="pixi-container"></div>
  </div>
</template>

<style scoped>
.hex-map-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #050a14;
}

.title-overlay {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  text-align: center;
  pointer-events: none; /* Allow clicking through the text */
  text-shadow: 0 0 10px rgba(255, 251, 0, 0.7);
  background: rgba(0, 0, 0, 0.6);
  padding: 10px 30px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

h2 {
  margin: 0;
  letter-spacing: 2px;
}

.subtitle {
  margin: 5px 0 0 0;
  color: #ffea00;
  font-size: 0.8rem;
}

.pixi-container {
  width: 100%;
  height: 100%;
}
</style>
