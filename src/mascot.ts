// Friendly blob-monster mascot character in 4 states: idle, cheer, wobble, party.

type MascotState = "idle" | "cheer" | "wobble" | "party";

const MASCOT_SVG = `
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
	<style>
		.mascot-body {
			fill: #ff9f43;
			transition: all 200ms ease;
		}

		.mascot-eye {
			fill: #1c2a3a;
		}

		.mascot-spark {
			fill: #fffd82;
			opacity: 0;
			animation: spark 600ms ease-out;
		}

		@keyframes spark {
			0% { opacity: 1; transform: translate(0, 0) scale(1); }
			100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.3); }
		}

		/* Idle: gentle bob */
		[data-state="idle"] .mascot-body {
			animation: bob 2s ease-in-out infinite;
		}

		@keyframes bob {
			0%, 100% { transform: translateY(0); }
			50% { transform: translateY(-8px); }
		}

		/* Cheer: jump */
		[data-state="cheer"] .mascot-body {
			animation: jump 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
		}

		@keyframes jump {
			0% { transform: translateY(0); }
			40% { transform: translateY(-40px); }
			100% { transform: translateY(0); }
		}

		/* Wobble: shake */
		[data-state="wobble"] .mascot-body {
			animation: wobble 400ms ease-in-out;
		}

		@keyframes wobble {
			0%, 100% { transform: translateX(0); }
			25% { transform: translateX(-6px); }
			75% { transform: translateX(6px); }
		}

		/* Party: spin + glow */
		[data-state="party"] .mascot-body {
			animation: party-spin 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
			filter: drop-shadow(0 0 12px rgba(255, 253, 130, 0.8));
		}

		@keyframes party-spin {
			0% { transform: rotate(0deg) scale(1); }
			50% { transform: rotate(180deg) scale(1.1); }
			100% { transform: rotate(360deg) scale(1); }
		}

		@media (prefers-reduced-motion: reduce) {
			.mascot-body, .mascot-spark {
				animation: none !important;
			}
		}
	</style>

	<!-- Body (big blob) -->
	<circle cx="60" cy="70" r="38" class="mascot-body"/>

	<!-- Head bump -->
	<circle cx="60" cy="30" r="28" class="mascot-body"/>

	<!-- Left eye -->
	<circle cx="48" cy="26" r="6" class="mascot-eye"/>

	<!-- Right eye -->
	<circle cx="72" cy="26" r="6" class="mascot-eye"/>

	<!-- Smile arc -->
	<path d="M 50 35 Q 60 42 70 35" stroke="#1c2a3a" stroke-width="2" fill="none" stroke-linecap="round"/>

	<!-- Left arm -->
	<ellipse cx="30" cy="65" rx="10" ry="18" class="mascot-body"/>

	<!-- Right arm -->
	<ellipse cx="90" cy="65" rx="10" ry="18" class="mascot-body"/>

	<!-- Cheek blush -->
	<circle cx="25" cy="40" r="8" fill="#ff6f91" opacity="0.6"/>
	<circle cx="95" cy="40" r="8" fill="#ff6f91" opacity="0.6"/>
</svg>
`;

//============================================

// Insert inline SVG mascot into parent element.
export function mount_mascot(parent: HTMLElement): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "mascot-wrapper";
  wrapper.setAttribute("data-state", "idle");
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(MASCOT_SVG, "image/svg+xml");
  const svgElement = svgDoc.documentElement;
  wrapper.appendChild(svgElement);
  parent.appendChild(wrapper);
  return wrapper;
}

//============================================

// Swap the data-state attribute to trigger CSS animations.
export function set_mascot_state(el: HTMLElement, state: MascotState): void {
  el.setAttribute("data-state", state);
}
