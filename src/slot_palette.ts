// Fixed slot identity palette: 8 colors locked to positions 1-8.
// Used for left stripe and keyboard badge on each choice button.
// Colors are stable across all themes and audited for 5.5:1+ contrast vs white.

export const SLOT_ACCENTS: readonly string[] = [
	"#d40000", // 1 coral red
	"#6c6c00", // 2 sunflower (dark yellow)
	"#3b7600", // 3 lime green
	"#a719db", // 4 violet
	"#007576", // 5 cyan
	"#b74300", // 6 orange
	"#cc0066", // 7 pink
	"#00775f", // 8 teal
] as const;

//============================================

// Return the slot accent color for a given button index (0-7).
// Uses modulo for defensive wrapping if index >= 8.
export function slot_accent_for(index: number): string {
	return SLOT_ACCENTS[index % SLOT_ACCENTS.length];
}
