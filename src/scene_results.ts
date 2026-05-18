// Results screen: trophy, score, accuracy, streak, coins, buttons.

import type { RoundState } from "./types/question";

export interface ResultsScreenOptions {
	round: RoundState;
	coins_earned: number;
	new_best_score: boolean;
	new_best_streak: boolean;
	on_play_again: () => void;
	on_open_shop: () => void;
	on_home: () => void;
}

//============================================

// Medal glyphs by tier (Unicode escape sequences for ASCII compatibility)
const MEDAL_GLYPHS: Record<string, string> = {
	GOLD: "\u{1F947}",		// Gold medal
	SILVER: "\u{1F948}",	// Silver medal
	BRONZE: "\u{1F949}",	// Bronze medal (3rd place)
	FLAWLESS: "\u{1F3C6}",	// Trophy
};

// Classify accuracy tier and return a simple trophy emoji/text label.
function trophy_tier(accuracy: number): { tier: string; color: string } {
	if (accuracy >= 1.0) {
		return { tier: "FLAWLESS", color: "rainbow" };
	}
	if (accuracy >= 0.9) {
		return { tier: "GOLD", color: "gold" };
	}
	if (accuracy >= 0.7) {
		return { tier: "SILVER", color: "silver" };
	}
	return { tier: "BRONZE", color: "bronze" };
}

//============================================

export function render_results_screen(opts: ResultsScreenOptions): HTMLElement {
	const {
		round,
		coins_earned,
		new_best_score,
		new_best_streak,
		on_play_again,
		on_open_shop,
		on_home,
	} = opts;

	const container = document.createElement("div");
	container.className = "scene_results";

	// Calculate accuracy
	const total = round.correct_count + round.wrong_count;
	const accuracy = total > 0 ? round.correct_count / total : 0;
	const tier_info = trophy_tier(accuracy);

	// Trophy display
	const trophy_section = document.createElement("div");
	trophy_section.className = `trophy-section trophy-${tier_info.color}`;

	// Medal glyph
	const medal = document.createElement("div");
	medal.className = "results-medal";
	medal.textContent = MEDAL_GLYPHS[tier_info.tier];
	trophy_section.appendChild(medal);

	const trophy_label = document.createElement("div");
	trophy_label.className = "trophy-label";
	trophy_label.textContent = tier_info.tier;

	trophy_section.appendChild(trophy_label);

	// Score display
	const score_section = document.createElement("div");
	score_section.className = "results-stat";

	const score_label = document.createElement("div");
	score_label.className = "results-label";
	score_label.textContent = "Score";

	const score_value = document.createElement("div");
	score_value.className = "results-value";
	score_value.textContent = String(round.score);

	const score_badge = document.createElement("div");
	score_badge.className = "results-badge";
	if (new_best_score) {
		score_badge.textContent = "NEW BEST!";
	}

	score_section.appendChild(score_label);
	score_section.appendChild(score_value);
	if (new_best_score) {
		score_section.appendChild(score_badge);
	}

	// Accuracy display
	const accuracy_section = document.createElement("div");
	accuracy_section.className = "results-stat";

	const accuracy_label = document.createElement("div");
	accuracy_label.className = "results-label";
	accuracy_label.textContent = "Accuracy";

	const accuracy_value = document.createElement("div");
	accuracy_value.className = "results-value";
	accuracy_value.textContent = `${Math.round(accuracy * 100)}%`;

	accuracy_section.appendChild(accuracy_label);
	accuracy_section.appendChild(accuracy_value);

	// Longest streak display
	const streak_section = document.createElement("div");
	streak_section.className = "results-stat";

	const streak_label = document.createElement("div");
	streak_label.className = "results-label";
	streak_label.textContent = "Longest Streak";

	const streak_value = document.createElement("div");
	streak_value.className = "results-value";
	streak_value.textContent = String(round.longest_streak);

	const streak_badge = document.createElement("div");
	streak_badge.className = "results-badge";
	if (new_best_streak) {
		streak_badge.textContent = "NEW BEST!";
	}

	streak_section.appendChild(streak_label);
	streak_section.appendChild(streak_value);
	if (new_best_streak) {
		streak_section.appendChild(streak_badge);
	}

	// Coins earned display
	const coins_section = document.createElement("div");
	coins_section.className = "results-stat";

	const coins_label = document.createElement("div");
	coins_label.className = "results-label";
	coins_label.textContent = "Coins Earned";

	const coins_value = document.createElement("div");
	coins_value.className = "results-value";
	coins_value.textContent = String(coins_earned);

	coins_section.appendChild(coins_label);
	coins_section.appendChild(coins_value);

	// Action buttons: Play Again, Shop, Home
	const button_group = document.createElement("div");
	button_group.className = "results-button-group";

	const play_again_btn = document.createElement("button");
	play_again_btn.className = "btn-primary";
	play_again_btn.textContent = "Play Again";
	play_again_btn.addEventListener("click", on_play_again);

	const shop_btn = document.createElement("button");
	shop_btn.className = "btn-secondary";
	shop_btn.textContent = "Shop";
	shop_btn.addEventListener("click", on_open_shop);

	const home_btn = document.createElement("button");
	home_btn.className = "btn-secondary";
	home_btn.textContent = "Home";
	home_btn.addEventListener("click", on_home);

	button_group.appendChild(play_again_btn);
	button_group.appendChild(shop_btn);
	button_group.appendChild(home_btn);

	// Assemble
	container.appendChild(trophy_section);
	container.appendChild(score_section);
	container.appendChild(accuracy_section);
	container.appendChild(streak_section);
	container.appendChild(coins_section);
	container.appendChild(button_group);

	return container;
}
