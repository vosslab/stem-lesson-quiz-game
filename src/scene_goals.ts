// Goals scene: display today's 3 goals with progress bars.

import * as daily_goals from "./daily_goals";

//============================================

interface GoalsOpts {
	on_back: () => void;
}

//============================================

export function render_goals_screen(opts: GoalsOpts): HTMLElement {
	const container = document.createElement("div");
	container.classList.add("scene_goals");

	// Header
	const header = document.createElement("div");
	header.classList.add("scene_goals_header");

	const title = document.createElement("h1");
	title.textContent = "Daily Goals";
	header.appendChild(title);

	const back_button = document.createElement("button");
	back_button.textContent = "Back";
	back_button.addEventListener("click", opts.on_back);
	header.appendChild(back_button);

	container.appendChild(header);

	// Ensure today's goals exist
	const goals_today = daily_goals.ensure_today();

	// Goals list
	const goals_list = document.createElement("div");
	goals_list.classList.add("scene_goals_list");

	for (const prog of goals_today.progress) {
		const goal = prog.goal;
		const goal_card = document.createElement("div");
		goal_card.classList.add("scene_goals_card");
		if (prog.completed) {
			goal_card.classList.add("completed");
		}

		// Goal text
		const text = document.createElement("div");
		text.classList.add("scene_goals_text");
		text.textContent = goal.display_text;
		goal_card.appendChild(text);

		// Progress bar
		const progress_container = document.createElement("div");
		progress_container.classList.add("scene_goals_progress_bar");

		const progress = (prog.current / goal.target) * 100;
		const fill = document.createElement("div");
		fill.classList.add("scene_goals_progress_fill");
		fill.style.width = `${Math.min(progress, 100)}%`;
		progress_container.appendChild(fill);

		const progress_text = document.createElement("span");
		progress_text.classList.add("scene_goals_progress_text");
		progress_text.textContent = `${prog.current}/${goal.target}`;
		progress_container.appendChild(progress_text);

		goal_card.appendChild(progress_container);

		// Reward chip
		const reward = document.createElement("div");
		reward.classList.add("scene_goals_reward");
		if (prog.completed) {
			reward.innerHTML = `<span class="check">\u2713</span> +${goal.reward_coins}`;
		} else {
			reward.textContent = `+${goal.reward_coins}`;
		}
		goal_card.appendChild(reward);

		goals_list.appendChild(goal_card);
	}

	container.appendChild(goals_list);

	return container;
}
