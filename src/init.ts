// Entry point. Wires all scenes through the ScreenState machine.
// Boot order: load bundle -> apply saved theme -> subscribe renderer ->
// transition to home.

import type { Bundle } from "./types/stem";
import type { Question, RoundState, AnswerResult, RoundConfig } from "./types/question";
import type { ScreenState } from "./types/screen";
import type { ThemeId } from "./types/cosmetic";
import { DEFAULT_CHOICES_PER_QUESTION } from "./constants";

import { load_bundle } from "./data_loader";
import { load_save, mutate_save } from "./persist";
import { get_state, subscribe, transition } from "./screen_state";

import { start_round, answer, next_question, is_round_over } from "./round";
import { award_correct, award_mastery, award_round_end, get_balance } from "./coins";
import {
  ensure_today,
  record_event,
  grant_goal_rewards,
  check_and_grant_completion_bonuses,
} from "./daily_goals";
import { record_answer_for_stem, mastery_summary } from "./mastery";
import type { GoalDefinition } from "./types/daily_goal";
import type { LessonId } from "./brands";

import { render_home_screen } from "./scene_home";
import { render_results_screen } from "./scene_results";
import { render_shop_screen } from "./scene_shop";
import { render_goals_screen } from "./scene_goals";
import { render_mastery_screen } from "./scene_mastery";
import { render_question_screen, flash_answer_feedback, show_streak_banner } from "./ui_rendering";
import { bind_play_keys, bind_home_keys } from "./input";
import { streak_banner_for } from "./feedback";

let app_root: HTMLElement;
let cached_bundle: Bundle;
let active_unbind_keys: (() => void) | null = null;
let active_unbind_esc: (() => void) | null = null;
let pending_question: Question | null = null;
let play_seconds_interval: ReturnType<typeof setInterval> | null = null; // Reserved for future teardown

//============================================

// Funnel any newly-completed daily goals through coin grant + completion-bonus
// check. Returns total coins awarded so callers can add to round.coins_earned.
// Centralizing this keeps every new record_* call site consistent with the
// existing handle_choice pattern.
function grant_and_check_bonuses(completed: GoalDefinition[]): number {
  const goal_coins = grant_goal_rewards(completed);
  const bonus_coins = check_and_grant_completion_bonuses();
  return goal_coins + bonus_coins;
}

// Map RoundConfig.selected_lesson_numbers -> LessonId[] for daily-goal
// tracking. LessonId is a branded string sourced from bundle.lessons.
function lesson_ids_for_round(round: RoundState): LessonId[] {
  const wanted = new Set(round.config.selected_lesson_numbers);
  const ids: LessonId[] = [];
  for (const lesson of cached_bundle.lessons) {
    if (wanted.has(lesson.number)) {
      ids.push(lesson.id);
    }
  }
  return ids;
}

// Called at round start. Fires record_lesson_attempted; coins/bonuses land on
// the current round so the kid sees them in coins_earned on the results screen.
function on_round_started(round: RoundState): void {
  const lesson_ids = lesson_ids_for_round(round);
  const lesson_progress = record_event({
    kind: "lesson_attempted",
    lesson_ids,
  });
  const coins = grant_and_check_bonuses(lesson_progress.newly_completed);
  round.coins_earned += coins;
}

//============================================

function set_root_content(node: HTMLElement): void {
  app_root.replaceChildren(node);
  if (active_unbind_keys !== null) {
    active_unbind_keys();
    active_unbind_keys = null;
  }
}

//============================================

function render_home(): void {
  const save = load_save();
  const today = ensure_today();
  const completed = today.progress.filter((p) => p.completed).length;
  const summary = mastery_summary(cached_bundle);

  // Callback for mode selection via keyboard
  const handle_mode_selection = (config: RoundConfig): void => {
    // Determine which mode was selected by config shape
    let mode_id = "quick_run"; // default
    if (config.endless) {
      mode_id = "endless";
    } else if (config.target_question_count === 25) {
      mode_id = "challenge";
    }
    mutate_save((s) => {
      s.last_mode_id = mode_id;
    });
    const round = start_round(cached_bundle, config);
    on_round_started(round);
    transition({ kind: "question", round });
  };

  const home = render_home_screen({
    bundle: cached_bundle,
    selected_lessons: save.lesson_selection,
    last_mode_id: save.last_mode_id,
    best_streak: save.best_streak,
    coin_balance: get_balance(),
    lifetime_coins: save.lifetime_coins,
    daily_goal_progress: { completed, total: today.progress.length },
    mastery_count: summary.mastered,
    last_choices_by_mode: save.last_choices_by_mode,
    on_play: (config) => {
      handle_mode_selection(config);
    },
    on_lesson_toggle: (lesson_num, on) => {
      mutate_save((s) => {
        const idx = s.lesson_selection.indexOf(lesson_num);
        if (on && idx < 0) {
          s.lesson_selection.push(lesson_num);
          s.lesson_selection.sort((a, b) => a - b);
        } else if (!on && idx >= 0) {
          s.lesson_selection.splice(idx, 1);
        }
      });
      transition({ kind: "home" });
    },
    on_select_all: () => {
      mutate_save((s) => {
        s.lesson_selection = cached_bundle.lessons.map((l) => l.number);
      });
      transition({ kind: "home" });
    },
    on_clear: () => {
      mutate_save((s) => {
        s.lesson_selection = [];
      });
      transition({ kind: "home" });
    },
    on_open_shop: () => transition({ kind: "shop" }),
    on_open_goals: () => transition({ kind: "goals" }),
    on_open_mastery: () => transition({ kind: "mastery" }),
    on_choices_changed: (mode_id, count) => {
      mutate_save((s) => {
        s.last_choices_by_mode[mode_id] = count;
      });
      transition({ kind: "home" });
    },
  });
  set_root_content(home);

  // Bind keyboard keys for mode selection: 1, 2, 3
  const GAME_MODE_CONFIGS = [
    { id: "quick_run", endless: false, target_question_count: 10 },
    { id: "challenge", endless: false, target_question_count: 25 },
    { id: "endless", endless: true, target_question_count: 999 },
  ];
  active_unbind_keys = bind_home_keys({
    on_mode_select: (idx) => {
      if (idx >= 0 && idx < GAME_MODE_CONFIGS.length && save.lesson_selection.length > 0) {
        const mode_config = GAME_MODE_CONFIGS[idx];
        const config: RoundConfig = {
          selected_lesson_numbers: save.lesson_selection,
          endless: mode_config.endless,
          target_question_count: mode_config.target_question_count,
          choices_per_question:
            save.last_choices_by_mode[mode_config.id] ?? DEFAULT_CHOICES_PER_QUESTION,
          // Mode gate: matches scene_home.ts logic - Quick Run skips retry.
          enable_retry: mode_config.endless || mode_config.target_question_count > 10,
        };
        handle_mode_selection(config);
      }
    },
  });
}

//============================================

function render_question(round: RoundState): void {
  if (is_round_over(round)) {
    finish_round(round);
    return;
  }
  const q = next_question(cached_bundle, round);
  pending_question = q;
  const screen = render_question_screen({
    question: q,
    round,
    on_choice: (chosen) => {
      void handle_choice(round, chosen);
    },
    on_home: () => transition({ kind: "home" }),
  });
  set_root_content(screen);
  active_unbind_keys = bind_play_keys({
    on_choice: (idx) => {
      if (idx >= 0 && idx < q.choices.length) {
        const choice = q.choices[idx];
        if (choice !== undefined) {
          void handle_choice(round, choice);
        }
      }
    },
    on_home: () => transition({ kind: "home" }),
  });
}

//============================================

async function handle_choice(round: RoundState, chosen: string): Promise<void> {
  const q = pending_question;
  if (q === null) {
    return;
  }
  pending_question = null;
  const result: AnswerResult = answer(round, q, chosen);

  if (result.correct) {
    const coins_added = award_correct(round);
    round.coins_earned += coins_added;
  }

  // Mastery + daily goals
  const mastery_result = record_answer_for_stem(q.source_stem, result.correct);
  const goal_progress = record_event({
    kind: "answer",
    was_correct: result.correct,
    current_streak: round.current_streak,
  });
  const completed_goals = [...goal_progress.newly_completed];
  if (mastery_result.newly_mastered) {
    const master_result = record_event({ kind: "master_stem" });
    completed_goals.push(...master_result.newly_completed);
    // H1m: always-on coin bonus when a stem flips to mastered.
    const mastery_coins = award_mastery();
    round.coins_earned += mastery_coins;
  }
  // Weak-stem credit must use was_weak_before (captured prior to the mastery
  // mutate) so a just-improved stem still counts as practiced-while-weak.
  if (mastery_result.was_weak_before) {
    const weak_result = record_event({
      kind: "weak_stem_practiced",
      stem_id: q.source_stem.id,
    });
    completed_goals.push(...weak_result.newly_completed);
  }
  // Single funnel: pay goal coins + run completion-bonus check once per
  // choice handle so the 3/5 bonuses fire at most once per answer.
  const total_goal_coins = grant_and_check_bonuses(completed_goals);
  round.coins_earned += total_goal_coins;

  const scene = app_root.firstElementChild as HTMLElement | null;
  if (scene !== null) {
    await flash_answer_feedback(scene, result, cached_bundle);
  }

  const banner = streak_banner_for(round.current_streak);
  if (banner !== null) {
    await show_streak_banner(banner);
  }

  // Re-render to show next question or finish round.
  transition({ kind: "question", round });
}

//============================================

function finish_round(round: RoundState): void {
  const end_coins = award_round_end(round);
  round.coins_earned += end_coins;

  // Round-shape daily goals: accuracy_80, finish_quick_run,
  // finish_challenge_run, flawless_10. Funnel through the same grant +
  // completion-bonus path used by handle_choice.
  const round_progress = record_event({ kind: "round_end", round });
  const goal_coins = grant_and_check_bonuses(round_progress.newly_completed);
  round.coins_earned += goal_coins;

  const save = load_save();
  const new_best_streak = round.longest_streak > save.best_streak;
  mutate_save((s) => {
    if (round.longest_streak > s.best_streak) {
      s.best_streak = round.longest_streak;
    }
  });

  transition({ kind: "results", round });
  const results = render_results_screen({
    round,
    coins_earned: round.coins_earned,
    lifetime_coins: save.lifetime_coins,
    new_best_streak,
    on_play_again: () => {
      const fresh = start_round(cached_bundle, round.config);
      on_round_started(fresh);
      transition({ kind: "question", round: fresh });
    },
    on_open_shop: () => transition({ kind: "shop" }),
    on_home: () => transition({ kind: "home" }),
  });
  set_root_content(results);
}

//============================================

function render_shop(): void {
  const screen = render_shop_screen({
    on_back: () => transition({ kind: "home" }),
    on_purchase_attempt: (_id: ThemeId, _result) => {
      // Purchase already occurred in scene_shop.ts; this callback is for
      // future state updates if needed. For now, no action required.
    },
  });
  set_root_content(screen);
}

//============================================

function render_goals(): void {
  const screen = render_goals_screen({
    on_back: () => transition({ kind: "home" }),
  });
  set_root_content(screen);
}

//============================================

function render_mastery(): void {
  const screen = render_mastery_screen({
    bundle: cached_bundle,
    on_back: () => transition({ kind: "home" }),
  });
  set_root_content(screen);
}

//============================================

function on_screen_change(state: ScreenState): void {
  // Clear play timer when leaving question screen
  if (state.kind !== "question" && play_seconds_interval !== null) {
    clearInterval(play_seconds_interval);
    play_seconds_interval = null;
  }

  // Start play timer when entering question screen
  if (state.kind === "question" && play_seconds_interval === null) {
    play_seconds_interval = setInterval(() => {
      record_event({ kind: "play_seconds", seconds: 15 });
    }, 15000);
  }

  // Bind Esc to return to home from shop/goals/mastery
  if (active_unbind_esc !== null) {
    active_unbind_esc();
    active_unbind_esc = null;
  }
  if (state.kind === "shop" || state.kind === "goals" || state.kind === "mastery") {
    function on_esc(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        e.preventDefault();
        transition({ kind: "home" });
      }
    }
    window.addEventListener("keydown", on_esc);
    active_unbind_esc = (): void => {
      window.removeEventListener("keydown", on_esc);
    };
  }

  switch (state.kind) {
    case "home":
      render_home();
      return;
    case "question":
      render_question(state.round);
      return;
    case "results":
      // finish_round renders results directly; the transition is here so
      // future subscribers can react.
      return;
    case "shop":
      render_shop();
      return;
    case "goals":
      render_goals();
      return;
    case "mastery":
      render_mastery();
      return;
  }
}

//============================================

async function main(): Promise<void> {
  const save = load_save();
  document.body.setAttribute("data-theme", save.equipped_theme);

  cached_bundle = await load_bundle();

  const root = document.getElementById("app");
  if (root === null) {
    throw new Error("Missing #app root element.");
  }
  app_root = root;

  subscribe(on_screen_change);
  // subscribe() fires immediately with current state (home). If get_state
  // is not home for some reason, force the transition explicitly.
  if (get_state().kind !== "home") {
    transition({ kind: "home" });
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  const root = document.getElementById("app");
  if (root !== null) {
    root.textContent = `Error: ${msg}`;
  }
});
