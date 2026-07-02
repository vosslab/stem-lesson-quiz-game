// Daily goals: refresh at local midnight, track progress, grant rewards.
// 5 per day from stratified pool. Completion bonuses at 3/5 completed.
//
// Centralized event dispatch (2026-05-18): there is ONE funnel, record_event.
// Each goal in GOAL_POOL declares its own handle(event, prog, save) function,
// so adding a new GoalId without wiring a handler is a TS compile error
// (GOAL_POOL is typed GoalDefinition[]). Handlers are side-effect-free; the
// dispatcher mutates persisted counters in stats_today BEFORE calling the
// handlers so they always see fresh values.

import type {
  GameEvent,
  GoalDefinition,
  DailyGoalProgress,
  DailyGoalsToday,
} from "./types/daily_goal";
import type { SaveSchemaV1 } from "./types/save";
import { DAILY_GOAL_REWARD_CAP } from "./constants";
import { load_save, mutate_save } from "./persist";

// Phase 1: hardcoded accuracy threshold for accuracy_80 goal.
// Independent of ROUND_GOOD_ACCURACY (round-bonus knob) so future tuning of
// the bonus knob does not accidentally retune what the daily goal demands.
const ACCURACY_80_THRESHOLD = 0.8;

// Phase 1: target question count constants for the mode-detection goals.
// These mirror src/init.ts mode configs; if mode configs ever change, update here.
const QUICK_RUN_QUESTION_COUNT = 10;
const CHALLENGE_RUN_QUESTION_COUNT = 25;
const FLAWLESS_10_REQUIRED_CORRECT = 10;

//============================================
// Per-goal handlers. Each returns the new value for prog.current.
// Goals not interested in this event kind return prog.current unchanged
// (i.e. a no-op). The central dispatch reads prog.current after the call
// and flips prog.completed when it crosses target.
//============================================

// answer_10: raw counter from stats_today (bumped by dispatch pre-handler).
function handle_answer_10(event: GameEvent, prog: DailyGoalProgress, save: SaveSchemaV1): number {
  if (event.kind !== "answer") return prog.current;
  if (save.stats_today === null) return prog.current;
  return save.stats_today.questions_answered;
}

// five_in_a_row: keep the highest correct-streak seen today.
function handle_five_in_a_row(
  event: GameEvent,
  prog: DailyGoalProgress,
  _save: SaveSchemaV1,
): number {
  if (event.kind !== "answer") return prog.current;
  if (event.was_correct && event.current_streak > prog.current) {
    return event.current_streak;
  }
  return prog.current;
}

// beat_streak: save.best_streak still holds the prior lifetime best during
// play (init.ts only refreshes it at finish_round), so direct compare is safe.
function handle_beat_streak(event: GameEvent, prog: DailyGoalProgress, save: SaveSchemaV1): number {
  if (event.kind !== "answer") return prog.current;
  if (event.was_correct && event.current_streak > save.best_streak) {
    return 1;
  }
  return prog.current;
}

// play_5_minutes: read the dispatch-bumped seconds_played counter.
function handle_play_5_minutes(
  event: GameEvent,
  prog: DailyGoalProgress,
  save: SaveSchemaV1,
): number {
  if (event.kind !== "play_seconds") return prog.current;
  if (save.stats_today === null) return prog.current;
  return save.stats_today.seconds_played;
}

// master_new_stem / master_3_stems: both read the dispatch-bumped
// stems_mastered_today counter; targets differ (1 vs 3).
function handle_master_stem_counter(
  event: GameEvent,
  prog: DailyGoalProgress,
  save: SaveSchemaV1,
): number {
  if (event.kind !== "master_stem") return prog.current;
  if (save.stats_today === null) return prog.current;
  return save.stats_today.stems_mastered_today;
}

// accuracy_80: fires on any round end with >=80% accuracy and at least one
// answered question. Endless rounds count if the kid quits with that accuracy.
function handle_accuracy_80(
  event: GameEvent,
  prog: DailyGoalProgress,
  _save: SaveSchemaV1,
): number {
  if (event.kind !== "round_end") return prog.current;
  const r = event.round;
  const total_answered = r.correct_count + r.wrong_count;
  if (total_answered === 0) return prog.current;
  const accuracy = r.correct_count / total_answered;
  if (accuracy >= ACCURACY_80_THRESHOLD) return 1;
  return prog.current;
}

// finish_quick_run: bounded round whose configured length matches Quick Run.
function handle_finish_quick_run(
  event: GameEvent,
  prog: DailyGoalProgress,
  _save: SaveSchemaV1,
): number {
  if (event.kind !== "round_end") return prog.current;
  const r = event.round;
  if (r.config.endless) return prog.current;
  if (r.config.target_question_count === QUICK_RUN_QUESTION_COUNT) return 1;
  return prog.current;
}

// finish_challenge_run: bounded round whose length matches Challenge.
function handle_finish_challenge_run(
  event: GameEvent,
  prog: DailyGoalProgress,
  _save: SaveSchemaV1,
): number {
  if (event.kind !== "round_end") return prog.current;
  const r = event.round;
  if (r.config.endless) return prog.current;
  if (r.config.target_question_count === CHALLENGE_RUN_QUESTION_COUNT) return 1;
  return prog.current;
}

// flawless_10: exactly 10 correct, zero wrong, bounded run.
function handle_flawless_10(
  event: GameEvent,
  prog: DailyGoalProgress,
  _save: SaveSchemaV1,
): number {
  if (event.kind !== "round_end") return prog.current;
  const r = event.round;
  if (r.config.endless) return prog.current;
  if (r.correct_count === FLAWLESS_10_REQUIRED_CORRECT && r.wrong_count === 0) {
    return 1;
  }
  return prog.current;
}

// visit_shop: dispatch already flipped stats_today.shop_visited_today.
function handle_visit_shop(event: GameEvent, prog: DailyGoalProgress, _save: SaveSchemaV1): number {
  if (event.kind !== "shop_visit") return prog.current;
  return 1;
}

// use_different_theme: dispatch captures session_start_theme on first equip
// of the day; handler trips once the equipped id no longer matches baseline.
function handle_use_different_theme(
  event: GameEvent,
  prog: DailyGoalProgress,
  save: SaveSchemaV1,
): number {
  if (event.kind !== "theme_equipped") return prog.current;
  if (save.stats_today === null) return prog.current;
  const baseline = save.stats_today.session_start_theme;
  if (baseline !== null && event.theme_id !== baseline) return 1;
  return prog.current;
}

// try_new_lesson: dispatch appended any brand-new lesson ids to
// lessons_attempted_ever. Handler fires when at least one of the event's
// lesson ids is in the lifetime list but the goal has not yet hit target.
// Concretely: if any incoming lesson id was previously unknown, the dispatch
// just added it -- detect that by checking each id against the pre-bump list
// is not possible here (already mutated), so we rely on the dispatch having
// only emitted lesson_attempted events with at least one id. The right check
// is: dispatch only fires the handler when the event included any new id,
// which we cannot know post-bump. Instead, mirror the original logic:
// fire the goal whenever a lesson_attempted event arrives AND at least one of
// the event's lesson ids is present in lessons_attempted_ever (always true
// after dispatch). That over-trips. To preserve the "only on NEW lesson"
// semantic, the dispatch must compute saw_new_lesson before mutation and
// thread it through. See record_event below.
function handle_try_new_lesson(
  event: GameEvent,
  prog: DailyGoalProgress,
  _save: SaveSchemaV1,
): number {
  // Dispatch sets event.lesson_ids to a non-empty list ONLY when at least
  // one id was previously unseen (the pre-mutation filter happens inside
  // record_event). On no-new-lesson events the dispatch substitutes an
  // empty list, which we treat as a no-op here.
  if (event.kind !== "lesson_attempted") return prog.current;
  if (event.lesson_ids.length === 0) return prog.current;
  return 1;
}

// practice_weak_stem: dispatch dedups against weak_stems_practiced_today
// and only forwards stem ids that were NOT in the list pre-mutation. So if
// the event arrives at all, it means the stem is freshly practiced today.
function handle_practice_weak_stem(
  event: GameEvent,
  prog: DailyGoalProgress,
  _save: SaveSchemaV1,
): number {
  if (event.kind !== "weak_stem_practiced") return prog.current;
  return 1;
}

//============================================

export const GOAL_POOL: GoalDefinition[] = [
  // Easy tier: first-session reachable.
  {
    id: "answer_10",
    display_text: "Answer 10 questions today",
    target: 10,
    reward_coins: 20,
    tier: "easy",
    handle: handle_answer_10,
  },
  {
    id: "play_5_minutes",
    display_text: "Play for 5 minutes",
    target: 300,
    reward_coins: 30,
    tier: "easy",
    handle: handle_play_5_minutes,
  },
  {
    id: "visit_shop",
    display_text: "Visit the shop",
    target: 1,
    reward_coins: 10,
    tier: "easy",
    handle: handle_visit_shop,
  },
  {
    id: "use_different_theme",
    display_text: "Use a different theme",
    target: 1,
    reward_coins: 15,
    tier: "easy",
    handle: handle_use_different_theme,
  },
  {
    id: "accuracy_80",
    display_text: "Get 80% accuracy in a round",
    target: 1,
    reward_coins: 40,
    tier: "easy",
    handle: handle_accuracy_80,
  },
  {
    id: "finish_quick_run",
    display_text: "Finish a Quick Run",
    target: 1,
    reward_coins: 30,
    tier: "easy",
    handle: handle_finish_quick_run,
  },
  // Medium tier: achievable with normal play.
  {
    id: "five_in_a_row",
    display_text: "Get 5 correct in a row",
    target: 5,
    reward_coins: 25,
    tier: "medium",
    handle: handle_five_in_a_row,
  },
  {
    id: "master_new_stem",
    display_text: "Master a new stem",
    target: 1,
    reward_coins: 30,
    tier: "medium",
    handle: handle_master_stem_counter,
  },
  {
    id: "try_new_lesson",
    display_text: "Try a new lesson",
    target: 1,
    reward_coins: 25,
    tier: "medium",
    handle: handle_try_new_lesson,
  },
  {
    id: "finish_challenge_run",
    display_text: "Finish a Challenge Run",
    target: 1,
    reward_coins: 50,
    tier: "medium",
    handle: handle_finish_challenge_run,
  },
  {
    id: "practice_weak_stem",
    display_text: "Practice a weak stem",
    target: 1,
    reward_coins: 25,
    tier: "medium",
    handle: handle_practice_weak_stem,
  },
  {
    id: "beat_streak",
    display_text: "Beat your best streak",
    target: 1,
    reward_coins: 75,
    tier: "medium",
    handle: handle_beat_streak,
  },
  // Hard tier: challenging.
  {
    id: "flawless_10",
    display_text: "Get a flawless 10-question run",
    target: 1,
    reward_coins: 75,
    tier: "hard",
    handle: handle_flawless_10,
  },
  {
    id: "master_3_stems",
    display_text: "Master 3 stems today",
    target: 3,
    reward_coins: 60,
    tier: "hard",
    handle: handle_master_stem_counter,
  },
];

//============================================

export function today_iso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

//============================================

export function ensure_today(): DailyGoalsToday {
  const save = load_save();
  const current_date = today_iso();

  // If no goals exist or date doesn't match, create fresh goals for today.
  if (save.daily_goals === null || save.daily_goals.date !== current_date) {
    // Stratified draw: 2 easy + 2 medium + 1 hard.
    const easy = GOAL_POOL.filter((g) => g.tier === "easy");
    const medium = GOAL_POOL.filter((g) => g.tier === "medium");
    const hard = GOAL_POOL.filter((g) => g.tier === "hard");

    const selected_easy = shuffle_array([...easy]).slice(0, 2);
    const selected_medium = shuffle_array([...medium]).slice(0, 2);
    const selected_hard = shuffle_array([...hard]).slice(0, 1);

    const shuffled = shuffle_array([...selected_easy, ...selected_medium, ...selected_hard]);

    const progress: DailyGoalProgress[] = shuffled.map((goal) => ({
      goal,
      current: 0,
      completed: false,
    }));

    const today: DailyGoalsToday = {
      date: current_date,
      progress,
      completion_bonuses_awarded_today: {
        three: false,
        five: false,
      },
    };

    // Reset stats for today.
    const fresh_stats = {
      date: current_date,
      questions_answered: 0,
      stems_mastered_today: 0,
      seconds_played: 0,
      goal_rewards_count_today: 0,
      // M1 fix: persisted lifetime-of-day counter; survives the
      // completed=false reset that grant_goal_rewards performs.
      goals_completed_today: 0,
      // Phase 1 daily-reset fields. session_start_theme stays null until
      // the first theme_equipped event of the day (dispatch captures it).
      shop_visited_today: false,
      session_start_theme: null,
      weak_stems_practiced_today: [],
    };

    mutate_save((save) => {
      save.daily_goals = today;
      save.stats_today = fresh_stats;
    });

    return today;
  }

  return save.daily_goals;
}

//============================================

// THE funnel. Every caller goes through here. Adding a new goal kind only
// requires adding the GameEvent variant, the GOAL_POOL entry (with a handle:
// function), and -- if the dispatch needs to bump a counter -- a new case in
// the switch below. There are no scattered record_*() shims anymore.
export function record_event(event: GameEvent): { newly_completed: GoalDefinition[] } {
  ensure_today();
  const newly_completed: GoalDefinition[] = [];

  mutate_save((save) => {
    if (save.stats_today === null) {
      throw new Error("stats_today is null after ensure_today");
    }
    if (save.daily_goals === null) {
      throw new Error("daily_goals is null after ensure_today");
    }

    // Pre-mutation step: bump persisted counters and (for two event kinds)
    // trim event payloads to "fresh" ids so handlers can stay trivial.
    // This is the ONLY place save state mutates in response to events;
    // handlers downstream are pure reads.
    let dispatched_event: GameEvent = event;
    switch (event.kind) {
      case "answer":
        save.stats_today.questions_answered += 1;
        break;
      case "play_seconds":
        save.stats_today.seconds_played += event.seconds;
        break;
      case "master_stem":
        save.stats_today.stems_mastered_today += 1;
        break;
      case "shop_visit":
        save.stats_today.shop_visited_today = true;
        break;
      case "theme_equipped":
        // First equip of the day captures the baseline; no goal fires
        // on that first call (handler reads baseline and compares).
        if (save.stats_today.session_start_theme === null) {
          save.stats_today.session_start_theme = event.theme_id;
        }
        break;
      case "lesson_attempted": {
        // Filter to ONLY previously-unseen ids; append the new ones to
        // the lifetime tracker. Handler then trips if the resulting
        // list is non-empty. Avoids over-tripping try_new_lesson on
        // re-runs of already-seen lessons.
        const new_ids = event.lesson_ids.filter((id) => !save.lessons_attempted_ever.includes(id));
        for (const id of new_ids) {
          save.lessons_attempted_ever.push(id);
        }
        dispatched_event = { kind: "lesson_attempted", lesson_ids: new_ids };
        break;
      }
      case "weak_stem_practiced":
        // Dedup against today's list. If already practiced today, swap
        // the event for a no-op (handler ignores any non-matching kind,
        // but here we want to skip handler entirely). Simplest path:
        // early-return from the mutate_save block.
        if (save.stats_today.weak_stems_practiced_today.includes(event.stem_id)) {
          return;
        }
        save.stats_today.weak_stems_practiced_today.push(event.stem_id);
        break;
      case "round_end":
        // Round-shape goals read event.round directly; nothing to bump.
        break;
    }

    // Per-goal evaluation. Handlers return a new prog.current value;
    // dispatcher writes it and flips prog.completed once the target is hit.
    for (const prog of save.daily_goals.progress) {
      if (prog.completed) continue;
      const new_current = prog.goal.handle(dispatched_event, prog, save);
      prog.current = new_current;
      if (prog.current >= prog.goal.target) {
        prog.completed = true;
        newly_completed.push(prog.goal);
      }
    }
  });

  return { newly_completed };
}

//============================================

export function grant_goal_rewards(goals: GoalDefinition[]): number {
  let coins_granted = 0;

  mutate_save((save) => {
    if (!save.daily_goals || !save.stats_today) {
      return;
    }

    // Check cap: cannot grant more than DAILY_GOAL_REWARD_CAP awards per day.
    let remaining_cap = DAILY_GOAL_REWARD_CAP - save.stats_today.goal_rewards_count_today;
    if (remaining_cap <= 0) {
      return;
    }

    for (const goal of goals) {
      const progress = save.daily_goals.progress.find((p) => p.goal.id === goal.id);
      if (!progress) continue;

      // Grant reward if goal marked as completed (not already paid out).
      if (progress.completed && remaining_cap > 0) {
        save.coins += goal.reward_coins;
        save.lifetime_coins += goal.reward_coins;
        save.stats_today.goal_rewards_count_today += 1;
        // M1 fix: bump persisted completion counter BEFORE clearing
        // the completed flag, so check_and_grant_completion_bonuses
        // can still count this goal toward the 3/5 thresholds.
        save.stats_today.goals_completed_today += 1;
        coins_granted += goal.reward_coins;
        remaining_cap -= 1;

        // Mark as paid out so we don't grant again.
        progress.completed = false;
      }
    }
  });

  return coins_granted;
}

//============================================

export function check_and_grant_completion_bonuses(): number {
  let bonus_coins = 0;

  mutate_save((save) => {
    if (!save.daily_goals || !save.stats_today) {
      return;
    }

    // M1 fix: read the persisted day-counter instead of filtering on
    // prog.completed (which grant_goal_rewards just cleared to false).
    const completed_count = save.stats_today.goals_completed_today;
    const bonuses = save.daily_goals.completion_bonuses_awarded_today;

    // Check cap: cannot grant more than DAILY_GOAL_REWARD_CAP awards per day.
    let remaining_cap = DAILY_GOAL_REWARD_CAP - save.stats_today.goal_rewards_count_today;

    // Bonus for 3 goals completed (counts as 1 award, grants 50 coins).
    if (completed_count >= 3 && !bonuses.three && remaining_cap >= 1) {
      save.coins += 50;
      save.lifetime_coins += 50;
      save.stats_today.goal_rewards_count_today += 1;
      bonus_coins += 50;
      bonuses.three = true;
      remaining_cap -= 1;
    }

    // Bonus for all 5 goals completed (counts as 1 award, grants 150 coins).
    if (completed_count >= 5 && !bonuses.five && remaining_cap >= 1) {
      save.coins += 150;
      save.lifetime_coins += 150;
      save.stats_today.goal_rewards_count_today += 1;
      bonus_coins += 150;
      bonuses.five = true;
    }
  });

  return bonus_coins;
}

//============================================

export function get_today_answered_count(): number {
  // Always read from stats_today.questions_answered so the play HUD
  // keeps ticking up after the answer_10 daily goal completes.
  // (answer_10 progress freezes at target=10 once completed; the raw
  // counter does not, so it is the right source for the HUD widget.)
  ensure_today();
  const save = load_save();
  if (save.stats_today === null) {
    throw new Error("stats_today is null after ensure_today");
  }
  const answered_count = save.stats_today.questions_answered;
  return answered_count;
}

//============================================

function shuffle_array<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
