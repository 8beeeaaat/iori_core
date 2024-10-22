export const CHAR_TYPES = {
  WHITESPACE: "whitespace",
  ALPHABET: "alphabet",
  NUMBER: "number",
  KANJI: "kanji",
  HIRAGANA: "hiragana",
  KATAKANA: "katakana",
  OTHER: "other",
} as const;

export type CharType = (typeof CHAR_TYPES)[keyof typeof CHAR_TYPES];

export type WordTimeline = {
  wordID: string;
  text: string;
  begin: number;
  end: number;
  hasWhitespace?: boolean;
  hasNewLine?: boolean;
};
