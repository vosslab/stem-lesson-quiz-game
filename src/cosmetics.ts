// Theme catalog, ownership tracking, and equipping.

import type { Theme, ThemeId } from "./types/cosmetic";
import { load_save, mutate_save } from "./persist";
import * as coins from "./coins";
import {
	record_event,
	grant_goal_rewards,
	check_and_grant_completion_bonuses,
} from "./daily_goals";

//============================================

// Pricing: per-round earn is ~50-150 coins (10 correct * 5 + streak/round
// bonuses). Common tier reachable in ~2-10 rounds, Rare in ~20-50 rounds,
// Legendary in ~100+ rounds. Top Legendary should feel earned.
export const THEME_CATALOG: Theme[] = [
	// Starter Themes
	{ id: "sky", display_name: "Sky", rarity: "common", cost_coins: 0, group: "starter" },
	{ id: "jungle", display_name: "Jungle", rarity: "common", cost_coins: 250, group: "starter" },
	{
		id: "slime_world",
		display_name: "Slime World",
		rarity: "common",
		cost_coins: 500,
		group: "starter",
	},
	{
		id: "candy_kingdom",
		display_name: "Candy Kingdom",
		rarity: "common",
		cost_coins: 750,
		group: "starter",
	},
	// World Themes
	{
		id: "underwater",
		display_name: "Underwater",
		rarity: "rare",
		cost_coins: 1500,
		group: "world",
	},
	{
		id: "arcade_neon",
		display_name: "Arcade Neon",
		rarity: "rare",
		cost_coins: 2500,
		group: "world",
	},
	{
		id: "ancient_ruins",
		display_name: "Ancient Ruins",
		rarity: "rare",
		cost_coins: 3500,
		group: "world",
	},
	{ id: "lava", display_name: "Lava", rarity: "rare", cost_coins: 5000, group: "world" },
	// Mascot Themes
	{ id: "huskies", display_name: "Huskies", rarity: "rare", cost_coins: 3000, group: "mascot" },
	{ id: "wildcats", display_name: "Wildcats", rarity: "rare", cost_coins: 3000, group: "mascot" },
	{ id: "bison", display_name: "Bison", rarity: "rare", cost_coins: 3000, group: "mascot" },
	{ id: "knights", display_name: "Knights", rarity: "rare", cost_coins: 3000, group: "mascot" },
	{ id: "marauders", display_name: "Marauders", rarity: "rare", cost_coins: 7500, group: "mascot" },
	// Ultimate Themes
	{ id: "space", display_name: "Space", rarity: "legendary", cost_coins: 10000, group: "ultimate" },
	{
		id: "galaxy",
		display_name: "Galaxy",
		rarity: "legendary",
		cost_coins: 25000,
		group: "ultimate",
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

	// Daily-goal hook: record the equip. First call of the day captures the
	// baseline (no completion). Subsequent calls with a different theme id
	// complete use_different_theme. Safe to call on repeat equips of the same
	// theme (handler treats same-as-baseline as a no-op).
	const { newly_completed } = record_event({
		kind: "theme_equipped",
		theme_id: id,
	});
	if (newly_completed.length > 0) {
		grant_goal_rewards(newly_completed);
		check_and_grant_completion_bonuses();
	}
}
