// Theme catalog, ownership tracking, and equipping.

import type { Theme, ThemeId } from "./types/cosmetic";
import { load_save, mutate_save } from "./persist";
import * as coins from "./coins";

//============================================

// Pricing: per-round earn is ~50-150 coins (10 correct * 5 + streak/round
// bonuses). Common tier reachable in ~2-10 rounds, Rare in ~20-50 rounds,
// Legendary in ~100+ rounds. Top Legendary should feel earned.
export const THEME_CATALOG: Theme[] = [
	// Common tier
	{ id: "sky", display_name: "Sky", rarity: "common", cost_coins: 0 },
	{ id: "jungle", display_name: "Jungle", rarity: "common", cost_coins: 250 },
	{
		id: "slime_world",
		display_name: "Slime World",
		rarity: "common",
		cost_coins: 500,
	},
	{
		id: "candy_kingdom",
		display_name: "Candy Kingdom",
		rarity: "common",
		cost_coins: 750,
	},
	// Rare tier
	{
		id: "underwater",
		display_name: "Underwater",
		rarity: "rare",
		cost_coins: 1500,
	},
	{
		id: "arcade_neon",
		display_name: "Arcade Neon",
		rarity: "rare",
		cost_coins: 2500,
	},
	{
		id: "ancient_ruins",
		display_name: "Ancient Ruins",
		rarity: "rare",
		cost_coins: 3500,
	},
	{ id: "lava", display_name: "Lava", rarity: "rare", cost_coins: 5000 },
	// Legendary tier
	{ id: "space", display_name: "Space", rarity: "legendary", cost_coins: 10000 },
	{
		id: "galaxy",
		display_name: "Galaxy",
		rarity: "legendary",
		cost_coins: 25000,
	},
];

//============================================

export function is_owned(id: ThemeId): boolean {
	const save = load_save();
	return save.owned_themes.includes(id);
}

//============================================

export function is_equipped(id: ThemeId): boolean {
	const save = load_save();
	return save.equipped_theme === id;
}

//============================================

export function purchase_theme(id: ThemeId): {
	ok: boolean;
	reason?: string;
} {
	const theme = THEME_CATALOG.find((t) => t.id === id);
	if (!theme) {
		return { ok: false, reason: "Theme not found in catalog" };
	}

	if (is_owned(id)) {
		return { ok: false, reason: "Already owned" };
	}

	// Attempt to spend coins.
	if (!coins.spend(theme.cost_coins)) {
		return { ok: false, reason: "Not enough coins" };
	}

	// Add to owned themes and equip immediately.
	mutate_save((save) => {
		if (!save.owned_themes.includes(id)) {
			save.owned_themes.push(id);
		}
		save.equipped_theme = id;
	});

	// Apply theme to DOM.
	equip_theme(id);

	return { ok: true };
}

//============================================

export function equip_theme(id: ThemeId): void {
	if (!is_owned(id)) {
		return;
	}

	mutate_save((save) => {
		save.equipped_theme = id;
	});

	// Apply to DOM immediately.
	document.body.setAttribute("data-theme", id);
}
