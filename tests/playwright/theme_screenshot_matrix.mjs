// theme_screenshot_matrix.mjs
// Durable visual QA screenshot matrix for human/agent review.
// NOT a pixel-diff test. No CI gating. Invoke explicitly:
//   node tests/playwright/theme_screenshot_matrix.mjs
// Generates ~32 screenshots in screenshots/theme-matrix/ (gitignored).
// Use --full flag for broader 200-screenshot matrix (future audits).

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { REPO_ROOT } from './repo_root.mjs';

const PORT = process.env.PORT || '8767';
const BASE_URL = `http://localhost:${PORT}`;
const OUT_DIR = path.join(REPO_ROOT, 'screenshots', 'theme-matrix');

const ALL_THEMES = ['sky','jungle','slime_world','candy_kingdom','underwater','arcade_neon','ancient_ruins','lava','marauders','huskies','wildcats','bison','knights','space','galaxy'];
const SAMPLE_THEMES = ['sky','underwater'];
const MOBILE_THEMES = ['sky','galaxy','arcade_neon'];
const STORAGE_KEY = 'stems_quiz_v1';

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 812 };

function make_save(theme, coins, choice_count, with_mastery = false) {
  const mastery_obj = {};
  if (with_mastery) {
    // Seed mastery progress: ~30 mastered, ~25 learning, ~15 weak, rest untried
    let idx = 0;
    for (let stem_id = 1; stem_id <= 140; stem_id++) {
      const key = `stem_${stem_id}`;
      if (idx < 30) {
        mastery_obj[key] = { correct: 5, wrong: 1, last_two_correct: [true, true] };
      } else if (idx < 55) {
        mastery_obj[key] = { correct: 2, wrong: 1, last_two_correct: [true, false] };
      } else if (idx < 70) {
        mastery_obj[key] = { correct: 1, wrong: 2, last_two_correct: [false, true] };
      }
      idx++;
    }
  }
  return JSON.stringify({
    version: 3, coins: coins,
    lifetime_coins: coins,
    owned_themes: ALL_THEMES,
    equipped_theme: theme,
    best_streak: 12,
    lesson_selection: [1,2,3],
    last_mode_id: null, daily_goals: null, stats_today: null,
    mastery: mastery_obj,
    last_choices_by_mode: choice_count ? { 'quick_run': choice_count } : {},
    lessons_attempted_ever: []
  });
}

async function goto_home(page, theme, coins) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [STORAGE_KEY, make_save(theme, coins, null)]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#app', { timeout: 5000 });
}

async function capture(page, name) {
  const p = path.join(OUT_DIR, name + '.png');
  await page.screenshot({ path: p });
  console.log('[matrix] saved', name + '.png');
  return p;
}

async function run_home(browser, theme, vp, label) {
  const vp_label = vp.width === 375 ? 'mobile' : 'desktop';
  const page = await browser.newPage({ viewport: vp });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  await goto_home(page, theme, 999999);
  await capture(page, theme + '-home-' + vp_label);
  await page.close();
}

async function run_wrong_feedback(browser, theme, vp, choice_count) {
  const vp_label = vp.width === 375 ? 'mobile' : 'desktop';
  const page = await browser.newPage({ viewport: vp });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  await goto_home(page, theme, 999999);

  // Click the choice count chip
  const chip = page.locator('.choices-chip').filter({ hasText: String(choice_count) });
  if (await chip.count() > 0) { await chip.first().click(); await page.waitForTimeout(200); }

  // Click Quick Run mode card
  const mode_btn = page.locator('button.mode-card').first();
  if (await mode_btn.count() === 0) {
    console.log('[matrix] WARN: no mode-card for', theme);
    await page.close();
    return;
  }
  await mode_btn.click();
  await page.waitForTimeout(600);

  if (await page.locator('.choices-grid').count() === 0) {
    console.log('[matrix] WARN: no choices-grid for', theme);
    await page.close();
    return;
  }

  // Deliberately click wrong: find correct answer index, click a different button
  const correct_index = await page.evaluate(() => {
    const btns = document.querySelectorAll('.choice-button');
    const question_elem = document.querySelector('.question-text');
    if (!question_elem || btns.length === 0) return -1;

    // Find which button is marked correct in the question rendering context
    // Use a heuristic: try to find it by evaluating which choice is correct
    // For now, we'll use index 0 by default but try to detect via data attributes
    const choices_grid = document.querySelector('.choices-grid');
    if (!choices_grid) return 0;

    // Fallback: assume first button is correct for most questions, but we'll click
    // a different one. If this doesn't work, the test needs DOM markup changes.
    return 0;
  });

  // Click a button that is NOT at correct_index
  const btns = page.locator('.choice-button');
  const btn_count = await btns.count();
  let click_index = correct_index === 0 ? 1 : 0;
  if (click_index >= btn_count) click_index = 0;
  if (click_index === correct_index && btn_count > 1) click_index = 1;

  await btns.nth(click_index).click();
  await page.waitForTimeout(900); // wait for feedback animations

  // Verify wrong state was reached: check for wrong-feedback marker
  const wrong_reached = await page.evaluate(() => {
    const wrong_btn = document.querySelector('.feedback-wrong');
    const teaching = document.querySelector('.teaching-panel');
    return !!(wrong_btn || teaching);
  });

  if (!wrong_reached) {
    console.log('[matrix] WARN: wrong-state not reached for', theme, '- retrying with different button');
    // Try clicking another button
    for (let retry = 0; retry < btn_count - 1; retry++) {
      click_index = (click_index + 1) % btn_count;
      await btns.nth(click_index).click();
      await page.waitForTimeout(900);
      const retry_wrong = await page.evaluate(() => {
        const wrong_btn = document.querySelector('.feedback-wrong');
        const teaching = document.querySelector('.teaching-panel');
        return !!(wrong_btn || teaching);
      });
      if (retry_wrong) break;
    }
  }

  await capture(page, theme + '-wrong-' + choice_count + '-' + vp_label);
  await page.close();
}

async function run_shop(browser, theme) {
  const page = await browser.newPage({ viewport: DESKTOP });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  await goto_home(page, theme, 999999);
  const shop_btn = page.locator('button:has-text("Shop")');
  if (await shop_btn.count() > 0) {
    await shop_btn.first().click();
    await page.waitForTimeout(500);
    await capture(page, theme + '-shop-desktop');
  } else {
    console.log('[matrix] WARN: no Shop button for', theme);
  }
  await page.close();
}

async function run_mastery(browser, theme, vp_size = DESKTOP) {
  const vp_label = vp_size.width === 375 ? 'mobile' : 'desktop';
  const page = await browser.newPage({ viewport: vp_size });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  const seeded_save = make_save(theme, 999999, null, true);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [STORAGE_KEY, seeded_save]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#app', { timeout: 5000 });
  const mastery_btn = page.locator('button:has-text("Mastery")');
  if (await mastery_btn.count() > 0) {
    await mastery_btn.first().click();
    await page.waitForTimeout(500);
    await capture(page, theme + '-mastery-' + vp_label);
  } else {
    console.log('[matrix] WARN: no Mastery button for', theme);
  }
  await page.close();
}

async function run_results(browser, theme) {
  const page = await browser.newPage({ viewport: DESKTOP });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  await goto_home(page, theme, 999999);
  const results_btn = page.locator('button:has-text("Results")');
  if (await results_btn.count() > 0) {
    await results_btn.first().click();
    await page.waitForTimeout(500);
    await capture(page, theme + '-results-desktop');
  } else {
    console.log('[matrix] WARN: no Results button for', theme);
  }
  await page.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    // Home all 10 themes desktop
    console.log('[matrix] HOME: all 10 themes desktop');
    for (const theme of ALL_THEMES) await run_home(browser, theme, DESKTOP, 'desktop');

    // 8-wrong all 10 themes desktop
    console.log('[matrix] WRONG-8: all 10 themes desktop');
    for (const theme of ALL_THEMES) await run_wrong_feedback(browser, theme, DESKTOP, 8);

    // Mobile home + wrong: sky, galaxy, arcade_neon
    console.log('[matrix] MOBILE: sky, galaxy, arcade_neon');
    for (const theme of MOBILE_THEMES) {
      await run_home(browser, theme, MOBILE, 'mobile');
      await run_wrong_feedback(browser, theme, MOBILE, 8);
    }

    // Shop: sky, underwater desktop
    console.log('[matrix] SHOP: sky, underwater desktop');
    for (const theme of SAMPLE_THEMES) await run_shop(browser, theme);

    // Mastery: sky, underwater desktop + sky mobile
    console.log('[matrix] MASTERY: sky, underwater desktop + sky mobile');
    for (const theme of SAMPLE_THEMES) await run_mastery(browser, theme, DESKTOP);
    await run_mastery(browser, 'sky', MOBILE);

    // Results: sky, underwater desktop
    console.log('[matrix] RESULTS: sky, underwater desktop');
    for (const theme of SAMPLE_THEMES) await run_results(browser, theme);

    console.log('[matrix] Done. Screenshots in', OUT_DIR);
  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error('[matrix] FATAL:', err); process.exit(1); });
