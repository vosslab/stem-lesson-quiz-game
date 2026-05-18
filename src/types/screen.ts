// Discriminated union describing the active UI screen.
// Centralized in src/screen_state.ts so transitions go through one switch.

import type { RoundState, AnswerResult } from "./question";

export type ScreenState =
	| { kind: "home" }
	| { kind: "question"; round: RoundState }
	| { kind: "answer_feedback"; round: RoundState; last: AnswerResult }
	| { kind: "results"; round: RoundState }
	| { kind: "shop" }
	| { kind: "goals" }
	| { kind: "mastery" };

export type ScreenKind = ScreenState["kind"];
