// Centralized screen state machine. All transitions go through transition().
// Subscribers receive every state change; the renderer is one such subscriber.

import type { ScreenState } from "./types/screen";

type Listener = (state: ScreenState) => void;

let current_state: ScreenState = { kind: "home" };
const listeners: Listener[] = [];

export function get_state(): ScreenState {
	return current_state;
}

export function transition(next: ScreenState): void {
	current_state = next;
	for (const fn of listeners) {
		fn(current_state);
	}
}

export function subscribe(fn: Listener): () => void {
	listeners.push(fn);
	fn(current_state);
	function unsubscribe(): void {
		const idx = listeners.indexOf(fn);
		if (idx >= 0) {
			listeners.splice(idx, 1);
		}
	}
	return unsubscribe;
}
