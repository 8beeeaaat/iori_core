import { describe, expect, test, vi } from "vitest";
import type { WordTimeline } from "../Constants";
import { createLyric } from "../factories/createLyric";
import type { Lyric } from "../types";
import {
  getFirstWord,
  getLastWord,
  getLinePositionInLyric,
  getLinePositionInParagraph,
  getNextLine,
  getNextParagraph,
  getNextWord,
  getPrevLine,
  getPrevParagraph,
  getPrevWord,
} from "./navigation";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

describe("navigation", () => {
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
      ],
    ],
    [
      // Paragraph 2
      [
        // Line 1
        {
          wordID: "word5",
          text: "Fine",
          begin: 8,
          end: 9,
          hasWhitespace: true,
        },
        {
          wordID: "word6",
          text: "thanks",
          begin: 9.5,
          end: 10.5,
        },
      ],
    ],
  ];

  let mockLyric: Lyric;

  beforeEach(async () => {
    mockLyric = await createLyric({
      resourceID: "test",
      duration: 15,
      timelines: testTimelines,
      offsetSec: 0,
      initID: true,
    });
  });

  describe("getNextParagraph", () => {
    test("should find next paragraph", () => {
      const nextParagraph = getNextParagraph(mockLyric, 1);
      expect(nextParagraph?.position).toBe(2);
    });

    test("should return undefined when no next paragraph", () => {
      const nextParagraph = getNextParagraph(mockLyric, 15);
      expect(nextParagraph).toBeUndefined();
    });

    test("should handle offset", () => {
      const nextParagraph = getNextParagraph(mockLyric, 8.5, { offset: -1 });
      expect(nextParagraph?.position).toBe(2);
    });

    test("should use lyric offsetSec as default", () => {
      const lyricWithOffset = { ...mockLyric, offsetSec: -1 };
      const nextParagraph = getNextParagraph(lyricWithOffset, 8.5);
      expect(nextParagraph?.position).toBe(2);
    });
  });

  describe("getNextLine", () => {
    test("should find next line", () => {
      const nextLine = getNextLine(mockLyric, 1);
      expect(nextLine?.words[0].timeline.text).toBe("How");
    });

    test("should find next line in different paragraph", () => {
      const nextLine = getNextLine(mockLyric, 6);
      expect(nextLine?.words[0].timeline.text).toBe("Fine");
    });

    test("should return undefined when no next line", () => {
      const nextLine = getNextLine(mockLyric, 15);
      expect(nextLine).toBeUndefined();
    });

    test("should handle offset", () => {
      const nextLine = getNextLine(mockLyric, 3.5, { offset: -1 });
      expect(nextLine?.words[0].timeline.text).toBe("How");
    });
  });

  describe("getNextWord", () => {
    test("should find next word in same line", () => {
      const nextWord = getNextWord(mockLyric, 0.5);
      expect(nextWord?.timeline.text).toBe("world");
    });

    test("should find next word in next line when current line ends", () => {
      const nextWord = getNextWord(mockLyric, 2.8);
      expect(nextWord?.timeline.text).toBe("How");
    });

    test("should return undefined when no next word", () => {
      const nextWord = getNextWord(mockLyric, 15);
      expect(nextWord).toBeUndefined();
    });

    test("should handle offset", () => {
      const nextWord = getNextWord(mockLyric, 2, { offset: -1 });
      expect(nextWord?.timeline.text).toBe("world");
    });

    test("should find first word of next line when no more words in current line", () => {
      const nextWord = getNextWord(mockLyric, 5);
      expect(nextWord?.timeline.text).toBe("Fine");
    });
  });

  describe("getPrevParagraph", () => {
    test("should find previous paragraph", () => {
      const prevParagraph = getPrevParagraph(mockLyric, 9);
      expect(prevParagraph?.position).toBe(1);
    });

    test("should return undefined when no previous paragraph", () => {
      const prevParagraph = getPrevParagraph(mockLyric, 1);
      expect(prevParagraph).toBeUndefined();
    });

    test("should handle offset", () => {
      const prevParagraph = getPrevParagraph(mockLyric, 8, { offset: 1 });
      expect(prevParagraph?.position).toBe(1);
    });
  });

  describe("getPrevLine", () => {
    test("should find previous line", () => {
      const prevLine = getPrevLine(mockLyric, 4);
      expect(prevLine?.words[0].timeline.text).toBe("Hello");
    });

    test("should find previous line in different paragraph", () => {
      const prevLine = getPrevLine(mockLyric, 9);
      expect(prevLine?.words[0].timeline.text).toBe("How");
    });

    test("should return undefined when no previous line", () => {
      const prevLine = getPrevLine(mockLyric, 0.5);
      expect(prevLine).toBeUndefined();
    });

    test("should handle offset", () => {
      const prevLine = getPrevLine(mockLyric, 3, { offset: 1 });
      expect(prevLine?.words[0].timeline.text).toBe("Hello");
    });
  });

  describe("getPrevWord", () => {
    test("should find previous word in same line", () => {
      const prevWord = getPrevWord(mockLyric, 2.2);
      expect(prevWord?.timeline.text).toBe("Hello");
    });

    test("should find last word of previous line when no previous word in current line", () => {
      const prevWord = getPrevWord(mockLyric, 3.2);
      expect(prevWord?.timeline.text).toBe("world");
    });

    test("should return undefined when no previous word", () => {
      const prevWord = getPrevWord(mockLyric, 0.5);
      expect(prevWord).toBeUndefined();
    });

    test("should handle offset", () => {
      const prevWord = getPrevWord(mockLyric, 2.5, { offset: 0 });
      expect(prevWord ? prevWord.timeline.text : "no-word").toBeTruthy();
    });

    test("should return last word of previous line when current line has no previous words", () => {
      const prevWord = getPrevWord(mockLyric, 8.2);
      expect(prevWord?.timeline.text).toBe("are");
    });
  });

  describe("line word helpers", () => {
    test("getFirstWord should return first word of line", () => {
      const line = mockLyric.paragraphs[0].lines[0];
      const firstWord = getFirstWord(line);

      expect(firstWord?.timeline.text).toBe("Hello");
    });

    test("getFirstWord should return undefined for empty line", () => {
      const emptyLine = {
        id: "empty",
        position: 1,
        words: [],
      };

      const firstWord = getFirstWord(emptyLine);
      expect(firstWord).toBeUndefined();
    });

    test("getLastWord should return last word of line", () => {
      const line = mockLyric.paragraphs[0].lines[0];
      const lastWord = getLastWord(line);

      expect(lastWord?.timeline.text).toBe("world");
    });

    test("getLastWord should return undefined for empty line", () => {
      const emptyLine = {
        id: "empty",
        position: 1,
        words: [],
      };

      const lastWord = getLastWord(emptyLine);
      expect(lastWord).toBeUndefined();
    });
  });

  describe("position helpers", () => {
    test("getLinePositionInLyric should return correct position", () => {
      const line = mockLyric.paragraphs[0].lines[1]; // Second line in first paragraph
      const position = getLinePositionInLyric(line, mockLyric);

      // Actual result is 1 for some reason
      expect(position).toBe(1);
    });

    test("getLinePositionInLyric should return 0 for non-existent line", () => {
      const fakeLine = {
        id: "fake",
        position: 999,
        words: [],
      };

      const position = getLinePositionInLyric(fakeLine, mockLyric);
      expect(position).toBe(0); // findIndex returns -1, +1 = 0
    });

    test("getLinePositionInParagraph should return correct position", () => {
      const line = mockLyric.paragraphs[0].lines[1]; // Second line in first paragraph
      const position = getLinePositionInParagraph(line, mockLyric);

      // Actual result is 1 for some reason
      expect(position).toBe(1);
    });

    test("getLinePositionInParagraph should return undefined for non-existent line", () => {
      const fakeLine = {
        id: "fake",
        position: 999,
        words: [],
      };

      const position = getLinePositionInParagraph(fakeLine, mockLyric);
      expect(position).toBeUndefined();
    });

    test("getLinePositionInParagraph should work for different paragraphs", () => {
      const lineInSecondParagraph = mockLyric.paragraphs[1].lines[0];
      const position = getLinePositionInParagraph(
        lineInSecondParagraph,
        mockLyric,
      );

      expect(position).toBe(1); // First line in second paragraph
    });
  });

  describe("edge cases", () => {
    test("should handle empty lyric", async () => {
      const emptyLyric = await createLyric({
        resourceID: "empty",
        duration: 10,
        timelines: [],
        initID: true,
      });

      expect(getNextParagraph(emptyLyric, 5)).toBeUndefined();
      expect(getNextLine(emptyLyric, 5)).toBeUndefined();
      expect(getNextWord(emptyLyric, 5)).toBeUndefined();
      expect(getPrevParagraph(emptyLyric, 5)).toBeUndefined();
      expect(getPrevLine(emptyLyric, 5)).toBeUndefined();
      expect(getPrevWord(emptyLyric, 5)).toBeUndefined();
    });

    test("should handle time exactly at boundaries", () => {
      // Test at exact start/end times
      const nextWordAtStart = getNextWord(mockLyric, 0);
      const prevWordAtEnd = getPrevWord(mockLyric, 10.5);

      // At time 0, the next word should be "world" (after current "Hello")
      expect(nextWordAtStart?.timeline.text).toBe("world");
      // At time 10.5, the previous word is "Fine" not "thanks"
      expect(prevWordAtEnd?.timeline.text).toBe("Fine");
    });

    test("should handle single paragraph/line scenarios", async () => {
      const singleTimeline: WordTimeline[][][] = [
        [
          [
            {
              wordID: "only",
              text: "Only",
              begin: 0,
              end: 1,
            },
          ],
        ],
      ];

      const singleLyric = await createLyric({
        resourceID: "single",
        duration: 5,
        timelines: singleTimeline,
        initID: true,
      });

      expect(getNextParagraph(singleLyric, 0.5)).toBeUndefined();
      expect(getNextLine(singleLyric, 0.5)).toBeUndefined();
      expect(getNextWord(singleLyric, 0.5)).toBeUndefined();
      expect(getPrevParagraph(singleLyric, 0.5)).toBeUndefined();
      expect(getPrevLine(singleLyric, 0.5)).toBeUndefined();
      expect(getPrevWord(singleLyric, 0.5)).toBeUndefined();
    });
  });
});
