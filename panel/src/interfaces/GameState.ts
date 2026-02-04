export class TroopAbility {
  constructor(
    public name: string,
    public description: string,
  ) {}
}

export class TroopTemplate {
  constructor(
    public name: string,
    // 突击，阵线，射击，战略，支援
    public arms: "Assault" | "Line" | "Ranged" | "Strategic" | "Support",
    public description: string,
    public abilities: TroopAbility[],

    public attack_priority: string,
    public attack: number,
    public attack_type: "Magical" | "Physical",
    public defense: Record<string, number>,
    public damage: number,
    public max_size: number,

    public element_suitability: Record<string, number>,
    public era: number,
  ) {}
}

export class Troop {
  constructor(
    public id: string,
    public owner: string,
    public troop_template: TroopTemplate,

    public disordered: boolean,
    public troop_size: number,
    public location: [number, number],

  ) {}
}

export type TerrainType = "Plain" | "Hill" | "Forest" | "Mountain" | "Swamp" | "Lake";

export class HexCell {
  constructor(
    public q: number,
    public r: number,
    public terrain: TerrainType,
  ) {}
}

export class GameState {
  constructor(
    public troops: Troop[],
    public map: Record<string, HexCell>,
    public room_name: string,
  ) {}
}
