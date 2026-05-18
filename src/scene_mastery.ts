// Mastery scene: per-lesson grid of colored tiles + overall counter.

import type { Bundle, Stem } from "./types/stem";
import * as mastery from "./mastery";

//============================================

interface MasteryOpts {
	bundle: Bundle;
	on_back: () => void;
}

//============================================

export function render_mastery_screen(opts: MasteryOpts): HTMLElement {
	const container = document.createElement("div");
	container.classList.add("scene_mastery");

	// Header
	const header = document.createElement("div");
	header.classList.add("scene_mastery_header");

	const title = document.createElement("h1");
	title.textContent = "Mastery";
	header.appendChild(title);

	const back_button = document.createElement("button");
	back_button.textContent = "Back";
	back_button.addEventListener("click", opts.on_back);
	header.appendChild(back_button);

	container.appendChild(header);

	// Overall counter
	const summary = mastery.mastery_summary(opts.bundle);
	const overall = document.createElement("div");
	overall.classList.add("scene_mastery_overall");
	overall.textContent = `${summary.mastered} / ${summary.total} mastered`;
	container.appendChild(overall);

	// Per-lesson grids
	const lessons_container = document.createElement("div");
	lessons_container.classList.add("scene_mastery_lessons");

	for (const lesson of opts.bundle.lessons) {
		const lesson_block = document.createElement("div");
		lesson_block.classList.add("scene_mastery_lesson");

		const lesson_title = document.createElement("h3");
		lesson_title.textContent = `Lesson ${lesson.number}`;
		lesson_block.appendChild(lesson_title);

		const lesson_grid = document.createElement("div");
		lesson_grid.classList.add("scene_mastery_grid");

		for (const stem of lesson.stems) {
			const tile = document.createElement("button");
			tile.classList.add("scene_mastery_tile");

			const cls = mastery.classify_stem(stem);
			tile.classList.add(`mastery_${cls}`);

			// Color-code by classification
			tile.addEventListener("click", () => {
				show_stem_details(stem);
			});

			lesson_grid.appendChild(tile);
		}

		lesson_block.appendChild(lesson_grid);

		// Lesson progress percentage
		const lesson_stats = mastery.lesson_mastery(opts.bundle, lesson.number);
		const percent =
			lesson.stems.length > 0
				? Math.round(
						(lesson_stats.mastered / lesson.stems.length) * 100
					)
				: 0;

		const progress_bar = document.createElement("div");
		progress_bar.classList.add("scene_mastery_lesson_progress");
		const progress_fill = document.createElement("div");
		progress_fill.classList.add("scene_mastery_lesson_progress_fill");
		progress_fill.style.width = `${percent}%`;
		progress_bar.appendChild(progress_fill);

		const progress_text = document.createElement("span");
		progress_text.classList.add("scene_mastery_lesson_progress_text");
		progress_text.textContent = `${percent}%`;
		progress_bar.appendChild(progress_text);

		lesson_block.appendChild(progress_bar);

		lessons_container.appendChild(lesson_block);
	}

	container.appendChild(lessons_container);

	return container;
}

//============================================

function show_stem_details(stem_arg: Stem): void {
	// Simple modal or popup. For now, just log or show an alert.
	// In a full implementation, this would show the stem, meaning, example word, definition.
	const details = `
Stem: ${stem_arg.stem}
Meaning: ${stem_arg.meaning}
Example: ${stem_arg.example_word}
Definition: ${stem_arg.example_definition}
	`;
	alert(details);
}
