// Smoke test: build + start server + load page + play one round (when PLAY button exists).
// For Batch 1 (placeholder only), this gracefully skips the play flow if no PLAY button.

import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { start_server, stop_server } from "./_server.mjs";
import { REPO_ROOT } from "./repo_root.mjs";
import path from "node:path";

const PORT = 8124; // Use a different port from test_load_smoke
const URL = `http://localhost:${PORT}`;
const BUILD_TIMEOUT = 30000; // 30s for build
const LOAD_TIMEOUT = 10000; // 10s for page load

//============================================
// Main test
//============================================

async function main() {
	const startTime = Date.now();
	let server = null;
	let browser = null;

	try {
		// 1. Rebuild dist/ to ensure freshness
		console.log("[quiz-smoke] Building dist/...");
		execSync("bash build_github_pages.sh", {
			cwd: REPO_ROOT,
			stdio: "inherit",
			timeout: BUILD_TIMEOUT,
		});

		// 2. Start server on a free port
		console.log(`[quiz-smoke] Starting server on http://localhost:${PORT}...`);
		server = await start_server(PORT);

		// 3. Launch headless Chromium
		console.log("[quiz-smoke] Launching headless Chromium...");
		browser = await chromium.launch({ headless: true });

		// 4. Open page and wait for load
		const page = await browser.newPage();

		// Collect console messages and errors
		const consoleMessages = [];
		const pageErrors = [];

		page.on("console", (msg) => {
			consoleMessages.push({
				type: msg.type(),
				text: msg.text(),
			});
		});

		page.on("pageerror", (err) => {
			pageErrors.push(err.toString());
		});

		console.log("[quiz-smoke] Navigating to page...");
		await page.goto(URL, { waitUntil: "load", timeout: LOAD_TIMEOUT });

		// 5. Wait for #app to be ready
		console.log("[quiz-smoke] Waiting for app to load...");
		await page.locator("#app").waitFor({ timeout: LOAD_TIMEOUT });

		// 6. Mode cards must exist (Quick Run).
		const modeCard = page.locator("button:has-text('Quick Run')");
		const modeCardCount = await modeCard.count();

		if (modeCardCount === 0) {
			console.error("[quiz-smoke] FAIL: No mode card (Quick Run) found.");
			process.exit(1);
		}

		// 7. Verify page transitioned away from home.
		console.log("[quiz-smoke] Clicking Quick Run mode card...");
		await modeCard.click();

		// Wait for navigation away from home screen
		await page.waitForTimeout(500);

		// Check that #app no longer contains "Stems Quiz" (home screen title)
		const appContent = await page.locator("#app").textContent();
		if (appContent && appContent.includes("Stems Quiz")) {
			console.error("[quiz-smoke] FAIL: Page did not transition away from home screen.");
			process.exit(1);
		}
		console.log("[quiz-smoke] OK: Page transitioned away from home.");

		// 8. Verify keyboard input changes game state
		const beforeInputText = await page.locator("#app").textContent();

		// Try to answer one question by pressing "1" key
		console.log("[quiz-smoke] Pressing '1' key...");
		await page.keyboard.press("1");

		// Wait for response animation
		await page.waitForTimeout(1000);

		const afterInputText = await page.locator("#app").textContent();

		// Check that something changed (either next question or feedback)
		if (beforeInputText === afterInputText) {
			console.error("[quiz-smoke] FAIL: #app text did not change after keyboard input.");
			process.exit(1);
		}
		console.log("[quiz-smoke] OK: game responded to keyboard input.");

		// 9. Check for zero console errors
		const errors = consoleMessages.filter((m) => m.type === "error");
		if (errors.length > 0) {
			console.error("[quiz-smoke] FAIL: Console errors detected:");
			errors.forEach((e) => console.error(`  ${e.text}`));
			process.exit(1);
		}
		console.log("[quiz-smoke] OK: no console errors.");

		// 10. Check for unhandled page errors
		if (pageErrors.length > 0) {
			console.error("[quiz-smoke] FAIL: Unhandled page errors:");
			pageErrors.forEach((e) => console.error(`  ${e}`));
			process.exit(1);
		}
		console.log("[quiz-smoke] OK: no unhandled page errors.");

		// Success
		const elapsedMs = Date.now() - startTime;
		const elapsedS = (elapsedMs / 1000).toFixed(1);
		console.log(`[quiz-smoke] OK: quiz smoke test passed in ${elapsedS}s`);
		process.exit(0);
	} catch (err) {
		console.error(`[quiz-smoke] FAIL: ${err instanceof Error ? err.message : String(err)}`);
		process.exit(1);
	} finally {
		// Cleanup
		if (browser) await browser.close();
		if (server) await stop_server(server);
	}
}

main();
