// Bundle loader. Tries the real JSON bundle first; falls back to MOCK_BUNDLE
// for dev work before M1 extraction completes.

import type { Bundle, Lesson, Stem } from "./types/stem";
import { toLessonId, toStemId } from "./brands";
import { MOCK_BUNDLE } from "./mock_bundle";

type RawStem = {
	stem: string;
	meaning: string;
	example_word: string;
	example_definition: string;
};

type RawLesson = {
	lesson: number;
	stems: RawStem[];
};

type RawBundle = {
	lessons: RawLesson[];
};

function adapt_stem(lesson_num: number, raw: RawStem): Stem {
	const built: Stem = {
		id: toStemId(`L${lesson_num}_${raw.stem}`),
		lesson: toLessonId(`L${lesson_num}`),
		stem: raw.stem,
		meaning: raw.meaning,
		example_word: raw.example_word,
		example_definition: raw.example_definition,
	};
	return built;
}

function adapt_lesson(raw: RawLesson): Lesson {
	const stems = raw.stems.map((s) => adapt_stem(raw.lesson, s));
	const built: Lesson = {
		id: toLessonId(`L${raw.lesson}`),
		number: raw.lesson,
		stems,
	};
	return built;
}

function adapt_bundle(raw: RawBundle): Bundle {
	const lessons = raw.lessons.map(adapt_lesson);
	const all_stems = lessons.flatMap((lesson) => lesson.stems);
	const built: Bundle = { lessons, all_stems };
	return built;
}

// Window augmentation: export_single_file.sh injects window.__STEMS_BUNDLE__
// so file:// builds skip fetch() entirely.
declare global {
	interface Window {
		__STEMS_BUNDLE__?: RawBundle;
	}
}

export async function load_bundle(): Promise<Bundle> {
	// Single-file portable build: bundle is on window, no fetch needed.
	if (typeof window !== "undefined" && window.__STEMS_BUNDLE__ !== undefined) {
		return adapt_bundle(window.__STEMS_BUNDLE__);
	}
	// Hosted build: fetch the sibling stems_bundle.json.
	// Use try/catch only because file:// fetch can throw rather than return !ok.
	let response: Response;
	try {
		response = await fetch("stems_bundle.json");
	} catch {
		return MOCK_BUNDLE;
	}
	if (!response.ok) {
		return MOCK_BUNDLE;
	}
	const raw = (await response.json()) as RawBundle;
	return adapt_bundle(raw);
}
