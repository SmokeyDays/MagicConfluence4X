import { Container, Graphics, Sprite, Text, Texture, TextStyle } from 'pixi.js';
import type { Troop } from '../interfaces/GameState';

// Configuration for visual appearance
const VISUAL_CONFIG = {
  RADIUS: 20,
  ICON_SIZE: 12,
  FONT_SIZE: 10,
  BAR_WIDTH: 30,
  BAR_HEIGHT: 4,
};

// Map stat names to icon keys
export const STAT_ICONS = {
  ATK_PHYSICAL: 'atk_physical',
  ATK_MAGICAL: 'atk_magical',
  DEF_PHYSICAL: 'def_physical',
  DEF_MAGICAL: 'def_magical',
  DAMAGE: 'damage',
  SIZE: 'size', // Used just in case, though we might use a bar
  DEFAULT_TROOP: 'militia', // Default portrait
};

/**
 * Creates a PixiJS Container representing a Troop token.
 * 
 * @param troop The troop data
 * @param textures A dictionary of loaded textures (icons + portrait)
 * @returns Pixi Container
 */
export function createTroopVisual(troop: Troop, textures: Record<string, Texture>): Container {
  const container = new Container();
  const template = troop.troop_template;

  // 1. Background / Base
  const background = new Graphics();
  background.circle(0, 0, VISUAL_CONFIG.RADIUS);
  background.fill(0x333333); // Dark background
  background.stroke({ width: 2, color: 0xFFFFFF }); // White border
  container.addChild(background);

  // 2. Portrait
  // Try to find specific texture, fallback to militia
  const portraitKey = template.name.toLowerCase().replace(/\s/g, '_') || STAT_ICONS.DEFAULT_TROOP;
  const portraitTexture = textures[portraitKey] || textures[STAT_ICONS.DEFAULT_TROOP];
  
  if (portraitTexture) {
    const sprite = new Sprite(portraitTexture);
    sprite.anchor.set(0.5);
    // Scale to fit: texture might be 64x64, we want it ~36x36 (radius 18*2)
    const scale = (VISUAL_CONFIG.RADIUS * 1.8) / Math.max(portraitTexture.width, portraitTexture.height);
    sprite.scale.set(scale);
    
    // Masking
    const mask = new Graphics();
    mask.circle(0, 0, VISUAL_CONFIG.RADIUS - 2);
    mask.fill(0xFFFFFF);
    sprite.mask = mask;
    container.addChild(mask); // Mask must be in display list? In V8 yes/no depends, but adding it is safe-ish or just assign property
    container.addChild(sprite);
  }

  // 3. Stats Layout
  // We place 4 small badges around: TL (Atk), TR (Dmg), BL (P.Def), BR (M.Def)
  
  // Style for text
  const textStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: VISUAL_CONFIG.FONT_SIZE,
    fill: 0xffffff,
    stroke: { color: 0x000000, width: 2 },
    fontWeight: 'bold',
  });

  const badgeOffset = VISUAL_CONFIG.RADIUS; // Distance from center

  // Helper to create a badge
  const createBadge = (iconKey: string, value: number, xMod: number, yMod: number) => {
    const badge = new Container();
    badge.x = xMod * badgeOffset;
    badge.y = yMod * badgeOffset;

    // Icon
    const tex = textures[iconKey];
    if (tex) {
      const icon = new Sprite(tex);
      icon.anchor.set(0.5);
      icon.width = VISUAL_CONFIG.ICON_SIZE;
      icon.height = VISUAL_CONFIG.ICON_SIZE;
      // Offset icon slightly towards center or out? Let's put it next to text.
      // Layout: [Icon][Text]
      icon.x = -VISUAL_CONFIG.ICON_SIZE / 2;
      badge.addChild(icon);
    }

    // Text
    const label = new Text({ text: value.toString(), style: textStyle });
    label.anchor.set(0.5);
    label.x = VISUAL_CONFIG.ICON_SIZE / 2;
    // Scale down text if number is large?
    if (value > 99) label.scale.set(0.8);
    badge.addChild(label);

    container.addChild(badge);
  };

  // 3a. Attack (Top Left)
  const atkIcon = template.attack_type === 'Magical' ? STAT_ICONS.ATK_MAGICAL : STAT_ICONS.ATK_PHYSICAL;
  createBadge(atkIcon, template.attack, -1, -1);

  // 3b. Damage (Top Right)
  createBadge(STAT_ICONS.DAMAGE, template.damage, 1, -1);

  // 3c. Phys Def (Bottom Left)
  const pDef = template.defense['Physical'] || 0;
  createBadge(STAT_ICONS.DEF_PHYSICAL, pDef, -1, 0.6); // Slightly lower

  // 3d. Mag Def (Bottom Right)
  const mDef = template.defense['Magical'] || 0;
  createBadge(STAT_ICONS.DEF_MAGICAL, mDef, 1, 0.6);

  // 4. Size Bar (Bottom Center)
  const barContainer = new Container();
  const barWidth = VISUAL_CONFIG.BAR_WIDTH;
  const barHeight = VISUAL_CONFIG.BAR_HEIGHT;
  barContainer.y = VISUAL_CONFIG.RADIUS + 5;
  barContainer.x = -barWidth / 2;

  // Background
  const barBg = new Graphics();
  barBg.rect(0, 0, barWidth, barHeight);
  barBg.fill(0x000000);
  barContainer.addChild(barBg);

  // Foreground
  const pct = Math.max(0, Math.min(1, troop.troop_size / template.max_size));
  const barFg = new Graphics();
  barFg.rect(0, 0, barWidth * pct, barHeight);
  barFg.fill(0x00FF00); // Green
  barContainer.addChild(barFg);

  container.addChild(barContainer);

  return container;
}
