/**
 * Editing API - Split functions tests
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
  Char,
  Line,
  Lyric,
  LyricIndex,
  Paragraph,
  Word,
} from "../../types";
import { splitLine, splitWord } from "./split";

// Mock UUID
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

/**
 * Create test Lyric
 */
function createTestLyric(): Lyric {
  // Manually construct Char
  const chars1: Char[] = [
    Object.freeze({
      id: "c1",
      wordID: "w1",
      text: "さ",
      type: "HIRAGANA",
      position: 1,
      begin: 0.0,
      end: 0.25,
    }),
    Object.freeze({
      id: "c2",
      wordID: "w1",
      text: "く",
      type: "HIRAGANA",
      position: 2,
      begin: 0.25,
      end: 0.5,
    }),
    Object.freeze({
      id: "c3",
      wordID: "w1",
      text: "ら",
      type: "HIRAGANA",
      position: 3,
      begin: 0.5,
      end: 0.75,
    }),
    Object.freeze({
      id: "c4",
      wordID: "w1",
      text: "さ",
      type: "HIRAGANA",
      position: 4,
      begin: 0.75,
      end: 1.0,
    }),
    Object.freeze({
      id: "c5",
      wordID: "w1",
      text: "く",
      type: "HIRAGANA",
      position: 5,
      begin: 1.0,
      end: 1.25,
    }),
  ];

  // Manually construct Word
  const w1: Word = Object.freeze({
    id: "w1",
    lineID: "l1",
    position: 1,
    timeline: { wordID: "w1", text: "さくらさく", begin: 0.0, end: 1.25 },
    chars: chars1,
  });

  const w2: Word = Object.freeze({
    id: "w2",
    lineID: "l1",
    position: 2,
    timeline: {
      wordID: "w2",
      text: "咲いた",
      begin: 1.5,
      end: 2.0,
      hasNewLine: true,
    },
    chars: [
      Object.freeze({
        id: "c6",
        wordID: "w2",
        text: "咲",
        type: "KANJI",
        position: 1,
        begin: 1.5,
        end: 1.7,
      }),
      Object.freeze({
        id: "c7",
        wordID: "w2",
        text: "い",
        type: "HIRAGANA",
        position: 2,
        begin: 1.7,
        end: 1.85,
      }),
      Object.freeze({
        id: "c8",
        wordID: "w2",
        text: "た",
        type: "HIRAGANA",
        position: 3,
        begin: 1.85,
        end: 2.0,
      }),
    ],
  });

  const w3: Word = Object.freeze({
    id: "w3",
    lineID: "l2",
    position: 1,
    timeline: { wordID: "w3", text: "春", begin: 3.0, end: 3.5 },
    chars: [
      Object.freeze({
        id: "c9",
        wordID: "w3",
        text: "春",
        type: "KANJI",
        position: 1,
        begin: 3.0,
        end: 3.5,
      }),
    ],
  });

  const w4: Word = Object.freeze({
    id: "w4",
    lineID: "l2",
    position: 2,
    timeline: { wordID: "w4", text: "夏", begin: 4.0, end: 4.5 },
    chars: [
      Object.freeze({
        id: "c10",
        wordID: "w4",
        text: "夏",
        type: "KANJI",
        position: 1,
        begin: 4.0,
        end: 4.5,
      }),
    ],
  });

  // Manually construct Line
  const l1: Line = Object.freeze({
    id: "l1",
    position: 1,
    words: [w1, w2],
  });

  const l2: Line = Object.freeze({
    id: "l2",
    position: 2,
    words: [w3, w4],
  });

  // Manually construct Paragraph
  const p1: Paragraph = Object.freeze({
    id: "p1",
    position: 1,
    lines: [l1, l2],
  });

  // Manually construct Index
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
      ["c9", w3],
      ["c10", w4],
    ]),
    lineByWordId: new Map([
      ["w1", l1],
      ["w2", l1],
      ["w3", l2],
      ["w4", l2],
    ]),
    paragraphByLineId: new Map([
      ["l1", p1],
      ["l2", p1],
    ]),
    wordById: new Map([
      ["w1", w1],
      ["w2", w2],
      ["w3", w3],
      ["w4", w4],
    ]),
    lineById: new Map([
      ["l1", l1],
      ["l2", l2],
    ]),
    paragraphById: new Map([["p1", p1]]),
  });

  return Object.freeze({
    id: "lyric-1",
    resourceID: "test-resource",
    duration: 10.0,
    offsetSec: 0,
    paragraphs: [p1],
    _index,
  });
}

describe("Editing API - split", () => {
  let testLyric: Lyric;

  beforeEach(() => {
    testLyric = createTestLyric();
  });

  describe("splitWord", () => {
    describe("position split", () => {
      test("should split word by character position", () => {
        const result = splitWord(testLyric, "w1", {
          type: "position",
          charIndex: 3, // split at position 3
        });

        expect(result.success).toBe(true);
        if (!result.success) return;

        const line = result.data._index.lineById.get("l1");
        expect(line?.words.length).toBe(3); // w1(split), w1-new, w2

        const firstWord = line?.words[0];
        expect(firstWord?.timeline.text).toBe("さくら");
        expect(firstWord?.timeline.begin).toBe(0.0);
        expect(firstWord?.timeline.end).toBe(0.75);
        expect(firstWord?.id).toBe("w1"); // Preserve original ID

        const secondWord = line?.words[1];
        expect(secondWord?.timeline.text).toBe("さく");
        expect(secondWord?.timeline.begin).toBe(0.75);
        expect(secondWord?.timeline.end).toBe(1.25);
        expect(secondWord?.id).toBe("word-test-uuid-123"); // New ID
      });

      test("should update positions correctly", () => {
        const result = splitWord(testLyric, "w1", {
          type: "position",
          charIndex: 3,
        });

        expect(result.success).toBe(true);
        if (!result.success) return;

        const line = result.data._index.lineById.get("l1");
        expect(line?.words[0].position).toBe(1);
        expect(line?.words[1].position).toBe(2);
        expect(line?.words[2].position).toBe(3);
      });

      test("should preserve hasNewLine in second word", () => {
        const result = splitWord(testLyric, "w2", {
          type: "position",
          charIndex: 2,
        });

        expect(result.success).toBe(true);
        if (!result.success) return;

        const line = result.data._index.lineById.get("l1");
        const secondWord = line?.words.find((w) => w.id.includes("test-uuid"));
        expect(secondWord?.timeline.hasNewLine).toBe(true);
      });

      test("should return error for invalid position", () => {
        const result = splitWord(testLyric, "w1", {
          type: "position",
          charIndex: 0, // Invalid position
        });

        expect(result.success).toBe(false);
        if (result.success) return;

        expect(result.error.code).toBe("INVALID_SPLIT_POSITION");
      });

      test("should return error for position >= word length", () => {
        const result = splitWord(testLyric, "w1", {
          type: "position",
          charIndex: 10, // >= word.chars.length
        });

        expect(result.success).toBe(false);
        if (result.success) return;

        expect(result.error.code).toBe("INVALID_SPLIT_POSITION");
      });
    });

    describe("time split", () => {
      test("should split word by time", () => {
        // w1 chars: char1(0.0-0.25), char2(0.25-0.5), char3(0.5-0.75), char4(0.75-1.0), char5(1.0-1.25)
        // splitTime: 0.75 is the start time of the 4th char, so first 3 chars go to first Word
        const result = splitWord(testLyric, "w1", {
          type: "time",
          splitTime: 0.75, // Start time of 4th char
        });

        expect(result.success).toBe(true);
        if (!result.success) return;

        const line = result.data._index.lineById.get("l1");
        expect(line?.words.length).toBe(3);

        const firstWord = line?.words[0];
        expect(firstWord?.timeline.text).toBe("さくら");
        expect(firstWord?.timeline.begin).toBe(0.0);
        expect(firstWord?.timeline.end).toBe(0.75);
      });

      test("should return error for invalid split time", () => {
        const result = splitWord(testLyric, "w1", {
          type: "time",
          splitTime: -0.5, // Less than word.timeline.begin
        });

        expect(result.success).toBe(false);
        if (result.success) return;

        expect(result.error.code).toBe("INVALID_SPLIT_TIME");
      });

      test("should return error for time >= word.timeline.end", () => {
        const result = splitWord(testLyric, "w1", {
          type: "time",
          splitTime: 2.0, // >= word.timeline.end
        });

        expect(result.success).toBe(false);
        if (result.success) return;

        expect(result.error.code).toBe("INVALID_SPLIT_TIME");
      });
    });

    test("should return error for non-existent word", () => {
      const result = splitWord(testLyric, "w999", {
        type: "position",
        charIndex: 1,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("WORD_NOT_FOUND");
    });

    test("should preserve immutability", () => {
      const originalWords = testLyric.paragraphs[0].lines[0].words;
      splitWord(testLyric, "w1", { type: "position", charIndex: 3 });

      // Original Lyric is unchanged
      expect(testLyric.paragraphs[0].lines[0].words).toBe(originalWords);
      expect(testLyric.paragraphs[0].lines[0].words.length).toBe(2);
    });

    test("should rebuild index correctly", () => {
      const result = splitWord(testLyric, "w1", {
        type: "position",
        charIndex: 3,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      // New Word has been added
      expect(result.data._index.wordById.has("w1")).toBe(true);
      expect(result.data._index.wordById.has("word-test-uuid-123")).toBe(true);
    });
  });

  describe("splitLine", () => {
    describe("word split", () => {
      test("should split line by word ID", () => {
        const result = splitLine(testLyric, "l2", {
          type: "word",
          splitWordID: "w4", // w3 | w4
        });

        expect(result.success).toBe(true);
        if (!result.success) return;

        const paragraph = result.data._index.paragraphById.get("p1");
        expect(paragraph?.lines.length).toBe(3); // l1, l2(split), l2-new

        const firstLine = paragraph?.lines[1];
        expect(firstLine?.words.length).toBe(1);
        expect(firstLine?.words[0].id).toBe("w3");
        expect(firstLine?.id).toBe("l2"); // Preserve original ID

        const secondLine = paragraph?.lines[2];
        expect(secondLine?.words.length).toBe(1);
        expect(secondLine?.words[0].id).toBe("w4");
        expect(secondLine?.id).toBe("line-test-uuid-123"); // New ID
      });

      test("should update word lineIDs", () => {
        const result = splitLine(testLyric, "l2", {
          type: "word",
          splitWordID: "w4",
        });

        expect(result.success).toBe(true);
        if (!result.success) return;

        const w3 = result.data._index.wordById.get("w3");
        expect(w3?.lineID).toBe("l2");

        const w4 = result.data._index.wordById.get("w4");
        expect(w4?.lineID).toBe("line-test-uuid-123");
      });

      test("should update positions correctly", () => {
        const result = splitLine(testLyric, "l2", {
          type: "word",
          splitWordID: "w4",
        });

        expect(result.success).toBe(true);
        if (!result.success) return;

        const paragraph = result.data._index.paragraphById.get("p1");
        expect(paragraph?.lines[0].position).toBe(1);
        expect(paragraph?.lines[1].position).toBe(2);
        expect(paragraph?.lines[2].position).toBe(3);

        // Word positions are also recalculated
        expect(paragraph?.lines[1].words[0].position).toBe(1);
        expect(paragraph?.lines[2].words[0].position).toBe(1);
      });

      test("should return error for invalid split word", () => {
        const result = splitLine(testLyric, "l2", {
          type: "word",
          splitWordID: "w1", // Not in l2
        });

        expect(result.success).toBe(false);
        if (result.success) return;

        expect(result.error.code).toBe("INVALID_SPLIT_WORD");
      });

      test("should return error for first word", () => {
        const result = splitLine(testLyric, "l2", {
          type: "word",
          splitWordID: "w3", // First word is invalid
        });

        expect(result.success).toBe(false);
        if (result.success) return;

        expect(result.error.code).toBe("INVALID_SPLIT_WORD");
      });
    });

    describe("time split", () => {
      test("should split line by time", () => {
        const result = splitLine(testLyric, "l2", {
          type: "time",
          splitTime: 4.0, // w4 start time
        });

        expect(result.success).toBe(true);
        if (!result.success) return;

        const paragraph = result.data._index.paragraphById.get("p1");
        expect(paragraph?.lines.length).toBe(3);

        const firstLine = paragraph?.lines[1];
        expect(firstLine?.words[0].id).toBe("w3");

        const secondLine = paragraph?.lines[2];
        expect(secondLine?.words[0].id).toBe("w4");
      });

      test("should return error for invalid split time", () => {
        const result = splitLine(testLyric, "l2", {
          type: "time",
          splitTime: 2.0, // Outside l2's range
        });

        expect(result.success).toBe(false);
        if (result.success) return;

        expect(result.error.code).toBe("INVALID_SPLIT_TIME");
      });
    });

    test("should return error for non-existent line", () => {
      const result = splitLine(testLyric, "l999", {
        type: "word",
        splitWordID: "w1",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("LINE_NOT_FOUND");
    });

    test("should preserve immutability", () => {
      const originalLines = testLyric.paragraphs[0].lines;
      splitLine(testLyric, "l2", { type: "word", splitWordID: "w4" });

      // Original Lyric is unchanged
      expect(testLyric.paragraphs[0].lines).toBe(originalLines);
      expect(testLyric.paragraphs[0].lines.length).toBe(2);
    });

    test("should rebuild index correctly", () => {
      const result = splitLine(testLyric, "l2", {
        type: "word",
        splitWordID: "w4",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      // New Line has been added
      expect(result.data._index.lineById.has("l2")).toBe(true);
      expect(result.data._index.lineById.has("line-test-uuid-123")).toBe(true);

      // w4's parent Line has been updated
      const w4Line = result.data._index.lineByWordId.get("w4");
      expect(w4Line?.id).toBe("line-test-uuid-123");
    });
  });
});
