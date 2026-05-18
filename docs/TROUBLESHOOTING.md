# Troubleshooting

Known issues and debugging steps for the stem-lesson-quiz-game.

## Build and serve

- **`./setup_game.sh` fails on first run**: ensure Node.js and npm are installed (see [docs/INSTALL.md](INSTALL.md)). The script runs `npm install` and an initial TypeScript build.
- **`./run_web_server.sh` shows stale content**: the script rebuilds before serving. Hard-refresh the browser (Cmd+Shift+R) to bypass cache.
- **Port 8123 already in use**: `run_web_server.sh` now picks a random port (8000-8999) per session; rerun to get a fresh port, or pin one with `PORT=NNNN ./run_web_server.sh`. Stop a conflicting process with `lsof -i :NNNN`.
- **Shop buttons look wrong, theme not changing, or a new feature is missing**: the browser is likely serving stale `main.js` / `style.css` from cache. Fix order: (1) verify the URL shows the latest random port printed by `run_web_server.sh` -- a new port should bypass cache by itself; (2) hard reload (Cmd+Shift+R on macOS); (3) DevTools -> Application -> Clear storage -> "Clear site data". Note: `build_github_pages.sh` appends `?v=HASH` cachebust query strings, but an aggressive proxy or a service worker installed on the origin can still serve stale files.

## Tests

- **`bash check_codebase.sh` fails on Playwright**: run `./setup_playwright.sh` once to install browsers.
- **`pytest tests/` fails on ASCII compliance**: see [docs/MARKDOWN_STYLE.md](MARKDOWN_STYLE.md) and the ASCII checker under `tests/`.

## Save data

- **Save reset unexpectedly**: clearing browser cache or localStorage wipes `stems_quiz_v1`. There is no cloud backup.
- **Goals not rolling over at midnight**: rollover uses the browser's local date. Changing the system clock can trigger an early reset.

## Known gaps

- This stub captures only the most common pitfalls. Add new entries here when a reproducible issue is observed.
- Verification task: when an issue is resolved in code, link the relevant [docs/CHANGELOG.md](CHANGELOG.md) entry from the troubleshooting row.
