// Entry point. Loads the stem bundle, applies the saved theme,
// hands off to the UI shell. UI modules ship in Batch 2.

import { load_bundle } from "./data_loader";
import { load_save } from "./persist";

async function main(): Promise<void> {
	const save = load_save();
	document.body.setAttribute("data-theme", save.equipped_theme);

	const bundle = await load_bundle();

	const app = document.getElementById("app");
	if (app === null) {
		throw new Error("Missing #app root element.");
	}
	app.innerHTML = "";
	const placeholder = document.createElement("div");
	placeholder.style.marginTop = "30vh";
	placeholder.style.textAlign = "center";
	placeholder.innerHTML =
		`<h1 style="font-size:48px">Stems Quiz</h1>` +
		`<p style="font-size:20px;margin-top:12px">Bundle loaded: ` +
		`${bundle.lessons.length} lessons, ${bundle.all_stems.length} stems</p>` +
		`<p style="font-size:18px;margin-top:8px;color:var(--text-soft)">` +
		`Batch 2 wires up the home screen next.</p>`;
	app.appendChild(placeholder);
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	const app = document.getElementById("app");
	if (app !== null) {
		app.textContent = `Error: ${msg}`;
	}
});
