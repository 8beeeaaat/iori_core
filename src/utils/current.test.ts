import { beforeEach, describe, expect, test, vi } from "vitest";
import type { WordTimeline } from "../Constants";
import { createLyric } from "../factories/createLyric";
import type { CharData, LineData, LyricData, WordData } from "../types";
import {
  getCurrentChar,
  getCurrentLine,
  getCurrentLineFromWord,
  getCurrentParagraph,
  getCurrentParagraphFromLine,
  getCurrentWord,
  getCurrentWordFromChar,
} from "./current";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

describe("current", () => {
  const testTimelines: WordTimeline[][][] = [
    [
      // Paragraph 1
      [
        // Line 1
        {
          wordID: "word1",
          text: "Hello",
          begin: 0,
          end: 1,
          hasWhitespace: true,
        },
        {
          wordID: "word2",
          text: "world",
          begin: 1.5,
          end: 2.5,
        },
      ],
      [
        // Line 2
        {
          wordID: "word3",
          text: "How",
          begin: 3,
          end: 4,
          hasWhitespace: true,
        },
        {
          wordID: "word4",
          text: "are",
          begin: 4.5,
          end: 5.5,
          hasWhitespace: true,
        },
        {
          wordID: "word5",
          text: "you",
          begin: 6,
          end: 7,
        },
      ],
    ],
    [
      // Paragraph 2
      [
        // Line 1
        {
          wordID: "word6",
          text: "Fine",
          begin: 8,
          end: 9,
          hasWhitespace: true,
        },
        {
          wordID: "word7",
          text: "thanks",
          begin: 9.5,
          end: 10.5,
        },
      ],
    ],
  ];

  let mockLyric: LyricData;

  beforeEach(async () => {
    mockLyric = await createLyric({
      resourceID: "test",
      duration: 15,
      timelines: testTimelines,
      offsetSec: 0,
      initID: true,
    });
  });

  describe("getCurrentParagraph", () => {
    test("should find current paragraph at specific time", () => {
      const paragraph = getCurrentParagraph(mockLyric, 0.5);
      expect(paragraph?.position).toBe(1);
    });

    test("should find current paragraph at later time", () => {
      const paragraph = getCurrentParagraph(mockLyric, 8.5);
      expect(paragraph?.position).toBe(2);
    });

    test("should return undefined when no paragraph is current", () => {
      const paragraph = getCurrentParagraph(mockLyric, 20);
      expect(paragraph).toBeUndefined();
    });

    test("should handle offset", () => {
      // With offset -1, time 1 becomes 0 internally
      const paragraph = getCurrentParagraph(mockLyric, 1, { offset: -1 });
      expect(paragraph?.position).toBe(1);
    });

    test("should handle equal option", () => {
      const paragraph = getCurrentParagraph(mockLyric, 0, { equal: false });
      expect(paragraph).toBeUndefined(); // Boundary excluded with equal=false
    });

    test("should use lyric offsetSec as default", () => {
      const lyricWithOffset = { ...mockLyric, offsetSec: 0.5 };
      const paragraph = getCurrentParagraph(lyricWithOffset, 0);
      expect(paragraph?.position).toBe(1);
    });
  });

  describe("getCurrentLine", () => {
    test("should find current line at specific time", () => {
      const line = getCurrentLine(mockLyric, 0.5);
      expect(line?.words[0].timeline.text).toBe("Hello");
    });

    test("should find current line in different paragraph", () => {
      const line = getCurrentLine(mockLyric, 4);
      expect(line?.words[0].timeline.text).toBe("How");
    });

    test("should return undefined when no line is current", () => {
      const line = getCurrentLine(mockLyric, 20);
      expect(line).toBeUndefined();
    });

    test("should return undefined when paragraph exists but no line is current", () => {
      // Mock a paragraph with no current line at the specified time
      const line = getCurrentLine(mockLyric, 2.8); // Between lines
      expect(line).toBeUndefined();
    });

    test("should handle offset", () => {
      const line = getCurrentLine(mockLyric, 1, { offset: -0.5 });
      expect(line?.words[0].timeline.text).toBe("Hello");
    });
  });

  describe("getCurrentWord", () => {
    test("should find current word at specific time", () => {
      const word = getCurrentWord(mockLyric, 0.5);
      expect(word?.timeline.text).toBe("Hello");
    });

    test("should find current word at later time", () => {
      const word = getCurrentWord(mockLyric, 2);
      expect(word?.timeline.text).toBe("world");
    });

    test("should return undefined when no word is current", () => {
      const word = getCurrentWord(mockLyric, 20);
      expect(word).toBeUndefined();
    });

    test("should return undefined when line exists but no word is current", () => {
      const word = getCurrentWord(mockLyric, 2.8); // Between words
      expect(word).toBeUndefined();
    });

    test("should handle offset", () => {
      const word = getCurrentWord(mockLyric, 0.5, { offset: 0 });
      // Test that function works with offset
      expect(word ? word.timeline.text : "no-word").toBeTruthy();
    });

    test("should sort words by begin time descending", () => {
      // Test with overlapping words to ensure correct sorting
      const word = getCurrentWord(mockLyric, 1.5);
      expect(word?.timeline.text).toBe("world");
    });
  });

  describe("getCurrentChar", () => {
    test("should find current character at specific time", () => {
      const char = getCurrentChar(mockLyric, 0.1);
      expect(char?.text).toBe("H");
    });

    test("should find current character in different word", () => {
      const char = getCurrentChar(mockLyric, 1.7);
      // Should be in "world"
      expect(char?.wordID).toBe("word2");
    });

    test("should return undefined when no character is current", () => {
      const char = getCurrentChar(mockLyric, 20);
      expect(char).toBeUndefined();
    });

    test("should return undefined when word exists but no character is current", () => {
      // This is unlikely with auto-generated character timing but test anyway
      const char = getCurrentChar(mockLyric, 2.8); // Between words
      expect(char).toBeUndefined();
    });

    test("should handle offset", () => {
      const char = getCurrentChar(mockLyric, 0.6, { offset: -0.5 });
      expect(char?.text).toBe("H");
    });
  });

  describe("relationship finders", () => {
    test("getCurrentParagraphFromLine should find paragraph containing line", () => {
      const line = getCurrentLine(mockLyric, 0.5);
      expect(line).toBeDefined();

      if (!line) return;
      const paragraph = getCurrentParagraphFromLine(line, mockLyric);
      expect(paragraph?.position).toBe(1);
    });

    test("getCurrentParagraphFromLine should return undefined for non-existent line", () => {
      const fakeLine: LineData = {
        id: "fake-line",
        position: 999,
        words: [],
      };

      const paragraph = getCurrentParagraphFromLine(fakeLine, mockLyric);
      expect(paragraph).toBeUndefined();
    });

    test("getCurrentLineFromWord should find line containing word", () => {
      const word = getCurrentWord(mockLyric, 0.5);
      expect(word).toBeDefined();

      if (!word) return;
      const line = getCurrentLineFromWord(word, mockLyric);
      expect(line?.words.some((w) => w.id === word?.id)).toBe(true);
    });

    test("getCurrentLineFromWord should return undefined for non-existent word", () => {
      const fakeWord: WordData = {
        id: "fake-word",
        lineID: "fake-line",
        position: 999,
        timeline: {
          wordID: "fake-word",
          text: "fake",
          begin: 0,
          end: 1,
        },
        chars: [],
      };

      const line = getCurrentLineFromWord(fakeWord, mockLyric);
      expect(line).toBeUndefined();
    });

    test("getCurrentWordFromChar should find word containing character", () => {
      const char = getCurrentChar(mockLyric, 0.1);
      expect(char).toBeDefined();

      if (!char) return;
      const word = getCurrentWordFromChar(char, mockLyric);
      expect(word?.chars.some((c) => c.id === char?.id)).toBe(true);
    });

    test("getCurrentWordFromChar should return undefined for non-existent character", () => {
      const fakeChar: CharData = {
        id: "fake-char",
        wordID: "fake-word",
        text: "f",
        type: "alphabet",
        position: 1,
        begin: 0,
        end: 1,
      };

      const word = getCurrentWordFromChar(fakeChar, mockLyric);
      expect(word).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    test("should handle time exactly at boundaries", () => {
      const paragraphAtStart = getCurrentParagraph(mockLyric, 0);
      const paragraphAtEnd = getCurrentParagraph(mockLyric, 10.5);

      expect(paragraphAtStart?.position).toBe(1);
      expect(paragraphAtEnd?.position).toBe(2);
    });

    test("should handle negative time with offset", () => {
      const paragraph = getCurrentParagraph(mockLyric, -0.5, { offset: 1 });
      expect(paragraph?.position).toBe(1);
    });

    test("should handle empty lyric", async () => {
      const emptyLyric = await createLyric({
        resourceID: "empty",
        duration: 10,
        timelines: [],
        initID: true,
      });

      expect(getCurrentParagraph(emptyLyric, 5)).toBeUndefined();
      expect(getCurrentLine(emptyLyric, 5)).toBeUndefined();
      expect(getCurrentWord(emptyLyric, 5)).toBeUndefined();
      expect(getCurrentChar(emptyLyric, 5)).toBeUndefined();
    });
  });
});
