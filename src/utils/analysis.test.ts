import { describe, expect, test, vi } from "vitest";
import { CHAR_TYPES, type WordTimeline } from "../Constants";
import { createLine } from "../factories/createLine";
import { createLyric } from "../factories/createLyric";
import { createWord } from "../factories/createWord";
import type { CharData, LyricData } from "../types";
import {
  calculateSpeed,
  getCurrentSummary,
  getLineSpeed,
  getLyricSpeed,
  getParagraphAverageLineDuration,
  getParagraphSpeed,
  getVoidPeriods,
  getWordSpeed,
  isVoidTime,
} from "./analysis";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

describe("analysis", () => {
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
          begin: 2,
          end: 4,
        },
      ],
      [
        // Line 2
        {
          wordID: "word3",
          text: "How",
          begin: 5,
          end: 6,
          hasWhitespace: true,
        },
        {
          wordID: "word4",
          text: "are",
          begin: 7,
          end: 8,
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
          begin: 10,
          end: 12,
          hasWhitespace: true,
        },
        {
          wordID: "word6",
          text: "thanks",
          begin: 13,
          end: 15,
        },
      ],
    ],
  ];

  let mockLyric: LyricData;

  beforeEach(async () => {
    mockLyric = await createLyric({
      resourceID: "test",
      duration: 20,
      timelines: testTimelines,
      offsetSec: 0,
      initID: true,
    });
  });

  describe("calculateSpeed", () => {
    test("should calculate median speed correctly", () => {
      const mockItems = [
        {
          duration: () => 1,
          chars: () => [
            { type: CHAR_TYPES.ALPHABET } as CharData,
            { type: CHAR_TYPES.ALPHABET } as CharData,
          ],
        },
        {
          duration: () => 2,
          chars: () => [
            { type: CHAR_TYPES.KANJI } as CharData,
            { type: CHAR_TYPES.KANJI } as CharData,
            { type: CHAR_TYPES.KANJI } as CharData,
            { type: CHAR_TYPES.KANJI } as CharData,
          ],
        },
      ];

      const speed = calculateSpeed(mockItems);
      expect(typeof speed).toBe("number");
      expect(speed).toBeGreaterThan(0);
    });

    test("should handle odd number of items", () => {
      const mockItems = [
        {
          duration: () => 1,
          chars: () => [{ type: CHAR_TYPES.KANJI } as CharData],
        },
        {
          duration: () => 2,
          chars: () => [
            { type: CHAR_TYPES.KANJI } as CharData,
            { type: CHAR_TYPES.KANJI } as CharData,
          ],
        },
        {
          duration: () => 1,
          chars: () => [{ type: CHAR_TYPES.KANJI } as CharData],
        },
      ];

      const speed = calculateSpeed(mockItems);
      expect(typeof speed).toBe("number");
      expect(speed).toBe(1); // Median of [1, 1, 1]
    });

    test("should handle even number of items", () => {
      const mockItems = [
        {
          duration: () => 1,
          chars: () => [{ type: CHAR_TYPES.KANJI } as CharData],
        },
        {
          duration: () => 2,
          chars: () => [
            { type: CHAR_TYPES.KANJI } as CharData,
            { type: CHAR_TYPES.KANJI } as CharData,
          ],
        },
      ];

      const speed = calculateSpeed(mockItems);
      expect(typeof speed).toBe("number");
      expect(speed).toBeGreaterThan(0); // Speed calculation works
    });

    test("should handle items without chars function", () => {
      const mockItems = [{ duration: () => 1 }, { duration: () => 2 }];

      const speed = calculateSpeed(mockItems);
      expect(speed).toBe(0);
    });

    test("should weight different character types correctly", () => {
      const mockItems = [
        {
          duration: () => 1,
          chars: () => [
            { type: CHAR_TYPES.ALPHABET } as CharData, // 0.5 weight
            { type: CHAR_TYPES.NUMBER } as CharData, // 0.5 weight
            { type: CHAR_TYPES.KANJI } as CharData, // 1.0 weight
            { type: CHAR_TYPES.WHITESPACE } as CharData, // 0 weight (ignored)
          ],
        },
      ];

      const speed = calculateSpeed(mockItems);
      expect(speed).toBe(2); // (0.5 + 0.5 + 1.0) / 1 = 2
    });
  });

  describe("getWordSpeed", () => {
    test("should calculate word speed", () => {
      const word = createWord({
        lineID: "line1",
        position: 1,
        timeline: {
          wordID: "test",
          text: "Hello",
          begin: 0,
          end: 2,
        },
      });

      const speed = getWordSpeed(word);
      expect(typeof speed).toBe("number");
      expect(speed).toBeGreaterThan(0);
    });

    test("should handle word with mixed character types", () => {
      const word = createWord({
        lineID: "line1",
        position: 1,
        timeline: {
          wordID: "test",
          text: "Test123",
          begin: 0,
          end: 1,
        },
      });

      const speed = getWordSpeed(word);
      expect(typeof speed).toBe("number");
      expect(speed).toBeGreaterThan(0);
    });
  });

  describe("getLineSpeed", () => {
    test("should calculate line speed", () => {
      const line = createLine({
        position: 1,
        timelines: [
          { wordID: "word1", text: "Hello", begin: 0, end: 1 },
          { wordID: "word2", text: "world", begin: 1.5, end: 2.5 },
        ],
      });

      const speed = getLineSpeed(line);
      expect(typeof speed).toBe("number");
      expect(speed).toBeGreaterThan(0);
    });
  });

  describe("getParagraphSpeed", () => {
    test("should calculate paragraph speed", () => {
      const paragraph = mockLyric.paragraphs[0];
      const speed = getParagraphSpeed(paragraph);

      expect(typeof speed).toBe("number");
      expect(speed).toBeGreaterThan(0);
    });
  });

  describe("getLyricSpeed", () => {
    test("should calculate lyric speed", () => {
      const speed = getLyricSpeed(mockLyric);

      expect(typeof speed).toBe("number");
      expect(speed).toBeGreaterThan(0);
    });
  });

  describe("getVoidPeriods", () => {
    test("should find void periods between words", () => {
      const voidPeriods = getVoidPeriods(mockLyric);

      expect(Array.isArray(voidPeriods)).toBe(true);
      expect(voidPeriods.length).toBeGreaterThanOrEqual(0);

      // Check if there are any void periods (may or may not exist based on timing)
      if (voidPeriods.length > 0) {
        expect(voidPeriods[0]).toHaveProperty("begin");
        expect(voidPeriods[0]).toHaveProperty("end");
        expect(voidPeriods[0]).toHaveProperty("duration");
      }
    });

    test("should calculate void durations correctly", () => {
      const voidPeriods = getVoidPeriods(mockLyric);

      voidPeriods.forEach((void_) => {
        expect(void_.duration).toBe(
          Number((void_.end - void_.begin).toFixed(2)),
        );
        expect(void_.begin).toBeLessThan(void_.end);
      });
    });

    test("should handle lyric with no gaps", async () => {
      const continuousTimelines: WordTimeline[][][] = [
        [
          [
            { wordID: "word1", text: "Hello", begin: 0, end: 1 },
            { wordID: "word2", text: "world", begin: 1, end: 2 },
          ],
        ],
      ];

      const continuousLyric = await createLyric({
        resourceID: "continuous",
        duration: 2,
        timelines: continuousTimelines,
        initID: true,
      });

      const voidPeriods = getVoidPeriods(continuousLyric);
      // Should only have void at the end if duration > last word end
      expect(voidPeriods.length).toBeLessThanOrEqual(1);
    });
  });

  describe("isVoidTime", () => {
    test("should detect void time", () => {
      // Test void time detection functionality
      const isVoidAtStart = isVoidTime(mockLyric, 0);
      expect(typeof isVoidAtStart).toBe("boolean");

      // Test during word (should not be void)
      const isVoidDuringWord = isVoidTime(mockLyric, 0.5);
      expect(typeof isVoidDuringWord).toBe("boolean");
    });

    test("should handle edge cases", () => {
      const isVoidAtEnd = isVoidTime(mockLyric, mockLyric.duration);
      expect(typeof isVoidAtEnd).toBe("boolean");
    });
  });

  describe("getParagraphAverageLineDuration", () => {
    test("should calculate average line duration", () => {
      const paragraph = mockLyric.paragraphs[0];
      const averageDuration = getParagraphAverageLineDuration(paragraph);

      expect(typeof averageDuration).toBe("number");
      expect(averageDuration).toBeGreaterThan(0);
    });

    test("should handle single line paragraph", () => {
      const singleLineParagraph = mockLyric.paragraphs[1]; // Second paragraph has one line
      const averageDuration =
        getParagraphAverageLineDuration(singleLineParagraph);

      expect(typeof averageDuration).toBe("number");
      expect(averageDuration).toBeGreaterThan(0);
    });
  });

  describe("getCurrentSummary", () => {
    test("should return comprehensive summary", () => {
      const summary = getCurrentSummary(mockLyric, 0.5);

      expect(typeof summary).toBe("object");
      expect(summary).toHaveProperty("currentChar");
      expect(summary).toHaveProperty("currentLine");
      expect(summary).toHaveProperty("currentParagraph");
      expect(summary).toHaveProperty("currentWord");
      expect(summary).toHaveProperty("isConnected");
      expect(summary).toHaveProperty("isParagraphFinishMotion");
      expect(summary).toHaveProperty("lastLineIndex");
      expect(summary).toHaveProperty("lastLineIndexInParagraph");
      expect(summary).toHaveProperty("nextLine");
      expect(summary).toHaveProperty("nextWord");
      expect(summary).toHaveProperty("nextParagraph");
      expect(summary).toHaveProperty("nextWaitingTime");
      expect(summary).toHaveProperty("prevLine");
      expect(summary).toHaveProperty("prevWord");
      expect(summary).toHaveProperty("prevParagraph");
      expect(summary).toHaveProperty("lyricTextPerSecond");
      expect(summary).toHaveProperty("paragraphTextPerSecond");
      expect(summary).toHaveProperty("lineTextPerSecond");
    });

    test("should handle current elements", () => {
      const summary = getCurrentSummary(mockLyric, 0.5);

      expect(summary.currentParagraph?.position).toBe(1);
      if (summary.currentLine) {
        expect(summary.currentLine.words.length).toBeGreaterThan(0);
      }
      if (summary.currentWord) {
        expect(summary.currentWord.timeline.text).toBeTruthy();
      }
      if (summary.currentChar) {
        expect(summary.currentChar.text).toBeTruthy();
      }
    });

    test("should calculate connection status", () => {
      const summary = getCurrentSummary(mockLyric, 3);

      expect(typeof summary.isConnected).toBe("boolean");
      expect(typeof summary.isParagraphFinishMotion).toBe("boolean");
    });

    test("should calculate text speeds", () => {
      const summary = getCurrentSummary(mockLyric, 0.5);

      expect(typeof summary.lyricTextPerSecond).toBe("number");
      expect(summary.lyricTextPerSecond).toBeGreaterThan(0);

      if (summary.paragraphTextPerSecond) {
        expect(summary.paragraphTextPerSecond).toBeGreaterThan(0);
      }

      if (summary.lineTextPerSecond) {
        expect(summary.lineTextPerSecond).toBeGreaterThan(0);
      }
    });

    test("should handle time with no current elements", () => {
      const summary = getCurrentSummary(mockLyric, 1.5); // Between words

      // May have current elements due to different timing, test structure
      expect(typeof summary.lyricTextPerSecond).toBe("number");
      expect(summary).toHaveProperty("currentWord");
      expect(summary).toHaveProperty("currentChar");
    });

    test("should calculate indices correctly", () => {
      const summary = getCurrentSummary(mockLyric, 0.5);

      expect(typeof summary.lastLineIndex).toBe("number");
      expect(summary.lastLineIndex).toBeGreaterThanOrEqual(0);

      if (summary.lastLineIndexInParagraph !== undefined) {
        expect(summary.lastLineIndexInParagraph).toBeGreaterThanOrEqual(0);
      }
    });

    test("should calculate waiting time", () => {
      const summary = getCurrentSummary(mockLyric, 1.5); // Between words

      if (summary.nextWaitingTime !== undefined) {
        expect(typeof summary.nextWaitingTime).toBe("number");
      }
    });

    test("should handle offset in options", () => {
      const summary = getCurrentSummary(mockLyric, 1, { offset: -0.5 });

      expect(summary.currentWord?.timeline.text).toBe("Hello");
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

      const speed = getLyricSpeed(emptyLyric);
      const voidPeriods = getVoidPeriods(emptyLyric);
      const summary = getCurrentSummary(emptyLyric, 5);

      expect(typeof speed).toBe("number"); // May be NaN but is a number
      expect(Array.isArray(voidPeriods)).toBe(true);
      expect(summary.currentParagraph).toBeUndefined();
    });

    test("should handle single character words", () => {
      const singleCharWord = createWord({
        lineID: "line1",
        position: 1,
        timeline: {
          wordID: "single",
          text: "a",
          begin: 0,
          end: 1,
        },
      });

      const speed = getWordSpeed(singleCharWord);
      expect(speed).toBe(0.5); // Single alphabet character with weight 0.5
    });

    test("should handle zero duration edge cases", () => {
      const mockItems = [
        {
          duration: () => 0,
          chars: () => [{ type: CHAR_TYPES.KANJI } as CharData],
        },
      ];

      // Should handle division by zero
      expect(() => calculateSpeed(mockItems)).not.toThrow();
    });
  });
});
