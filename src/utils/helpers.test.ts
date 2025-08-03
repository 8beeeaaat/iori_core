import { describe, expect, test, vi } from "vitest";
import { createChar } from "../factories/createChar";
import { createLine } from "../factories/createLine";
import { createWord } from "../factories/createWord";
import type { Char, Line, Lyric, Paragraph, Word } from "../types";
import {
  findCharAt,
  findLineAt,
  findParagraphAt,
  findWordAt,
  getCharBegin,
  getCharDuration,
  getCharEnd,
  getLineBegin,
  getLineChars,
  getLineDuration,
  getLineEnd,
  getLines,
  getLineText,
  getLineWords,
  getParagraphBegin,
  getParagraphDuration,
  getParagraphEnd,
  getParagraphLines,
  getParagraphs,
  getWordBegin,
  getWordChars,
  getWordDuration,
  getWordEnd,
  getWords,
  getWordText,
  isCurrentTime,
} from "./helpers";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

describe("helpers", () => {
  // Test data setup
  const char1: Char = createChar({
    wordID: "word1",
    position: 1,
    text: "H",
    begin: 0,
    end: 0.2,
  });

  const _char2: Char = createChar({
    wordID: "word1",
    position: 2,
    text: "i",
    begin: 0.2,
    end: 0.4,
  });

  const word1: Word = createWord({
    lineID: "line1",
    position: 1,
    timeline: {
      wordID: "word1",
      text: "Hi",
      begin: 0,
      end: 1,
      hasWhitespace: true,
    },
  });

  const _word2: Word = createWord({
    lineID: "line1",
    position: 2,
    timeline: {
      wordID: "word2",
      text: "there",
      begin: 1.5,
      end: 2.5,
    },
  });

  const line1: Line = createLine({
    position: 1,
    timelines: [
      { wordID: "word1", text: "Hi", begin: 0, end: 1, hasWhitespace: true },
      { wordID: "word2", text: "there", begin: 1.5, end: 2.5 },
    ],
  });

  const line2: Line = createLine({
    position: 2,
    timelines: [{ wordID: "word3", text: "How", begin: 3, end: 4 }],
  });

  const paragraph1: Paragraph = {
    id: "paragraph1",
    position: 1,
    lines: [line1, line2],
  };

  const paragraph2: Paragraph = {
    id: "paragraph2",
    position: 2,
    lines: [line2],
  };

  const mockLyric: Lyric = {
    id: "lyric1",
    resourceID: "test",
    duration: 10,
    offsetSec: 0,
    paragraphs: [paragraph1, paragraph2],
  };

  describe("getWords", () => {
    test("should return all words from lyric", () => {
      const words = getWords(mockLyric);
      expect(words.length).toBeGreaterThanOrEqual(3); // May be more due to word joining
      expect(words[0].timeline.text).toContain("Hi");
    });
  });

  describe("getLines", () => {
    test("should return all lines sorted by begin time", () => {
      const lines = getLines(mockLyric);
      expect(lines).toHaveLength(3);
      expect(getLineBegin(lines[0])).toBeLessThanOrEqual(
        getLineBegin(lines[1]),
      );
    });
  });

  describe("getParagraphs", () => {
    test("should return paragraphs sorted by begin time", () => {
      const paragraphs = getParagraphs(mockLyric);
      expect(paragraphs).toHaveLength(2);
      expect(getParagraphBegin(paragraphs[0])).toBeLessThanOrEqual(
        getParagraphBegin(paragraphs[1]),
      );
    });
  });

  describe("getters", () => {
    test("getChars should return all characters", () => {
      const chars = getWordChars(word1);
      expect(chars).toHaveLength(2);
    });

    test("getLineChars should return all characters in a line", () => {
      const chars = getLineChars(line1);
      expect(chars).toHaveLength(7);
    });

    test("getLineWords should return line words", () => {
      const words = getLineWords(line1);
      expect(words).toHaveLength(2);
    });

    test("getParagraphLines should return paragraph lines", () => {
      const lines = getParagraphLines(paragraph1);
      expect(lines).toHaveLength(2);
    });
  });

  describe("time getters", () => {
    test("should get character timing", () => {
      expect(getCharBegin(char1)).toBe(0);
      expect(getCharEnd(char1)).toBe(0.2);
    });

    test("should get word timing", () => {
      expect(getWordBegin(word1)).toBe(0);
      expect(getWordEnd(word1)).toBe(1);
    });

    test("should get line timing", () => {
      expect(getLineBegin(line1)).toBe(0);
      expect(getLineEnd(line1)).toBeGreaterThan(0);
    });

    test("should get paragraph timing", () => {
      expect(getParagraphBegin(paragraph1)).toBe(0);
      expect(getParagraphEnd(paragraph1)).toBeGreaterThan(0);
    });

    test("should handle empty lines/paragraphs", () => {
      const emptyLine: Line = { id: "empty", position: 1, words: [] };
      const emptyParagraph: Paragraph = {
        id: "empty",
        position: 1,
        lines: [],
      };

      expect(getLineBegin(emptyLine)).toBe(0);
      expect(getLineEnd(emptyLine)).toBe(0);
      expect(getParagraphBegin(emptyParagraph)).toBe(0);
      expect(getParagraphEnd(emptyParagraph)).toBe(0);
    });
  });

  describe("duration calculations", () => {
    test("should calculate character duration", () => {
      const duration = getCharDuration(char1);
      expect(duration).toBe(0.2);
    });

    test("should calculate word duration", () => {
      const duration = getWordDuration(word1);
      expect(duration).toBe(1);
    });

    test("should log error for invalid word duration", () => {
      const invalidWord: Word = {
        ...word1,
        timeline: { ...word1.timeline, begin: 2, end: 1 }, // Invalid: begin > end
      };

      // expect(() => getWordDuration(invalidWord)).toThrow();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const duration = getWordDuration(invalidWord);
      expect(duration).toBe(-1); // Should return -1 for invalid duration
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Cannot calculate duration of invalid word: ${invalidWord.id} 2-1`,
      );
    });

    test("should calculate line duration", () => {
      const duration = getLineDuration(line1);
      expect(duration).toBeGreaterThan(0);
    });

    test("should calculate paragraph duration", () => {
      const duration = getParagraphDuration(paragraph1);
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe("text functions", () => {
    test("should get word text", () => {
      const text = getWordText(word1);
      expect(text).toBe("Hi");
    });

    test("should get line text with whitespace", () => {
      const text = getLineText(line1);
      expect(text).toContain("Hi ");
    });

    test("should handle newlines in line text", () => {
      const wordWithNewline: Word = {
        ...word1,
        timeline: { ...word1.timeline, hasNewLine: true },
      };
      const lineWithNewline: Line = {
        ...line1,
        words: [wordWithNewline],
      };

      const text = getLineText(lineWithNewline);
      expect(text).toContain("\n");
    });
  });

  describe("isCurrentTime", () => {
    test("should detect current time with equal=true (default)", () => {
      expect(isCurrentTime(0, 2, 1)).toBe(true);
      expect(isCurrentTime(0, 2, 0)).toBe(true); // Boundary
      expect(isCurrentTime(0, 2, 2)).toBe(true); // Boundary
      expect(isCurrentTime(0, 2, 3)).toBe(false);
    });

    test("should detect current time with equal=false", () => {
      expect(isCurrentTime(0, 2, 1, { equal: false })).toBe(true);
      expect(isCurrentTime(0, 2, 0, { equal: false })).toBe(false); // Boundary excluded
      expect(isCurrentTime(0, 2, 2, { equal: false })).toBe(false); // Boundary excluded
    });

    test("should handle offset", () => {
      expect(isCurrentTime(0, 2, 2.5, { offset: -1 })).toBe(true); // 2.5 - 1 = 1.5
      expect(isCurrentTime(0, 2, 1, { offset: 1 })).toBe(true); // 1 + 1 = 2
    });
  });

  describe("finders", () => {
    test("should find paragraph by position", () => {
      const paragraph = findParagraphAt(mockLyric, 1);
      expect(paragraph?.id).toBe("paragraph1");
      expect(findParagraphAt(mockLyric, 999)).toBeUndefined();
    });

    test("should find line by position", () => {
      const line = findLineAt(paragraph1, 1);
      expect(line?.id).toBe(line1.id);
      expect(findLineAt(paragraph1, 999)).toBeUndefined();
    });

    test("should find word by position", () => {
      const word = findWordAt(line1, 1);
      expect(word?.timeline.text).toBe("Hi");
      expect(findWordAt(line1, 999)).toBeUndefined();
    });

    test("should find char by position", () => {
      const char = findCharAt(word1, 1);
      expect(char?.text).toBe("H");
      expect(findCharAt(word1, 999)).toBeUndefined();
    });
  });
});
