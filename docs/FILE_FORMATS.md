# File formats

Input and output data formats for the stem-lesson-quiz-game. This doc covers the
question bundle the game reads at load time and the browser save the game writes.
It is aimed at anyone editing lesson content or debugging save state.

## Stems bundle (input)

The game loads all lessons and stems from a single JSON file, `data/stems_bundle.json`.
The current bundle holds 20 lessons numbered 1 to 20 and 140 stems total. It is
built from YAML source by the extract/convert tools; see [docs/USAGE.md](USAGE.md)
for the pipeline (`tools/extract_stems.py`, `tools/yaml_to_json.py`).

### How it loads

- Hosted build: `src/data_loader.ts` calls `fetch("stems_bundle.json")` from the served site.
- Portable single-file build: `export_single_file.sh` injects the bundle onto
  `window.__STEMS_BUNDLE__`, so `file://` builds skip `fetch()` entirely.
- A failed hosted fetch throws with the HTTP status; the game does not ship a fallback bundle.

### Schema

Top level is an object with one `lessons` array. Each lesson has an integer
`lesson` number and a `stems` array. Each stem has four required string fields.

```json
{
  "lessons": [
    {
      "lesson": 1,
      "stems": [
        {
          "stem": "aliga",
          "meaning": "pain",
          "example_word": "cephalgia",
          "example_definition": "headache; throbbing head pain"
        }
      ]
    }
  ]
}
```

| Field | Type | Notes |
| --- | --- | --- |
| lessons | array | One entry per lesson; order preserved on load |
| lessons[].lesson | integer | Lesson number; used to build the lesson id `L<number>` |
| lessons[].stems | array | Stems belonging to that lesson |
| stems[].stem | string | The root or stem, keyed as `L<lesson>_<stem>` internally |
| stems[].meaning | string | Short gloss shown as the correct answer |
| stems[].example_word | string | A word that uses the stem |
| stems[].example_definition | string | Definition of the example word |

All four stem fields are required. `src/data_loader.ts` reads each key directly,
so a missing key surfaces as a load-time error rather than a silent default.

## Save data (output)

The game persists progress to browser `localStorage` under a single root key,
`stems_quiz_v1` (see `src/persist.ts`). The schema is versioned so future
migrations can detect drift; the current version is `3` (`SAVE_SCHEMA_VERSION`
in `src/types/save.ts`).

### Top-level fields

| Field | Type | Notes |
| --- | --- | --- |
| version | integer | Save schema version, currently 3 |
| coins | integer | Spendable coin balance |
| lifetime_coins | integer | Total coins ever earned |
| owned_themes | array | Theme ids the kid owns; starts with `sky` |
| equipped_theme | string | Currently equipped theme id |
| best_streak | integer | Longest correct streak |
| lesson_selection | array | Lesson numbers currently selected for play |
| last_mode_id | string or null | Last game mode played |
| daily_goals | object or null | Today's goal set; null before first play of the day |
| stats_today | object or null | Per-day counters; null before first play of the day |
| mastery | object | Map of stem id to mastery counters |
| last_choices_by_mode | object | Map of mode id to last chosen count |
| lessons_attempted_ever | array | Lifetime list of attempted lesson ids; never resets |

### Nested shapes

- Mastery counters (`mastery` values): `correct`, `wrong`, and `last_two_correct`
  (a boolean list) drive the weak-stem and mastered-stem logic.
- Daily stats (`stats_today`): daily-reset counters such as `questions_answered`,
  `stems_mastered_today`, `seconds_played`, `goals_completed_today`, plus flags
  like `shop_visited_today` and lists like `weak_stems_practiced_today`.

### Reset behavior

- Clearing browser cache or `localStorage` wipes `stems_quiz_v1`. There is no
  cloud backup by design; see [docs/ROADMAP.md](ROADMAP.md) intentional non-goals.
- Daily fields roll over on the browser's local date. See
  [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md) for clock-related rollover notes.

## Related docs

- [docs/USAGE.md](USAGE.md): the YAML-to-JSON build pipeline that produces the bundle.
- [docs/CODE_ARCHITECTURE.md](CODE_ARCHITECTURE.md): how the loader and persistence fit the module map.
