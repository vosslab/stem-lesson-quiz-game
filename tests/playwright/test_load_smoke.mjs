// Smoke test: build + start server + load page + verify bundle message + check for errors.

import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { start_server, stop_server } from "./_server.mjs";
import { REPO_ROOT } from "./repo_root.mjs";

const PORT = 8123;
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
    console.log("[smoke] Building dist/...");
    execSync("bash build_github_pages.sh", {
      cwd: REPO_ROOT,
      stdio: "inherit",
      timeout: BUILD_TIMEOUT,
    });

    // 2. Start server on a free port
    console.log(`[smoke] Starting server on http://localhost:${PORT}...`);
    server = await start_server(PORT);

    // 3. Launch headless Chromium
    console.log("[smoke] Launching headless Chromium...");
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

    console.log("[smoke] Navigating to page...");
    await page.goto(URL, { waitUntil: "load", timeout: LOAD_TIMEOUT });

    // 5. Wait for bundle to fetch + home scene to render. The async
    // load_bundle() resolves after the initial 'load' event, so poll
    // #app text until the loading placeholder is replaced.
    console.log("[smoke] Waiting for bundle message...");
    await page.waitForFunction(
      () => {
        const el = document.querySelector("#app");
        const t = el ? el.textContent || "" : "";
        return t.includes("Stems Quiz") || t.includes("Select All") || t.includes("PLAY");
      },
      { timeout: LOAD_TIMEOUT },
    );

    const appText = await page.locator("#app").textContent();
    // Home screen rendered: lesson picker is the canonical Batch-2 marker.
    // Allow either "Stems Quiz" title or "Select All" picker button.
    const expectedMarkers = ["Stems Quiz", "Select All", "PLAY"];
    const has_marker = expectedMarkers.some((m) => (appText || "").includes(m));
    if (!has_marker) {
      console.error(`[smoke] FAIL: No expected home-screen marker found in #app`);
      console.error(`[smoke] Markers: ${expectedMarkers.join(", ")}`);
      console.error(`[smoke] Got: ${appText}`);
      process.exit(1);
    }

    // 6. Check for console errors
    const errors = consoleMessages.filter((m) => m.type === "error");
    if (errors.length > 0) {
      console.error("[smoke] FAIL: Console errors detected:");
      errors.forEach((e) => console.error(`  ${e.text}`));
      process.exit(1);
    }

    // 7. Check for unhandled page errors
    if (pageErrors.length > 0) {
      console.error("[smoke] FAIL: Unhandled page errors:");
      pageErrors.forEach((e) => console.error(`  ${e}`));
      process.exit(1);
    }

    // Success
    const elapsedMs = Date.now() - startTime;
    const elapsedS = (elapsedMs / 1000).toFixed(1);
    console.log(`[smoke] OK: load test passed in ${elapsedS}s`);
    process.exit(0);
  } catch (err) {
    console.error(`[smoke] FAIL: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  } finally {
    // Cleanup
    if (browser) await browser.close();
    if (server) await stop_server(server);
  }
}

main();
