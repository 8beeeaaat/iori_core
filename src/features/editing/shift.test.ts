import { describe, expect, test, vi } from "vitest";
import { isFailure, isSuccess } from "../../schemas/result";
import type { Line, Lyric, LyricIndex, Paragraph, Word } from "../../types";
import { shiftLines, shiftParagraphs, shiftRange, shiftWords } from "./shift";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${Math.random().toString(36).slice(2, 11)}`),
});

/**
 * Build Lyric directly for testing
 * createLyric merges WordTimelines,
 * so we build a Lyric with individual Words directly
 */
function createTestLyric(): Lyric {
  // Create words
  const w1: Word = Object.freeze({
    id: "w1",
    lineID: "l1",
    position: 1,
    timeline: Object.freeze({
      wordID: "w1",
      text: "Hello",
      begin: 0,
      end: 1,
      hasWhitespace: false,
      hasNewLine: false,
    }),
    chars: [
      Object.freeze({
        id: "c1",
        wordID: "w1",
        position: 1,
        text: "H",
        begin: 0,
        end: 0.2,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c2",
        wordID: "w1",
        position: 2,
        text: "e",
        begin: 0.2,
        end: 0.4,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c3",
        wordID: "w1",
        position: 3,
        text: "l",
        begin: 0.4,
        end: 0.6,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c4",
        wordID: "w1",
        position: 4,
        text: "l",
        begin: 0.6,
        end: 0.8,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c5",
        wordID: "w1",
        position: 5,
        text: "o",
        begin: 0.8,
        end: 1,
        charType: "alphabet",
      }),
    ],
  });

  const w2: Word = Object.freeze({
    id: "w2",
    lineID: "l1",
    position: 2,
    timeline: Object.freeze({
      wordID: "w2",
      text: "World",
      begin: 1,
      end: 2,
      hasWhitespace: false,
      hasNewLine: false,
    }),
    chars: [
      Object.freeze({
        id: "c6",
        wordID: "w2",
        position: 1,
        text: "W",
        begin: 1,
        end: 1.2,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c7",
        wordID: "w2",
        position: 2,
        text: "o",
        begin: 1.2,
        end: 1.4,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c8",
        wordID: "w2",
        position: 3,
        text: "r",
        begin: 1.4,
        end: 1.6,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c9",
        wordID: "w2",
        position: 4,
        text: "l",
        begin: 1.6,
        end: 1.8,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c10",
        wordID: "w2",
        position: 5,
        text: "d",
        begin: 1.8,
        end: 2,
        charType: "alphabet",
      }),
    ],
  });

  const w3: Word = Object.freeze({
    id: "w3",
    lineID: "l2",
    position: 1,
    timeline: Object.freeze({
      wordID: "w3",
      text: "Test",
      begin: 3,
      end: 4,
      hasWhitespace: false,
      hasNewLine: false,
    }),
    chars: [
      Object.freeze({
        id: "c11",
        wordID: "w3",
        position: 1,
        text: "T",
        begin: 3,
        end: 3.25,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c12",
        wordID: "w3",
        position: 2,
        text: "e",
        begin: 3.25,
        end: 3.5,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c13",
        wordID: "w3",
        position: 3,
        text: "s",
        begin: 3.5,
        end: 3.75,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c14",
        wordID: "w3",
        position: 4,
        text: "t",
        begin: 3.75,
        end: 4,
        charType: "alphabet",
      }),
    ],
  });

  const w4: Word = Object.freeze({
    id: "w4",
    lineID: "l3",
    position: 1,
    timeline: Object.freeze({
      wordID: "w4",
      text: "Second",
      begin: 5,
      end: 6,
      hasWhitespace: false,
      hasNewLine: false,
    }),
    chars: [
      Object.freeze({
        id: "c15",
        wordID: "w4",
        position: 1,
        text: "S",
        begin: 5,
        end: 5.17,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c16",
        wordID: "w4",
        position: 2,
        text: "e",
        begin: 5.17,
        end: 5.33,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c17",
        wordID: "w4",
        position: 3,
        text: "c",
        begin: 5.33,
        end: 5.5,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c18",
        wordID: "w4",
        position: 4,
        text: "o",
        begin: 5.5,
        end: 5.67,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c19",
        wordID: "w4",
        position: 5,
        text: "n",
        begin: 5.67,
        end: 5.83,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c20",
        wordID: "w4",
        position: 6,
        text: "d",
        begin: 5.83,
        end: 6,
        charType: "alphabet",
      }),
    ],
  });

  const w5: Word = Object.freeze({
    id: "w5",
    lineID: "l4",
    position: 1,
    timeline: Object.freeze({
      wordID: "w5",
      text: "Para",
      begin: 6,
      end: 7,
      hasWhitespace: false,
      hasNewLine: false,
    }),
    chars: [
      Object.freeze({
        id: "c21",
        wordID: "w5",
        position: 1,
        text: "P",
        begin: 6,
        end: 6.25,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c22",
        wordID: "w5",
        position: 2,
        text: "a",
        begin: 6.25,
        end: 6.5,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c23",
        wordID: "w5",
        position: 3,
        text: "r",
        begin: 6.5,
        end: 6.75,
        charType: "alphabet",
      }),
      Object.freeze({
        id: "c24",
        wordID: "w5",
        position: 4,
        text: "a",
        begin: 6.75,
        end: 7,
        charType: "alphabet",
      }),
    ],
  });

  // Create lines
  const l1: Line = Object.freeze({
    id: "l1",
    paragraphID: "p1",
    position: 1,
    words: [w1, w2],
  });
  const l2: Line = Object.freeze({
    id: "l2",
    paragraphID: "p1",
    position: 2,
    words: [w3],
  });
  const l3: Line = Object.freeze({
    id: "l3",
    paragraphID: "p2",
    position: 1,
    words: [w4],
  });
  const l4: Line = Object.freeze({
    id: "l4",
    paragraphID: "p2",
    position: 2,
    words: [w5],
  });

  // Create paragraphs
  const p1: Paragraph = Object.freeze({
    id: "p1",
    position: 1,
    lines: [l1, l2],
  });
  const p2: Paragraph = Object.freeze({
    id: "p2",
    position: 2,
    lines: [l3, l4],
  });

  // Build index
  const _index: LyricIndex = Object.freeze({
    wordByCharId: new Map([
      ["c1", w1],
      ["c2", w1],
      ["c3", w1],
      ["c4", w1],
      ["c5", w1],
      ["c6", w2],
      ["c7", w2],
      ["c8", w2],
      ["c9", w2],
      ["c10", w2],
      ["c11", w3],
      ["c12", w3],
      ["c13", w3],
      ["c14", w3],
      ["c15", w4],
      ["c16", w4],
      ["c17", w4],
      ["c18", w4],
      ["c19", w4],
      ["c20", w4],
      ["c21", w5],
      ["c22", w5],
      ["c23", w5],
      ["c24", w5],
    ]),
    lineByWordId: new Map([
      ["w1", l1],
      ["w2", l1],
      ["w3", l2],
      ["w4", l3],
      ["w5", l4],
    ]),
    paragraphByLineId: new Map([
      ["l1", p1],
      ["l2", p1],
      ["l3", p2],
      ["l4", p2],
    ]),
    wordById: new Map([
      ["w1", w1],
      ["w2", w2],
      ["w3", w3],
      ["w4", w4],
      ["w5", w5],
    ]),
    lineById: new Map([
      ["l1", l1],
      ["l2", l2],
      ["l3", l3],
      ["l4", l4],
    ]),
    paragraphById: new Map([
      ["p1", p1],
      ["p2", p2],
    ]),
  });

  return Object.freeze({
    id: "lyric-test",
    resourceID: "test-resource",
    duration: 20,
    offsetSec: 0,
    paragraphs: [p1, p2],
    _index,
  });
}

/**
 * Helper: Get Word
 */
const getWord = (
  lyric: Lyric,
  paragraphIdx: number,
  lineIdx: number,
  wordIdx = 0,
): Word => {
  return lyric.paragraphs[paragraphIdx].lines[lineIdx].words[wordIdx];
};

describe("Editing API - shift", () => {
  describe("shiftWords", () => {
    test("should shift single word forward without overlap", () => {
      const lyric = createTestLyric();
      // w3: Test 3-4 has gap before it (w2 ends at 2)
      const testWord = getWord(lyric, 0, 1, 0);

      const result = shiftWords(lyric, [testWord.id], 0.5);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const shiftedWord = getWord(result.data, 0, 1, 0);
        expect(shiftedWord.timeline.begin).toBe(3.5);
        expect(shiftedWord.timeline.end).toBe(4.5);
        // Chars should also be shifted
        expect(shiftedWord.chars[0].begin).toBe(3.5);
      }
    });

    test("should shift single word backward without overlap", () => {
      const lyric = createTestLyric();
      // w3: Test 3-4, can shift back by 0.5 without overlapping w2 (ends at 2)
      const testWord = getWord(lyric, 0, 1, 0);

      const result = shiftWords(lyric, [testWord.id], -0.5);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const shiftedWord = getWord(result.data, 0, 1, 0);
        expect(shiftedWord.timeline.begin).toBe(2.5);
        expect(shiftedWord.timeline.end).toBe(3.5);
      }
    });

    test("should shift multiple words together without overlap", () => {
      const lyric = createTestLyric();
      // w1: Hello 0-1, w2: World 1-2
      const firstWord = getWord(lyric, 0, 0, 0);
      const secondWord = getWord(lyric, 0, 0, 1);

      // Both words shift by 0.5: Hello 0.5-1.5, World 1.5-2.5
      // This doesn't cause overlap because they're both shifted
      const result = shiftWords(lyric, [firstWord.id, secondWord.id], 0.5);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(getWord(result.data, 0, 0, 0).timeline.begin).toBe(0.5);
        expect(getWord(result.data, 0, 0, 1).timeline.begin).toBe(1.5);
      }
    });

    test("should return error for overlap when only one word shifted into another", () => {
      const lyric = createTestLyric();
      // w1: Hello 0-1, w2: World 1-2
      // Shift only w1 to 0.5-1.5, which overlaps with w2 at 1-2
      const firstWord = getWord(lyric, 0, 0, 0);

      const result = shiftWords(lyric, [firstWord.id], 0.5);

      // Hello ends at 1.5, World starts at 1 -> overlap
      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe("OVERLAP_DETECTED");
      }
    });

    test("should return error for unknown word ID", () => {
      const lyric = createTestLyric();

      const result = shiftWords(lyric, ["unknown-id"], 0.5);

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe("WORD_NOT_FOUND");
      }
    });

    test("should return error for negative begin time after shift", () => {
      const lyric = createTestLyric();
      const firstWord = getWord(lyric, 0, 0, 0);

      const result = shiftWords(lyric, [firstWord.id], -1);

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_TIME");
      }
    });

    test("should preserve immutability - original lyric unchanged", () => {
      const lyric = createTestLyric();
      const firstWord = getWord(lyric, 0, 0, 0);
      const originalBegin = firstWord.timeline.begin;

      shiftWords(lyric, [firstWord.id], 0.5);

      // Original should be unchanged
      expect(getWord(lyric, 0, 0, 0).timeline.begin).toBe(originalBegin);
    });

    test("should allow gaps between words", () => {
      const lyric = createTestLyric();
      // w3: Test 3-4, shift it to 10-11 (creating gap between w2 and w3)
      const testWord = getWord(lyric, 0, 1, 0);

      const result = shiftWords(lyric, [testWord.id], 7);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(getWord(result.data, 0, 1, 0).timeline.begin).toBe(10);
        expect(getWord(result.data, 0, 1, 0).timeline.end).toBe(11);
      }
    });
  });

  describe("shiftLines", () => {
    test("should shift line and all its words", () => {
      const lyric = createTestLyric();
      const firstLine = lyric.paragraphs[0].lines[0];

      // Line 1 has w1 (0-1) and w2 (1-2)
      // Shift by +10: w1 becomes 10-11, w2 becomes 11-12
      const result = shiftLines(lyric, [firstLine.id], 10);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const shiftedLine = result.data.paragraphs[0].lines[0];
        expect(shiftedLine.words[0].timeline.begin).toBe(10);
        expect(shiftedLine.words[0].timeline.end).toBe(11);
        expect(shiftedLine.words[1].timeline.begin).toBe(11);
        expect(shiftedLine.words[1].timeline.end).toBe(12);
      }
    });

    test("should shift multiple lines", () => {
      const lyric = createTestLyric();
      const line1 = lyric.paragraphs[0].lines[0]; // l1: w1, w2
      const line2 = lyric.paragraphs[0].lines[1]; // l2: w3

      // Shift both lines by +10
      const result = shiftLines(lyric, [line1.id, line2.id], 10);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(getWord(result.data, 0, 0, 0).timeline.begin).toBe(10);
        expect(getWord(result.data, 0, 0, 1).timeline.begin).toBe(11);
        expect(getWord(result.data, 0, 1, 0).timeline.begin).toBe(13);
      }
    });

    test("should return error for unknown line ID", () => {
      const lyric = createTestLyric();

      const result = shiftLines(lyric, ["unknown-id"], 0.5);

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe("LINE_NOT_FOUND");
      }
    });
  });

  describe("shiftParagraphs", () => {
    test("should shift paragraph and all its lines/words", () => {
      const lyric = createTestLyric();
      const secondParagraph = lyric.paragraphs[1];
      // p2 has l3 (w4: 5-6) and l4 (w5: 6-7)
      // Shift by +5: w4 becomes 10-11, w5 becomes 11-12

      const result = shiftParagraphs(lyric, [secondParagraph.id], 5);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const shifted = result.data.paragraphs[1];
        expect(shifted.lines[0].words[0].timeline.begin).toBe(10);
        expect(shifted.lines[1].words[0].timeline.begin).toBe(11);
      }
    });

    test("should return error for unknown paragraph ID", () => {
      const lyric = createTestLyric();

      const result = shiftParagraphs(lyric, ["unknown-id"], 0.5);

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe("PARAGRAPH_NOT_FOUND");
      }
    });
  });

  describe("shiftRange", () => {
    test("should shift all words in time range", () => {
      const lyric = createTestLyric();

      // Shift words starting between 0-3 (w1: 0-1, w2: 1-2) by +10
      // w3 starts at 3 so it's not included
      const result = shiftRange(lyric, 0, 3, 10);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        // w1 and w2 should be shifted
        expect(getWord(result.data, 0, 0, 0).timeline.begin).toBe(10);
        expect(getWord(result.data, 0, 0, 1).timeline.begin).toBe(11);
        // w3 (begins at 3) should not be shifted
        expect(getWord(result.data, 0, 1, 0).timeline.begin).toBe(3);
      }
    });

    test("should return error for overlap after shift", () => {
      const lyric = createTestLyric();

      // Shift w1 (0-1) to overlap with w3 (3-4)
      // Range 0-1 means only w1 is shifted
      const result = shiftRange(lyric, 0, 1, 3);

      // w1 becomes 3-4, which overlaps with w3 at 3-4
      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe("OVERLAP_DETECTED");
      }
    });
  });
});
