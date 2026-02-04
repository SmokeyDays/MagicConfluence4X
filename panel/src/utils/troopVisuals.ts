import { Container, Graphics, Sprite, Text, Texture, TextStyle } from 'pixi.js';
import type { Troop } from '../interfaces/GameState';

// Configuration for visual appearance
export const VISUAL_CONFIG = {
  WIDTH: 48,  // Approximate "half diameter" (assuming diameter ~60px)
  HEIGHT: 32, // Rectangular aspect ratio
  ICON_SIZE: 8,
  FONT_SIZE: 8,
  PIP_RADIUS: 2,
  PIP_SPACING: 2,
};

// Map stat names to icon keys
export const STAT_ICONS = {
  ATK_PHYSICAL: 'atk_physical',
  ATK_MAGICAL: 'atk_magical',
  DEF_PHYSICAL: 'def_physical',
  DEF_MAGICAL: 'def_magical',
  DAMAGE: 'damage',
  SIZE: 'size', 
  DEFAULT_TROOP: 'militia', 
};

/**
 * Creates a PixiJS Container representing a Troop token.
 * 
 * @param troop The troop data
 * @param textures A dictionary of loaded textures (icons + portrait)
 * @param primaryColor The owner's color (hex), default grey.
 * @returns Pixi Container
 */
export function createTroopVisual(
  troop: Troop, 
  textures: Record<string, Texture>, 
  primaryColor: number = 0x333333
): Container {
  const container = new Container();
  const template = troop.troop_template;
  const w = VISUAL_CONFIG.WIDTH;
  const h = VISUAL_CONFIG.HEIGHT;

  // 1. Background / Base (Rectangular)
  const background = new Graphics();
  background.roundRect(-w/2, -h/2, w, h, 4);
  background.fill(primaryColor);
  background.stroke({ width: 1, color: 0xFFFFFF }); // Thin white border
  container.addChild(background);

  // 2. Portrait
  // Try to find specific texture, fallback to militia
  const portraitKey = template.name.toLowerCase().replace(/\s/g, '_') || STAT_ICONS.DEFAULT_TROOP;
  const portraitTexture = textures[portraitKey] || textures[STAT_ICONS.DEFAULT_TROOP];
  
  if (portraitTexture) {
    const sprite = new Sprite(portraitTexture);
    sprite.anchor.set(0.5);
    
    // Scale to fit nicely within the card, ensuring it is not truncated
    const maxWidth = w - 4;
    const maxHeight = h - 4;
    const scale = Math.min(maxWidth / portraitTexture.width, maxHeight / portraitTexture.height);
    
    sprite.scale.set(scale);
    sprite.y = -2; // Shift up slightly to leave room for pips
    
    // Masking to stay inside card
    const mask = new Graphics();
    mask.roundRect(-w/2 + 1, -h/2 + 1, w - 2, h - 2, 3);
    mask.fill(0xFFFFFF);
    sprite.mask = mask;
    container.addChild(mask);
    container.addChild(sprite);
  }

  // 3. Stats Layout
  const RES_MULT = 4; // High res text
  const textStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: VISUAL_CONFIG.FONT_SIZE * RES_MULT,
    fill: 0xffffff,
    fontWeight: 'bold',
    stroke: { color: 0x000000, width: 1 * RES_MULT }, // Stronger outline for readability over portrait
    dropShadow: {
      alpha: 0.8,
      blur: 2,
      color: 0x000000,
      distance: 1,
    }
  });

  // Helper to create a mini stat row
  const createStatItem = (iconKey: string, value: number, x: number, y: number, alignRight: boolean = false) => {
    const badge = new Container();
    badge.x = x;
    badge.y = y;

    // Icon
    const tex = textures[iconKey];
    const iconW = VISUAL_CONFIG.ICON_SIZE;
    
    if (tex) {
      const icon = new Sprite(tex);
      icon.anchor.set(0.5);
      icon.width = iconW;
      icon.height = iconW;
      // Reduce spacing: Icon closer to center
      const iconOffset = iconW * 0.35; 
      icon.x = alignRight ? iconOffset : -iconOffset;
      badge.addChild(icon);
    }

    // Text
    const label = new Text({ text: value.toString(), style: textStyle });
    label.anchor.set(0.5);
    
    let scale = 1 / RES_MULT;
    if (value > 99) scale *= 0.7;
    label.scale.set(scale);

    // Reduce spacing: Label closer to center
    // If alignRight (Damage at Top Right), Text to Left of Icon
    // If alignLeft (Stats at Top Left), Text to Right of Icon
    const textOffset = (VISUAL_CONFIG.ICON_SIZE * 0.4); 
    
    if (alignRight) {
      label.x = -textOffset;
    } else {
      label.x = textOffset;
    }

    badge.addChild(label);
    container.addChild(badge);
  };

  // 3a. Top Left Stack: Attack, PhysDef, MagDef
  const startX = -w/2 + 6;
  const startY = -h/2 + 6;
  const stepY = 10;

  // Attack
  const atkIcon = template.attack_type === 'Magical' ? STAT_ICONS.ATK_MAGICAL : STAT_ICONS.ATK_PHYSICAL;
  createStatItem(atkIcon, template.attack, startX, startY);

  // Phys Def
  createStatItem(STAT_ICONS.DEF_PHYSICAL, template.defense['Physical'] || 0, startX, startY + stepY);

  // Mag Def
  createStatItem(STAT_ICONS.DEF_MAGICAL, template.defense['Magical'] || 0, startX, startY + stepY * 2);


  // 3b. Top Right: Damage
  createStatItem(STAT_ICONS.DAMAGE, template.damage, w/2 - 6, -h/2 + 6, true);


  // 4. Size Pips (Bottom Center)
  const pipContainer = new Container();
  const pipY = h/2 - 6;
  pipContainer.y = pipY;
  
  // Calculate total width of pips
  // n pips, n-1 spaces
  const n = template.max_size;
  const r = VISUAL_CONFIG.PIP_RADIUS;
  const gap = VISUAL_CONFIG.PIP_SPACING;
  const totalPipW = n * (2 * r) + (n - 1) * gap;
  
  // Start X to center them
  let currentX = -totalPipW / 2 + r;

  for (let i = 0; i < n; i++) {
    const pip = new Graphics();
    const isLit = i < troop.troop_size;
    
    pip.circle(currentX, 0, r);
    if (isLit) {
      pip.fill(0x00FF00); // Bright Green
      pip.stroke({ width: 0 });
    } else {
      pip.fill(0x000000); // Dark placeholder
      pip.stroke({ width: 1, color: 0x555555 });
    }
    
    pipContainer.addChild(pip);
    currentX += (2 * r + gap);
  }

  container.addChild(pipContainer);

  return container;
}
