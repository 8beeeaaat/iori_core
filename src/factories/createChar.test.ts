import { describe, expect, test, vi } from "vitest";
import { CHAR_TYPES } from "../Constants";
import { type CreateCharArgs, createChar } from "./createChar";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

describe("createChar", () => {
  const baseArgs: CreateCharArgs = {
    wordID: "word-1",
    position: 1,
    text: "a",
    begin: 0,
    end: 1,
  };

  test("should create a basic char with all properties", () => {
    const char = createChar(baseArgs);

    expect(char.id).toBe("char-test-uuid-123");
    expect(char.wordID).toBe("word-1");
    expect(char.text).toBe("a");
    expect(char.type).toBe(CHAR_TYPES.ALPHABET);
    expect(char.position).toBe(1);
    expect(char.begin).toBe(0);
    expect(char.end).toBe(1);
  });

  test("should be frozen (immutable)", () => {
    const char = createChar(baseArgs);
    expect(Object.isFrozen(char)).toBe(true);
  });

  describe("character type detection", () => {
    test("should detect whitespace characters", () => {
      const spaceChar = createChar({ ...baseArgs, text: " " });
      const tabChar = createChar({ ...baseArgs, text: "\t" });
      const newlineChar = createChar({ ...baseArgs, text: "\n" });

      expect(spaceChar.type).toBe(CHAR_TYPES.WHITESPACE);
      expect(tabChar.type).toBe(CHAR_TYPES.WHITESPACE);
      expect(newlineChar.type).toBe(CHAR_TYPES.WHITESPACE);
    });

    test("should detect alphabet characters", () => {
      const lowerChar = createChar({ ...baseArgs, text: "a" });
      const upperChar = createChar({ ...baseArgs, text: "Z" });
      const multiChar = createChar({ ...baseArgs, text: "Hello" });

      expect(lowerChar.type).toBe(CHAR_TYPES.ALPHABET);
      expect(upperChar.type).toBe(CHAR_TYPES.ALPHABET);
      expect(multiChar.type).toBe(CHAR_TYPES.ALPHABET);
    });

    test("should detect number characters", () => {
      const singleDigit = createChar({ ...baseArgs, text: "5" });
      const multiDigit = createChar({ ...baseArgs, text: "123" });
      const zero = createChar({ ...baseArgs, text: "0" });

      expect(singleDigit.type).toBe(CHAR_TYPES.NUMBER);
      expect(multiDigit.type).toBe(CHAR_TYPES.NUMBER);
      expect(zero.type).toBe(CHAR_TYPES.NUMBER);
    });

    test("should detect kanji characters", () => {
      const kanji1 = createChar({ ...baseArgs, text: "漢" });
      const kanji2 = createChar({ ...baseArgs, text: "字" });
      const multiKanji = createChar({ ...baseArgs, text: "漢字" });

      expect(kanji1.type).toBe(CHAR_TYPES.KANJI);
      expect(kanji2.type).toBe(CHAR_TYPES.KANJI);
      expect(multiKanji.type).toBe(CHAR_TYPES.KANJI);
    });

    test("should detect hiragana characters", () => {
      const hiragana1 = createChar({ ...baseArgs, text: "あ" });
      const hiragana2 = createChar({ ...baseArgs, text: "か" });
      const multiHiragana = createChar({ ...baseArgs, text: "ひらがな" });

      expect(hiragana1.type).toBe(CHAR_TYPES.HIRAGANA);
      expect(hiragana2.type).toBe(CHAR_TYPES.HIRAGANA);
      expect(multiHiragana.type).toBe(CHAR_TYPES.HIRAGANA);
    });

    test("should detect katakana characters", () => {
      const katakana1 = createChar({ ...baseArgs, text: "ア" });
      const katakana2 = createChar({ ...baseArgs, text: "カ" });
      const multiKatakana = createChar({ ...baseArgs, text: "カタカナ" });

      expect(katakana1.type).toBe(CHAR_TYPES.KATAKANA);
      expect(katakana2.type).toBe(CHAR_TYPES.KATAKANA);
      expect(multiKatakana.type).toBe(CHAR_TYPES.KATAKANA);
    });

    test("should detect other characters", () => {
      const punctuation = createChar({ ...baseArgs, text: "!" });
      const symbol = createChar({ ...baseArgs, text: "@" });
      const emoji = createChar({ ...baseArgs, text: "😀" });
      const mixed = createChar({ ...baseArgs, text: "a1!" });

      expect(punctuation.type).toBe(CHAR_TYPES.OTHER);
      expect(symbol.type).toBe(CHAR_TYPES.OTHER);
      expect(emoji.type).toBe(CHAR_TYPES.OTHER);
      expect(mixed.type).toBe(CHAR_TYPES.OTHER);
    });
  });

  test("should handle different positions", () => {
    const char1 = createChar({ ...baseArgs, position: 1 });
    const char2 = createChar({ ...baseArgs, position: 10 });

    expect(char1.position).toBe(1);
    expect(char2.position).toBe(10);
  });

  test("should handle different timing", () => {
    const earlyChar = createChar({ ...baseArgs, begin: 0, end: 0.5 });
    const lateChar = createChar({ ...baseArgs, begin: 10.5, end: 11.2 });

    expect(earlyChar.begin).toBe(0);
    expect(earlyChar.end).toBe(0.5);
    expect(lateChar.begin).toBe(10.5);
    expect(lateChar.end).toBe(11.2);
  });

  test("should handle different wordIDs", () => {
    const char1 = createChar({ ...baseArgs, wordID: "word-1" });
    const char2 = createChar({ ...baseArgs, wordID: "custom-word-id" });

    expect(char1.wordID).toBe("word-1");
    expect(char2.wordID).toBe("custom-word-id");
  });

  test("should generate unique IDs", () => {
    vi.mocked(crypto.randomUUID)
      .mockReturnValueOnce("uuid-1")
      .mockReturnValueOnce("uuid-2");

    const char1 = createChar(baseArgs);
    const char2 = createChar(baseArgs);

    expect(char1.id).toBe("char-uuid-1");
    expect(char2.id).toBe("char-uuid-2");
  });
});
