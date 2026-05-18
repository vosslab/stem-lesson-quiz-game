// Fixed slot identity palette: 8 colors locked to positions 1-8.
// Button fills are set inline from these colors; they are stable across
// all themes and audited for 5.5:1+ contrast vs white text.
// Colors grouped: 4 warm (red, orange, magenta, yellow-green) + 4 cool (green, blue, teal, sky-blue).

export const SLOT_ACCENTS: readonly string[] = [
	"#d40000", // 1 RED
	"#007a00", // 2 GREEN
	"#003fff", // 3 BLUE
	"#c80085", // 4 MAGENTA
	"#b74300", // 5 ORANGE
	"#00775f", // 6 TEAL
	"#076dad", // 7 SKY BLUE
	"#6c6c00", // 8 YELLOW-GREEN
] as const;

//============================================

// Return the slot accent color for a given button index (0-7).
// Uses modulo for defensive wrapping if index >= 8.
export function slot_accent_for(index: number): string {
	return SLOT_ACCENTS[index % SLOT_ACCENTS.length];
}
