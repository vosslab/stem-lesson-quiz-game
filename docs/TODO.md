# TODO

Backlog scratchpad for small tasks without timelines.

## Open

### Docs

- Document minimum Node.js version in `docs/INSTALL.md` once verified.

### Themes (deferred to v2)

Per-mascot-theme micro-variants (CSS-only, color + motion, no new art):

- Marauders: dark-red pulse glow on streak banner
- Huskies: warm amber confetti burst
- Wildcats: blue+gold confetti, faster pop
- Bison: heavier slower confetti, deeper drop
- Knights: silver spark trail on correct

Implementation gated on whether per-theme confetti requires touching
scoring/feedback/confetti code beyond CSS animations. v1 ships color-only
mascot themes.

## Shop catalog trim (conditional)

15 themes shipped. Rare tier has 9 entries (4 World + 5 Mascot). If kid
playtest reports "too much scroll" or "don't know which to buy", trim
2-3 redundant generic themes. Candidates (no removal yet, evidence pending):

- slime_world or candy_kingdom (greenish/sweet cluster overlap with jungle)
- arcade_neon or lava (saturated-dark cluster overlap)

Do NOT remove without explicit playtest signal - destructive (kids may
already own them in dev playtest).

## Resolved (kept for history)

- Marauder + 4 feeder mascot themes shipped (5 themes, all CSS motifs,
  no figurative art). See [docs/CHANGELOG.md](CHANGELOG.md) under
  2026-05-17.
- `run_web_server.sh` patched with TTY guard (`[ -t 0 ]`) so agent
  invocations no longer pop the user's browser.
- `docs/RELEASE_HISTORY.md` created (stub).
