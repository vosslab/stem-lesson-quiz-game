// Shop scene: browse cosmetics, preview, purchase.

import type { ThemeId } from "./types/cosmetic";
import * as cosmetics from "./cosmetics";
import { get_balance } from "./coins";

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
				button.textContent = "Buy";
				button.addEventListener("click", () => {
					const result = cosmetics.purchase_theme(theme.id);
					opts.on_purchase_attempt(theme.id, result);
					// Re-render to update balance and button states
					container.replaceWith(render_shop_screen(opts));
				});
			}

			card.appendChild(button);

			// Tap card to preview (touch-first)
			card.addEventListener("click", (evt) => {
				if (evt.target !== button) {
					document.body.setAttribute("data-theme", theme.id);
				}
			});

			// Hover preview effect (desktop bonus)
			card.addEventListener("mouseenter", () => {
				document.body.setAttribute("data-theme", theme.id);
			});
			card.addEventListener("mouseleave", () => {
				const equipped_id = cosmetics.THEME_CATALOG.find((t) =>
					cosmetics.is_equipped(t.id)
				)?.id;
				if (equipped_id) {
					document.body.setAttribute("data-theme", equipped_id);
				}
			});

			grid.appendChild(card);
		}

		container.appendChild(grid);
	}

	return container;
}
