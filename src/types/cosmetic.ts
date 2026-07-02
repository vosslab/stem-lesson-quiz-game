// Cosmetic theme catalog and ownership shapes.
// All themes are visual only -- no gameplay change.

export type ThemeRarity = "common" | "rare" | "legendary";

export type ThemeId =
  | "sky"
  | "jungle"
  | "slime_world"
  | "candy_kingdom"
  | "underwater"
  | "arcade_neon"
  | "ancient_ruins"
  | "lava"
  | "marauders"
  | "huskies"
  | "wildcats"
  | "bison"
  | "knights"
  | "space"
  | "galaxy";

export type ThemeGroup = "starter" | "world" | "mascot" | "ultimate";

export type Theme = {
  id: ThemeId;
  display_name: string;
  rarity: ThemeRarity;
  cost_coins: number;
  group: ThemeGroup;
};
