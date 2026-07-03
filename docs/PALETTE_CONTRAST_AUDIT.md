# Palette contrast audit

Audited color values for the STEM lesson quiz game. For the WCAG method, the 5.5:1
target, and the calculator tool, see
[COLOR_CONTRAST_ACCESSIBILITY.md](COLOR_CONTRAST_ACCESSIBILITY.md).

Ratios below were computed with a WCAG contrast calculator against white.

## Fixed slot accents

The eight answer-slot button fills are defined in `src/slot_palette.ts`
(`SLOT_ACCENTS`), locked to positions 1-8 and stable across all themes. Each fill
carries **white button text**, so every accent is audited for at least 5.5:1
contrast against white (`#ffffff`).

| Slot | Label | Fill hex | White-text ratio |
| --- | --- | --- | --- |
| 1 | RED | `#d40000` | 5.53:1 |
| 2 | GREEN | `#007a00` | 5.55:1 |
| 3 | BLUE | `#003fff` | 6.66:1 |
| 4 | MAGENTA | `#c80085` | 5.53:1 |
| 5 | ORANGE | `#b74300` | 5.50:1 |
| 6 | TEAL | `#00775f` | 5.52:1 |
| 7 | SKY BLUE | `#076dad` | 5.53:1 |
| 8 | YELLOW-GREEN | `#6c6c00` | 5.55:1 |

All eight accents meet the 5.5:1 target with white text. The set is four warm colors
(red, orange, magenta, yellow-green) plus four cool colors (green, blue, teal,
sky-blue) so slot identity stays distinguishable.
