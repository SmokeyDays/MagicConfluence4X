<script setup lang="ts">
import { onMounted, onUnmounted, ref, type Ref } from 'vue';
import { Application, Graphics, Container } from 'pixi.js';
import { defineHex, Grid, rectangle, Orientation } from 'honeycomb-grid';

const pixiContainer: Ref<HTMLElement | null> = ref(null);
let app: Application | null = null;
const gridContainer = new Container();

// Colors
const COLOR_CYAN = 0x00e5ff;
const COLOR_YELLOW = 0xffea00;
const COLOR_STROKE = 0xffffff;
const COLOR_HOVER = 0xffffff;

// Define Hex configuration
class Tile extends defineHex({ dimensions: 30, orientation: Orientation.POINTY }) {
  // Custom property to persist color
  color: number = Math.random() > 0.5 ? COLOR_CYAN : COLOR_YELLOW;
}

onMounted(async () => {
  if (!pixiContainer.value) return;

  // 1. Initialize PixiJS Application
  app = new Application();
  
  // Initialize to cover the window
  await app.init({
    resizeTo: window,
    backgroundColor: 0x050a14, // Deep space background
    preference: 'webgpu',
    antialias: true,
  });

  if (pixiContainer.value) {
    pixiContainer.value.appendChild(app.canvas);
  }

  // 2. Create Honeycomb Grid
  // Larger grid to fill screen
  const grid = new Grid(Tile, rectangle({ width: 30, height: 20 }));

  // 3. Setup Container
  gridContainer.x = 100;
  gridContainer.y = 100;
  
  // Enable sorting/z-index if needed, but simple painter's algo is fine for 2D
  app.stage.addChild(gridContainer);
  
  // Make stage interactive for panning
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  // 4. Render Grid
  grid.forEach((hex) => {
    const graphics = new Graphics();
    
    // Draw initial state
    drawHex(graphics, hex, hex.color, 0.3); // Low alpha for base

    // Interaction
    graphics.eventMode = 'static';
    graphics.cursor = 'pointer';

    graphics.on('pointerover', () => {
      // Highlight: brighter and more opaque
      drawHex(graphics, hex, hex.color, 0.8, true); 
    });

    graphics.on('pointerout', () => {
      drawHex(graphics, hex, hex.color, 0.3);
    });

    gridContainer.addChild(graphics);
  });

  setupInteraction();
});

function drawHex(g: Graphics, hex: Tile, color: number, alpha: number, hover: boolean = false) {
  g.clear();
  g.poly(hex.corners);
  g.stroke({ width: hover ? 3 : 1, color: hover ? COLOR_HOVER : COLOR_STROKE, alpha: hover ? 1 : 0.5 });
  g.fill({ color: color, alpha: alpha });
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
  // Add listener to the canvas element for native wheel events
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
    <div class="title-overlay">
      <h2>Sector Map: Alpha-9</h2>
      <p class="subtitle">Hex Grid System v1.0 // Pan & Zoom Enabled</p>
    </div>
    
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
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.7);
  background: rgba(0, 0, 0, 0.6);
  padding: 10px 30px;
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

h2 {
  margin: 0;
  color: #00e5ff;
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 2px;
}

.subtitle {
  margin: 5px 0 0 0;
  color: #ffea00;
  font-size: 0.8rem;
  font-family: 'Share Tech Mono', monospace;
}

.pixi-container {
  width: 100%;
  height: 100%;
}
</style>
