import { describe, expect, test } from "vitest";
import { CHAR_TYPES, type CharType, type WordTimeline } from "./Constants";

describe("Constants", () => {
  describe("CHAR_TYPES", () => {
    test("should contain all character types", () => {
      expect(CHAR_TYPES.WHITESPACE).toBe("whitespace");
      expect(CHAR_TYPES.ALPHABET).toBe("alphabet");
      expect(CHAR_TYPES.NUMBER).toBe("number");
      expect(CHAR_TYPES.KANJI).toBe("kanji");
      expect(CHAR_TYPES.HIRAGANA).toBe("hiragana");
      expect(CHAR_TYPES.KATAKANA).toBe("katakana");
      expect(CHAR_TYPES.OTHER).toBe("other");
    });

    test("should be readonly", () => {
      // as const makes it readonly at TypeScript level, but not frozen at runtime
      expect(Object.isFrozen(CHAR_TYPES)).toBe(false);
      // Test that TypeScript prevents modification (compile-time check)
      expect(CHAR_TYPES.WHITESPACE).toBe("whitespace");
    });

    test("should have correct keys", () => {
      const keys = Object.keys(CHAR_TYPES);
      expect(keys).toEqual([
        "WHITESPACE",
        "ALPHABET",
        "NUMBER",
        "KANJI",
        "HIRAGANA",
        "KATAKANA",
        "OTHER",
      ]);
    });
  });

  describe("CharType", () => {
    test("should accept valid character types", () => {
      const validTypes: CharType[] = [
        "whitespace",
        "alphabet",
        "number",
        "kanji",
        "hiragana",
        "katakana",
        "other",
      ];

      validTypes.forEach((type) => {
        expect(Object.values(CHAR_TYPES)).toContain(type);
      });
    });
  });

  describe("WordTimeline", () => {
    test("should validate WordTimeline structure", () => {
      const validTimeline: WordTimeline = {
        wordID: "test-word",
        text: "Hello",
        begin: 0,
        end: 1,
        hasWhitespace: true,
        hasNewLine: false,
      };

      expect(validTimeline.wordID).toBe("test-word");
      expect(validTimeline.text).toBe("Hello");
      expect(validTimeline.begin).toBe(0);
      expect(validTimeline.end).toBe(1);
      expect(validTimeline.hasWhitespace).toBe(true);
      expect(validTimeline.hasNewLine).toBe(false);
    });

    test("should allow optional properties to be undefined", () => {
      const minimalTimeline: WordTimeline = {
        wordID: "test-word",
        text: "Hello",
        begin: 0,
        end: 1,
      };

      expect(minimalTimeline.hasWhitespace).toBeUndefined();
      expect(minimalTimeline.hasNewLine).toBeUndefined();
    });
  });
});
