<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue';
import { Application, Graphics, Container, Assets, Sprite, type Texture } from 'pixi.js';
import { defineHex, Grid, rectangle, Orientation } from 'honeycomb-grid';
import { generateMockGame } from '../utils/mock';
import type { GameState, Troop } from '../interfaces/GameState';
import { createTroopVisual, STAT_ICONS, VISUAL_CONFIG } from '../utils/troopVisuals';
import TroopInfoPanel from '../components/TroopInfoPanel.vue';

const pixiContainer: Ref<HTMLElement | null> = ref(null);
let app: Application | null = null;
const gridContainer = new Container();
const troopsLayer = new Container(); // Layer for troops

// Debug State
const isDebugMode = ref(false);
const debugInfo = ref({ x: 0, y: 0, q: 0, r: 0 });

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    console.log('Toggling Debug Mode');
    e.preventDefault(); 
    isDebugMode.value = !isDebugMode.value;
  }
};

// Colors & Assets
const COLOR_STROKE = 0xffffff;
const COLOR_HOVER = 0xffea00;
const COLOR_SELECTION = 0x00FFFF;
const TERRAIN_TYPES = ['Plain', 'Hill', 'Swamp', 'Lake', 'Mountain', 'Forest'];
const terrainTextures: Record<string, Texture> = {};
const uiTextures: Record<string, Texture> = {};

// mocked game state
const gameState: Ref<GameState | null> = ref(null);
const selectedTroopIds: Ref<string[]> = ref([]);
const hoveredTroopId: Ref<string | null> = ref(null);

const allTroopsMap = computed(() => {
  const map = new Map<string, Troop>();
  if (gameState.value) {
    gameState.value.troops.forEach(t => map.set(t.id, t));
  }
  return map;
});

const selectedTroops = computed(() => {
  return selectedTroopIds.value
    .map(id => allTroopsMap.value.get(id))
    .filter((t): t is Troop => !!t);
});

const hoveredTroop = computed(() => {
  return hoveredTroopId.value ? allTroopsMap.value.get(hoveredTroopId.value) || null : null;
});

// Map Controls State
const keysPressed = new Set<string>();
const PAN_SPEED = 10;
const selectionGraphics = new Graphics();
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };

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
  
  // Selection Graphics (Screen Space)
  app.stage.addChild(selectionGraphics);

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

  // 8. Setup Controls
  setupZoom();
  setupPanControls();
  setupBoxSelection(grid);

  // Debug - Track Mouse
  app.stage.on('pointermove', (e) => {
    // Always track or only tracking when debug is on? 
    // Tracking is cheap, let's just update ref if debug is on to save vue updates if off
    if (!isDebugMode.value) return;

    debugInfo.value.x = Math.round(e.global.x);
    debugInfo.value.y = Math.round(e.global.y);

    // Convert to grid coords
    // Using gridContainer toLocal to handle pan/zoom
    const local = gridContainer.toLocal(e.global);
    const hex = grid.pointToHex({ x: local.x, y: local.y });
    if (hex) {
      debugInfo.value.q = hex.q;
      debugInfo.value.r = hex.r;
    }
  });

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  
  // Game Loop for panning
  app.ticker.add(() => {
    if (keysPressed.size === 0 || !gridContainer) return;
    
    if (keysPressed.has('ArrowUp') || keysPressed.has('w') || keysPressed.has('W')) {
      gridContainer.y += PAN_SPEED;
    }
    if (keysPressed.has('ArrowDown') || keysPressed.has('s') || keysPressed.has('S')) {
      gridContainer.y -= PAN_SPEED;
    }
    if (keysPressed.has('ArrowLeft') || keysPressed.has('a') || keysPressed.has('A')) {
      gridContainer.x += PAN_SPEED;
    }
    if (keysPressed.has('ArrowRight') || keysPressed.has('d') || keysPressed.has('D')) {
      gridContainer.x -= PAN_SPEED;
    }
  });
});

function onKeyDown(e: KeyboardEvent) {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
     keysPressed.add(e.key);
  }
}

function onKeyUp(e: KeyboardEvent) {
   keysPressed.delete(e.key);
}

function createAndAddTroop(troop: Troop, x: number, y: number, scale: number) {
  const troopContainer = createTroopVisual(troop, uiTextures);
  troopContainer.x = x;
  troopContainer.y = y;
  troopContainer.scale.set(scale);

  // Selection Ring
  const ring = new Graphics();
  ring.circle(0, 0, 32); 
  // Counter-scale stroke width so it looks consistent
  ring.stroke({ width: 2 / scale, color: COLOR_SELECTION });
  ring.visible = false;
  ring.label = 'selectionRing';
  troopContainer.addChildAt(ring, 0);

  // Store ID and make interactive
  (troopContainer as any).troopId = troop.id;
  troopContainer.eventMode = 'static';
  troopContainer.cursor = 'pointer';
  
  troopContainer.on('pointerdown', (e) => {
    e.stopPropagation(); // Stop box selection from starting
    onTroopClick(e, troop.id);
  });

  troopContainer.on('pointerover', () => {
    hoveredTroopId.value = troop.id;
  });

  troopContainer.on('pointerout', () => {
    if (hoveredTroopId.value === troop.id) {
       hoveredTroopId.value = null;
    }
  });

  troopsLayer.addChild(troopContainer);
}

function renderTroops(grid: Grid<Tile>) {
  if (!gameState.value) return;
  
  troopsLayer.removeChildren(); // clear previous

  const troopsByHex: Record<string, Troop[]> = {};
  gameState.value.troops.forEach((t) => {
    const key = `${t.location[0]},${t.location[1]}`;
    if (!troopsByHex[key]) troopsByHex[key] = [];
    troopsByHex[key].push(t);
  });

  Object.values(troopsByHex).forEach((troops) => {
    if (!troops.length) return;
    const [q, r] = troops[0].location;
    const targetHex = grid.getHex({ q, r });
    if (!targetHex) return;

    if (troops.length === 1) {
       createAndAddTroop(troops[0], targetHex.x, targetHex.y, 1);
    } else if (troops.length === 2) {
       const scale = 2 / 3;
       // Vertical spacing. 
       const offset = (VISUAL_CONFIG.HEIGHT * scale) / 2 + 1;
       createAndAddTroop(troops[0], targetHex.x, targetHex.y - offset, scale);
       createAndAddTroop(troops[1], targetHex.x, targetHex.y + offset, scale);
    } else {
       const scale = 0.5;
       const radius = 15; // Half of hex dimension/radius (30)
       const angleStep = (Math.PI * 2) / troops.length;
       
       troops.forEach((t, i) => {
         const angle = i * angleStep - Math.PI / 2;
         const tx = targetHex.x + radius * Math.cos(angle);
         const ty = targetHex.y + radius * Math.sin(angle);
         createAndAddTroop(t, tx, ty, scale);
       });
    }
  });
  
  updateTroopVisuals();
}

function onTroopClick(e: any, troopId: string) {
  const isCtrl = e.originalEvent.ctrlKey || e.originalEvent.metaKey;
  
  if (isCtrl) {
    const idx = selectedTroopIds.value.indexOf(troopId);
    if (idx !== -1) {
      // Toggle off? User said: "Ctrl+click doesn't clear original list". Implies adding. 
      // Usually toggle is better UX. I'll implement toggle.
      // Or just strictly add? "add it to a list". 
      // I'll stick to toggle as it's standard and covers "add".
      // Actually prompt says "add it to a list" (toggling NOT specified, but implicit).
      // Let's check duplicate.
      // "ctrl+点击，则不清空原来的 list" -> doesn't clear original list. Implicitly adds.
      // If I click an already selected one with ctrl? 
      // I will assume toggle behavior is desired for "Interaction Optimization".
      // But to be safe and strictly follow "add", I will just add if not present? 
      // No, "clean current list and add it" vs "don't clean". 
      // I'll assume standard multi-select behavior.
      if (idx === -1) {
        selectedTroopIds.value.push(troopId);
      } else {
        selectedTroopIds.value.splice(idx, 1);
      }
    } else {
      selectedTroopIds.value.push(troopId);
    }
  } else {
    selectedTroopIds.value = [troopId];
  }
  updateTroopVisuals();
}

function updateTroopVisuals() {
  troopsLayer.children.forEach((child: any) => {
    const ring = child.getChildByLabel('selectionRing');
    if (ring) {
      ring.visible = selectedTroopIds.value.includes(child.troopId);
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

// Zoom Only
function setupZoom() {
  if (!app) return;
  
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
    
    // Adjust position to keep mouse over same point
    gridContainer.x = x - localPos.x * gridContainer.scale.x;
    gridContainer.y = y - localPos.y * gridContainer.scale.y;
  }, { passive: false });
}

function setupPanControls() {
  // Logic handled in Ticker
}

function setupBoxSelection(grid: Grid<Tile>) {
  if (!app) return;

  app.stage.on('pointerdown', (e) => {
    // If target is not stage/bg, ignore (e.g. clicking UI). 
    // But we made troops stop propagation so we are good there.
    // If clicking grid tiles (Graphics), they bubble up.
    
    if (!e.getModifierState || !e.getModifierState('Control')) {
        // If not holding ctrl, clear selection on start of drag? 
        // Or wait until mouse up to confirm it's not a shift-click add?
        // Let's clear here for immediate feedback, or reset 'temp' selection.
        selectedTroopIds.value = [];
        updateTroopVisuals();
    }

    isSelecting = true;
    selectionStart.x = e.global.x;
    selectionStart.y = e.global.y;
    
    selectionGraphics.clear();
  });

  app.stage.on('pointermove', (e) => {
    if (!isSelecting) return;
    
    const curX = e.global.x;
    const curY = e.global.y;
    
    const x = Math.min(curX, selectionStart.x);
    const y = Math.min(curY, selectionStart.y);
    const width = Math.abs(curX - selectionStart.x);
    const height = Math.abs(curY - selectionStart.y);
    
    selectionGraphics.clear();
    selectionGraphics.rect(x, y, width, height);
    selectionGraphics.fill({ color: 0x00FF00, alpha: 0.2 });
    selectionGraphics.stroke({ width: 1, color: 0x00FF00 });
  });

  const endSelection = (e: any) => {
    if (!isSelecting) return;
    isSelecting = false;
    
    // Calculate bounds
    const endX = e.global.x;
    const endY = e.global.y;
    
    const left = Math.min(selectionStart.x, endX);
    const right = Math.max(selectionStart.x, endX);
    const top = Math.min(selectionStart.y, endY);
    const bottom = Math.max(selectionStart.y, endY);
    
    // Check intersection with troops
    troopsLayer.children.forEach((child: any) => {
      // Get Global Position of troop
      const pos = child.getGlobalPosition();
      
      // Simple point-in-rect check. 
      // Could make it strictly contained or intersecting bounds.
      if (pos.x >= left && pos.x <= right && pos.y >= top && pos.y <= bottom) {
        if (!selectedTroopIds.value.includes(child.troopId)) {
          selectedTroopIds.value.push(child.troopId);
        }
      }
    });

    updateTroopVisuals();
    selectionGraphics.clear();
  };

  app.stage.on('pointerup', endSelection);
  app.stage.on('pointerupoutside', endSelection);
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  if (app) {
    app.destroy(true, { children: true });
    app = null;
  }
});
</script>

<template>
    <div v-if="isDebugMode" class="debug-panel">
      <div>Debug Mode</div>
      <div>XY: {{ debugInfo.x.toFixed(1) }}, {{ debugInfo.y.toFixed(1) }}</div>
      <div>Grid: [{{ debugInfo.q }}, {{ debugInfo.r }}]</div>
    </div>

    <div class="hex-map-page">
    <TroopInfoPanel 
      :selectedTroops="selectedTroops" 
      :hoveredTroop="hoveredTroop" 
    />
    <!-- <div class="title-overlay">
      <h2>MagicConfluence4X</h2>
      <p class="subtitle">Hex Grid System v1.0 // Pan & Zoom Enabled</p>
    </div> -->
    <div ref="pixiContainer" class="pixi-container"></div>
  </div>
</template>

<style scoped>
 .debug-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-family: monospace;
  padding: 8px;
  pointer-events: none;
  font-size: 14px;
  line-height: 1.5;
  border-radius: 4px;
}
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
