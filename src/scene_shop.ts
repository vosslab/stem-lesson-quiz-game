// Shop scene: browse cosmetics, preview, purchase.

import type { Theme, ThemeId } from "./types/cosmetic";
import * as cosmetics from "./cosmetics";
import { get_balance } from "./coins";
import {
	record_event,
	grant_goal_rewards,
	check_and_grant_completion_bonuses,
} from "./daily_goals";

//============================================

interface ShopOpts {
	on_back: () => void;
	on_purchase_attempt: (
		id: ThemeId,
		result: { ok: boolean; reason?: string }
	) => void;
}

//============================================

export function render_shop_screen(opts: ShopOpts): HTMLElement {
	// Record the shop visit for daily goals. Idempotent: after the first
	// dispatch completes the visit_shop goal, subsequent calls (from
	// re-renders triggered by equip/purchase clicks) return an empty
	// newly_completed array, so the grant + bonus chain is naturally skipped.
	const { newly_completed } = record_event({ kind: "shop_visit" });
	if (newly_completed.length > 0) {
		grant_goal_rewards(newly_completed);
		check_and_grant_completion_bonuses();
	}

	const container = document.createElement("div");
	container.classList.add("scene_shop");

	// Header
	const header = document.createElement("div");
	header.classList.add("scene_shop_header");

	const title = document.createElement("h1");
	title.textContent = "Shop";
	header.appendChild(title);

	const back_button = document.createElement("button");
	back_button.textContent = "Back";
	back_button.addEventListener("click", opts.on_back);
	header.appendChild(back_button);

	container.appendChild(header);

	// Balance display
	const balance_display = document.createElement("div");
	balance_display.classList.add("scene_shop_balance");
	const balance_text = document.createElement("span");
	balance_text.textContent = `Coins: ${get_balance()}`;
	balance_display.appendChild(balance_text);
	container.appendChild(balance_display);

	// Tap-to-preview hint
	const hint = document.createElement("div");
	hint.classList.add("scene_shop_hint");
	hint.textContent = "Tap card to preview";
	container.appendChild(hint);

	// Group themes by category
	const groups = [
		{ key: "starter", label: "Starter Themes" },
		{ key: "world", label: "World Themes" },
		{ key: "mascot", label: "Mascot Themes" },
		{ key: "ultimate", label: "Ultimate Themes" },
	];

	for (const group of groups) {
		const group_themes = cosmetics.THEME_CATALOG.filter(
			(t) => t.group === group.key
		);
		if (group_themes.length === 0) continue;

		// Section heading
		const section_heading = document.createElement("h2");
		section_heading.classList.add("scene_shop_section_heading");
		section_heading.textContent = group.label;
		container.appendChild(section_heading);

		// Grid for this group
		const grid = document.createElement("div");
		grid.classList.add("scene_shop_grid");

		for (const theme of group_themes) {
			const card = document.createElement("div");
			card.classList.add("scene_shop_card");
			card.classList.add(`rarity_${theme.rarity}`);

			// Preview swatch (now shows motif via CSS data-theme)
			const preview = document.createElement("div");
			preview.classList.add("scene_shop_preview");
			preview.setAttribute("data-theme", theme.id);

			card.appendChild(preview);

			// Info section
			const info = document.createElement("div");
			info.classList.add("scene_shop_info");

			const name = document.createElement("h3");
			name.textContent = theme.display_name;
			info.appendChild(name);

			const price = document.createElement("div");
			price.classList.add("scene_shop_price");
			price.textContent = `Coins: ${theme.cost_coins}`;
			info.appendChild(price);

			card.appendChild(info);

			// Action button
			const owned = cosmetics.is_owned(theme.id);
			const equipped = cosmetics.is_equipped(theme.id);

			// Add equipped class for visual styling
			if (equipped) {
				card.classList.add("equipped");
			}

			const button = document.createElement("button");
			button.classList.add("scene_shop_button");

			if (equipped) {
				button.textContent = "Equipped";
				button.disabled = true;
			} else if (owned) {
				button.textContent = "Equip";
				button.addEventListener("click", () => {
					cosmetics.equip_theme(theme.id);
					// Update this card and all others
					container.replaceWith(render_shop_screen(opts));
				});
			} else {
				// Gate Buy by affordability so kids see a clear disabled state
				// instead of clicking a button that silently does nothing.
				const balance = get_balance();
				const affordable = balance >= theme.cost_coins;
				if (!affordable) {
					const needed = theme.cost_coins - balance;
					button.textContent = `Need ${needed} more coins`;
					button.disabled = true;
					button.classList.add("unaffordable");
				} else {
					button.textContent = "Buy";
					button.addEventListener("click", async (evt) => {
						// Block bubbling to the card click handler so the
						// card preview never fires from a Buy tap.
						evt.stopPropagation();
						// Show confirmation modal so a stray tap does not
						// drain coins on an accidental purchase.
						const confirmed = await show_buy_confirmation(theme);
						if (!confirmed) {
							return;
						}
						const result = cosmetics.purchase_theme(theme.id);
						opts.on_purchase_attempt(theme.id, result);
						// Re-render to update balance and button states
						container.replaceWith(render_shop_screen(opts));
					});
				}
			}

			card.appendChild(button);

			// Preview is shown by the swatch element only (it has its own
			// data-theme). We intentionally do NOT mutate document.body's
			// data-theme on tap/hover: on touch devices mouseleave never
			// fires, so a preview would stick and effectively equip an
			// unowned theme. Card pulse on tap gives tactile feedback
			// without re-skinning the whole UI.
			card.addEventListener("click", (evt) => {
				if (evt.target !== button) {
					card.classList.remove("scene_shop_card_tapped");
					void card.offsetWidth;
					card.classList.add("scene_shop_card_tapped");
				}
			});

			grid.appendChild(card);
		}

		container.appendChild(grid);
	}

	return container;
}

//============================================

// Show an arcade-styled confirmation modal before spending coins.
// Returns true if the kid taps "Yes, buy!", false otherwise (cancel,
// overlay tap, or Escape).
function show_buy_confirmation(theme: Theme): Promise<boolean> {
	return new Promise((resolve) => {
		// Build overlay + card DOM
		const overlay = document.createElement("div");
		overlay.classList.add("buy-modal-overlay");

		const card = document.createElement("div");
		card.classList.add("buy-modal-card");

		const title = document.createElement("div");
		title.classList.add("buy-modal-title");
		title.textContent = `Buy ${theme.display_name}?`;
		card.appendChild(title);

		const body = document.createElement("div");
		body.classList.add("buy-modal-body");
		body.textContent = `Spend ${theme.cost_coins} coins?`;
		card.appendChild(body);

		const buttons = document.createElement("div");
		buttons.classList.add("buy-modal-buttons");

		const confirm_btn = document.createElement("button");
		confirm_btn.classList.add("buy-modal-confirm");
		confirm_btn.textContent = "Yes, buy!";

		const cancel_btn = document.createElement("button");
		cancel_btn.classList.add("buy-modal-cancel");
		cancel_btn.textContent = "No thanks";

		buttons.appendChild(confirm_btn);
		buttons.appendChild(cancel_btn);
		card.appendChild(buttons);

		overlay.appendChild(card);

		// Single teardown path so we never leak listeners or DOM nodes.
		const cleanup = (result: boolean) => {
			document.removeEventListener("keydown", on_keydown);
			overlay.remove();
			resolve(result);
		};

		const on_keydown = (evt: KeyboardEvent) => {
			if (evt.key === "Escape") cleanup(false);
		};

		confirm_btn.addEventListener("click", () => cleanup(true));
		cancel_btn.addEventListener("click", () => cleanup(false));
		// Background tap (not on the card) cancels.
		overlay.addEventListener("click", (evt) => {
			if (evt.target === overlay) cleanup(false);
		});
		document.addEventListener("keydown", on_keydown);

		document.body.appendChild(overlay);
	});
}
