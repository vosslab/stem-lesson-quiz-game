# Related projects

A sourced map of projects related to the stem-lesson-quiz-game: its upstream
template, build and test dependencies, same-author sibling repos, and
same-domain alternatives. Maintained by Neil Voss
(https://bsky.app/profile/neilvosslab.bsky.social).

## Confirmed related projects

### starter-repo-template
- Relationship: upstream template
- Link: https://github.com/vosslab/starter-repo-template
- Evidence: git history shows "reset repo to base template" and "updated from
  template" commits; the centrally-maintained style docs
  ([docs/REPO_STYLE.md](REPO_STYLE.md), [docs/PYTHON_STYLE.md](PYTHON_STYLE.md),
  [docs/PYTEST_STYLE.md](PYTEST_STYLE.md),
  [docs/TYPESCRIPT_STYLE.md](TYPESCRIPT_STYLE.md),
  [docs/MARKDOWN_STYLE.md](MARKDOWN_STYLE.md),
  [docs/CLAUDE_HOOK_USAGE_GUIDE.md](CLAUDE_HOOK_USAGE_GUIDE.md)) are propagated
  from it and marked do-not-edit-locally.
- Notes: provides the `REPO_TYPE=typescript` overlay, propagation system, and
  reusable devel scripts. This repo tracks it for future propagation.

### esbuild
- Relationship: direct dependency
- Link: https://github.com/evanw/esbuild
- Evidence: listed in `package.json` devDependencies; bundles all `src/*.ts`
  into `dist/main.js` per [docs/CODE_ARCHITECTURE.md](CODE_ARCHITECTURE.md).

### typescript
- Relationship: direct dependency
- Link: https://github.com/microsoft/TypeScript
- Evidence: listed in `package.json` devDependencies; the entire `src/`
  game is authored in TypeScript and typechecked in `check_codebase.sh`.

### Playwright
- Relationship: direct dependency
- Link: https://github.com/microsoft/playwright
- Evidence: `@playwright/test`, `playwright`, and `playwright-core` are in
  `package.json`; drives the browser smoke tests under `tests/playwright/`
  (see [docs/PLAYWRIGHT_USAGE.md](PLAYWRIGHT_USAGE.md)).

### tsx, eslint, prettier, http-server
- Relationship: direct dependencies
- Link: https://github.com/privatenumber/tsx
- Evidence: listed together in `package.json` devDependencies; `tsx` runs the
  TypeScript toolchain, `eslint`/`prettier` lint and format `src/`, and
  `http-server` backs `run_web_server.sh` for local play.
- Notes: eslint https://github.com/eslint/eslint, prettier
  https://github.com/prettier/prettier, http-server
  https://github.com/http-party/http-server.

### biology-problems
- Relationship: same-author sibling repo
- Link: https://github.com/vosslab/biology-problems
- Evidence: same maintainer (vosslab); Python question-bank generators for
  biology courses, a shared education-content lineage with this repo's Python
  stem-extraction pipeline (`tools/extract_stems.py`, `tools/yaml_to_json.py`).
- Notes: no direct code dependency; shared authoring conventions only.

### qti-package-maker
- Relationship: same-author sibling repo
- Link: https://github.com/vosslab/qti-package-maker
- Evidence: same maintainer (vosslab); converts question banks into QTI and
  LMS formats (Canvas, Blackboard, HTML).
- Notes: no direct integration with this game today; a candidate export target
  if quiz content ever needs LMS packaging.

### science-choose-adventure
- Relationship: same-author sibling repo
- Link: https://github.com/vosslab/science-choose-adventure
- Evidence: same maintainer (vosslab); another TypeScript browser education
  game, sharing the static single-page architecture and toolchain of this repo.

### ncaa-school-find-game
- Relationship: same-author sibling repo
- Link: https://github.com/vosslab/ncaa-school-find-game
- Evidence: same maintainer (vosslab); a browser quiz game with difficulty
  tiers and streak tracking, mirroring this repo's streak-and-progression
  design.

## Possible related projects

### Blooket
- Relationship: same-domain alternative and design inspiration
- Link: https://www.blooket.com/
- Evidence: README describes the game as "Blooket-lite" with coin rewards and
  unlockable themes; design intent only, no shared code.
- Confidence: medium

### Kahoot, Gimkit, Quizlet
- Relationship: same-domain alternatives
- Link: https://kahoot.com/
- Evidence: mainstream classroom quiz-game platforms that solve the same
  fast-play vocabulary-drill workflow; no repo link or shared code.
- Confidence: low
- Notes: Gimkit https://www.gimkit.com/, Quizlet https://quizlet.com/.

## Evidence notes

Confirmed entries rest on concrete repo evidence: `package.json`
dependencies, git history naming the `starter-repo-template` origin, and the
propagated do-not-edit style docs under `docs/`. Same-author siblings are
confirmed by shared ownership on the maintainer's public GitHub profile
(vosslab) and by overlapping education-game or question-bank purpose; none
have a direct code dependency on this repo. Possible entries are named
design inspirations (Blooket) or mainstream same-domain platforms with no
repo link.
