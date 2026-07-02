// Branded id types prevent string mixups across modules.
// LessonId and StemId are nominally strings at runtime,
// but the type system rejects a raw string passed where a brand is expected.
// Construct only via the toLessonId / toStemId helpers.

declare const lessonIdBrand: unique symbol;
declare const stemIdBrand: unique symbol;

export type LessonId = string & { readonly [lessonIdBrand]: true };
export type StemId = string & { readonly [stemIdBrand]: true };

export function toLessonId(value: string): LessonId {
  return value as LessonId;
}

export function toStemId(value: string): StemId {
  return value as StemId;
}
