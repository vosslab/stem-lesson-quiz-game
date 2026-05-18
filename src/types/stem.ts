// Core data shapes for stems and lessons. Loaded from data/stems_bundle.json.

import type { LessonId, StemId } from "../brands";

export type Stem = {
	id: StemId;
	lesson: LessonId;
	stem: string;
	meaning: string;
	example_word: string;
	example_definition: string;
};

export type Lesson = {
	id: LessonId;
	number: number;
	stems: Stem[];
};

export type Bundle = {
	lessons: Lesson[];
	all_stems: Stem[];
};
