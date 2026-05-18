// Placeholder bundle for dev work before real M1 data lands.
// Swapped out by src/data_loader.ts once data/stems_bundle.json exists.

import type { Bundle, Lesson, Stem } from "./types/stem";
import { toLessonId, toStemId } from "./brands";

function build_stem(
	lesson_num: number,
	stem: string,
	meaning: string,
	example_word: string,
	example_definition: string
): Stem {
	const made: Stem = {
		id: toStemId(`L${lesson_num}_${stem}`),
		lesson: toLessonId(`L${lesson_num}`),
		stem,
		meaning,
		example_word,
		example_definition,
	};
	return made;
}

function build_lesson(num: number, stems: Stem[]): Lesson {
	const made: Lesson = {
		id: toLessonId(`L${num}`),
		number: num,
		stems,
	};
	return made;
}

const lesson_1_stems: Stem[] = [
	build_stem(1, "aliga", "pain", "cephalgia", "headache; throbbing head pain"),
	build_stem(1, "ase", "enzyme", "phosphatase", "an enzyme that breaks down organic phosphates"),
	build_stem(1, "carn", "flesh", "carnivore", "an animal that feeds on flesh"),
	build_stem(1, "gastro", "stomach", "gastrology", "the study of the functions of the stomach"),
	build_stem(1, "hema", "blood", "hemorrhage", "a discharge of blood; bleeding"),
	build_stem(1, "hydro", "water", "hydroplane", "a craft that glides on water; a seaplane"),
	build_stem(1, "itis", "inflammation", "bronchitis", "chronic inflammation of the bronchial tubes"),
];

const lesson_2_stems: Stem[] = [
	build_stem(2, "bio", "life", "biology", "the study of living things"),
	build_stem(2, "geo", "earth", "geology", "the study of the earth"),
	build_stem(2, "photo", "light", "photograph", "an image formed by light"),
	build_stem(2, "tele", "far", "telescope", "an instrument for viewing distant objects"),
	build_stem(2, "micro", "small", "microscope", "an instrument for viewing small things"),
	build_stem(2, "auto", "self", "autograph", "a self-written signature"),
	build_stem(2, "graph", "write", "telegraph", "a system for writing at a distance"),
];

const mock_lessons: Lesson[] = [
	build_lesson(1, lesson_1_stems),
	build_lesson(2, lesson_2_stems),
];

const mock_all_stems: Stem[] = mock_lessons.flatMap((lesson) => lesson.stems);

export const MOCK_BUNDLE: Bundle = {
	lessons: mock_lessons,
	all_stems: mock_all_stems,
};
