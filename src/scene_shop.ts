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

	// Theme grid
	const grid = document.createElement("div");
	grid.classList.add("scene_shop_grid");

	for (const theme of cosmetics.THEME_CATALOG) {
		const card = document.createElement("div");
		card.classList.add("scene_shop_card");
		card.classList.add(`rarity_${theme.rarity}`);

		// Preview swatch
		const preview = document.createElement("div");
		preview.classList.add("scene_shop_preview");
		preview.setAttribute("data-theme", theme.id);

		// Show gradient and 4 button colors inline
		const preview_style = getComputedStyle(preview);
		const bg_a = preview_style.getPropertyValue("--bg-a");
		const bg_b = preview_style.getPropertyValue("--bg-b");
		const btn_1 = preview_style.getPropertyValue("--btn-1");
		const btn_2 = preview_style.getPropertyValue("--btn-2");
		const btn_3 = preview_style.getPropertyValue("--btn-3");
		const btn_4 = preview_style.getPropertyValue("--btn-4");

		preview.style.background = `linear-gradient(135deg, ${bg_a}, ${bg_b})`;

		// Add 4 mini button swatches
		const mini_buttons = document.createElement("div");
		mini_buttons.classList.add("scene_shop_mini_buttons");
		for (const btn_color of [btn_1, btn_2, btn_3, btn_4]) {
			const mini = document.createElement("div");
			mini.classList.add("scene_shop_mini_button");
			mini.style.backgroundColor = btn_color;
			mini_buttons.appendChild(mini);
		}
		preview.appendChild(mini_buttons);

		card.appendChild(preview);

		// Info section
		const info = document.createElement("div");
		info.classList.add("scene_shop_info");

		const name = document.createElement("h3");
		name.textContent = theme.display_name;
		info.appendChild(name);

		const price = document.createElement("div");
		price.classList.add("scene_shop_price");
		price.innerHTML = `<span class="scene_shop_coin_icon">c</span> ${theme.cost_coins}`;
		info.appendChild(price);

		card.appendChild(info);

		// Action button
		const owned = cosmetics.is_owned(theme.id);
		const equipped = cosmetics.is_equipped(theme.id);

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

		// Hover preview effect
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

	return container;
}
