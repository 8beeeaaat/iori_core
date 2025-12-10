/**
 * Editing API - Merge functions のテスト
 */

import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Char, Line, Lyric, LyricIndex, Paragraph, Word } from "../types";
import { mergeLines, mergeWords } from "./merge";

// UUIDをモック
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

/**
 * テスト用のLyricを作成
 */
function createTestLyric(): Lyric {
  // Charを手動構築
  const c1: Char = Object.freeze({
    id: "c1",
    wordID: "w1",
    text: "さ",
    type: "HIRAGANA",
    position: 1,
    begin: 0.0,
    end: 0.3,
  });

  const c2: Char = Object.freeze({
    id: "c2",
    wordID: "w2",
    text: "く",
    type: "HIRAGANA",
    position: 1,
    begin: 0.3,
    end: 0.6,
  });

  const c3: Char = Object.freeze({
    id: "c3",
    wordID: "w3",
    text: "ら",
    type: "HIRAGANA",
    position: 1,
    begin: 0.6,
    end: 1.0,
  });

  const c4: Char = Object.freeze({
    id: "c4",
    wordID: "w4",
    text: "咲",
    type: "KANJI",
    position: 1,
    begin: 1.2,
    end: 1.6,
  });

  const c5: Char = Object.freeze({
    id: "c5",
    wordID: "w4",
    text: "い",
    type: "HIRAGANA",
    position: 2,
    begin: 1.6,
    end: 1.8,
  });

  const c6: Char = Object.freeze({
    id: "c6",
    wordID: "w4",
    text: "た",
    type: "HIRAGANA",
    position: 3,
    begin: 1.8,
    end: 2.0,
  });

  // Wordを手動構築
  const w1: Word = Object.freeze({
    id: "w1",
    lineID: "l1",
    position: 1,
    timeline: { wordID: "w1", text: "さ", begin: 0.0, end: 0.3 },
    chars: [c1],
  });

  const w2: Word = Object.freeze({
    id: "w2",
    lineID: "l1",
    position: 2,
    timeline: { wordID: "w2", text: "く", begin: 0.3, end: 0.6 },
    chars: [c2],
  });

  const w3: Word = Object.freeze({
    id: "w3",
    lineID: "l1",
    position: 3,
    timeline: { wordID: "w3", text: "ら", begin: 0.6, end: 1.0 },
    chars: [c3],
  });

  const w4: Word = Object.freeze({
    id: "w4",
    lineID: "l1",
    position: 4,
    timeline: {
      wordID: "w4",
      text: "咲いた",
      begin: 1.2,
      end: 2.0,
      hasNewLine: true,
    },
    chars: [c4, c5, c6],
  });

  const w5: Word = Object.freeze({
    id: "w5",
    lineID: "l2",
    position: 1,
    timeline: { wordID: "w5", text: "春", begin: 2.5, end: 3.0 },
    chars: [
      Object.freeze({
        id: "c7",
        wordID: "w5",
        text: "春",
        type: "KANJI",
        position: 1,
        begin: 2.5,
        end: 3.0,
      }),
    ],
  });

  // Lineを手動構築
  const l1: Line = Object.freeze({
    id: "l1",
    position: 1,
    words: [w1, w2, w3, w4],
  });

  const l2: Line = Object.freeze({
    id: "l2",
    position: 2,
    words: [w5],
  });

  const l3: Line = Object.freeze({
    id: "l3",
    position: 1,
    words: [
      Object.freeze({
        id: "w6",
        lineID: "l3",
        position: 1,
        timeline: { wordID: "w6", text: "夏", begin: 5.0, end: 5.5 },
        chars: [
          Object.freeze({
            id: "c8",
            wordID: "w6",
            text: "夏",
            type: "KANJI",
            position: 1,
            begin: 5.0,
            end: 5.5,
          }),
        ],
      }),
    ],
  });

  // Paragraphを手動構築
  const p1: Paragraph = Object.freeze({
    id: "p1",
    position: 1,
    lines: [l1, l2],
  });

  const p2: Paragraph = Object.freeze({
    id: "p2",
    position: 2,
    lines: [l3],
  });

  // Indexを手動構築
  const _index: LyricIndex = Object.freeze({
    wordByCharId: new Map([
      ["c1", w1],
      ["c2", w2],
      ["c3", w3],
      ["c4", w4],
      ["c5", w4],
      ["c6", w4],
      ["c7", w5],
    ]),
    lineByWordId: new Map([
      ["w1", l1],
      ["w2", l1],
      ["w3", l1],
      ["w4", l1],
      ["w5", l2],
    ]),
    paragraphByLineId: new Map([
      ["l1", p1],
      ["l2", p1],
      ["l3", p2],
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
    ]),
    paragraphById: new Map([
      ["p1", p1],
      ["p2", p2],
    ]),
  });

  return Object.freeze({
    id: "lyric-1",
    resourceID: "test-resource",
    duration: 10.0,
    offsetSec: 0,
    paragraphs: [p1, p2],
    _index,
  });
}

describe("Editing API - merge", () => {
  let testLyric: Lyric;

  beforeEach(() => {
    testLyric = createTestLyric();
  });

  describe("mergeWords", () => {
    test("should merge two continuous words", () => {
      const result = mergeWords(testLyric, ["w1", "w2"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const line = result.data._index.lineById.get("l1");
      expect(line?.words.length).toBe(3); // w1+w2, w3, w4

      const mergedWord = line?.words[0];
      expect(mergedWord?.timeline.text).toBe("さく");
      expect(mergedWord?.timeline.begin).toBe(0.0);
      expect(mergedWord?.timeline.end).toBe(0.6);
      expect(mergedWord?.id).toBe("w1"); // 最初のIDを維持
    });

    test("should merge three continuous words", () => {
      const result = mergeWords(testLyric, ["w1", "w2", "w3"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const line = result.data._index.lineById.get("l1");
      expect(line?.words.length).toBe(2); // w1+w2+w3, w4

      const mergedWord = line?.words[0];
      expect(mergedWord?.timeline.text).toBe("さくら");
      expect(mergedWord?.timeline.begin).toBe(0.0);
      expect(mergedWord?.timeline.end).toBe(1.0);
    });

    test("should update position correctly", () => {
      const result = mergeWords(testLyric, ["w1", "w2"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const line = result.data._index.lineById.get("l1");
      expect(line?.words[0].position).toBe(1);
      expect(line?.words[1].position).toBe(2);
      expect(line?.words[2].position).toBe(3);
    });

    test("should preserve hasNewLine from last word", () => {
      const result = mergeWords(testLyric, ["w3", "w4"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const line = result.data._index.lineById.get("l1");
      const mergedWord = line?.words.find((w) => w.id === "w3");
      expect(mergedWord?.timeline.hasNewLine).toBe(true);
    });

    test("should return error for insufficient words", () => {
      const result = mergeWords(testLyric, ["w1"]);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("INSUFFICIENT_WORDS");
    });

    test("should return error for non-existent word", () => {
      const result = mergeWords(testLyric, ["w1", "w999"]);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("WORD_NOT_FOUND");
    });

    test("should return error for words in different lines", () => {
      const result = mergeWords(testLyric, ["w1", "w5"]);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("WORDS_NOT_IN_SAME_LINE");
    });

    test("should preserve immutability", () => {
      const originalWords = testLyric.paragraphs[0].lines[0].words;
      mergeWords(testLyric, ["w1", "w2"]);

      // 元のLyricは変更されていない
      expect(testLyric.paragraphs[0].lines[0].words).toBe(originalWords);
      expect(testLyric.paragraphs[0].lines[0].words.length).toBe(4);
    });

    test("should rebuild index correctly", () => {
      const result = mergeWords(testLyric, ["w1", "w2"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      // w2が削除され、w1のみ存在
      expect(result.data._index.wordById.has("w1")).toBe(true);
      expect(result.data._index.wordById.has("w2")).toBe(false);
    });
  });

  describe("mergeLines", () => {
    test("should merge two lines", () => {
      const result = mergeLines(testLyric, ["l1", "l2"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const paragraph = result.data._index.paragraphById.get("p1");
      expect(paragraph?.lines.length).toBe(1);

      const mergedLine = paragraph?.lines[0];
      expect(mergedLine?.words.length).toBe(5); // w1, w2, w3, w4, w5
      expect(mergedLine?.id).toBe("l1"); // 最初のIDを維持
    });

    test("should update all word lineIDs", () => {
      const result = mergeLines(testLyric, ["l1", "l2"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const mergedLine = result.data._index.lineById.get("l1");
      for (const word of mergedLine?.words ?? []) {
        expect(word.lineID).toBe("l1");
      }
    });

    test("should update positions correctly", () => {
      const result = mergeLines(testLyric, ["l1", "l2"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const mergedLine = result.data._index.lineById.get("l1");
      expect(mergedLine?.words[0].position).toBe(1);
      expect(mergedLine?.words[4].position).toBe(5);
    });

    test("should return error for insufficient lines", () => {
      const result = mergeLines(testLyric, ["l1"]);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("INSUFFICIENT_LINES");
    });

    test("should return error for non-existent line", () => {
      const result = mergeLines(testLyric, ["l1", "l999"]);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("LINE_NOT_FOUND");
    });

    test("should return error for lines in different paragraphs", () => {
      const result = mergeLines(testLyric, ["l1", "l3"]);

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("LINES_NOT_IN_SAME_PARAGRAPH");
    });

    test("should preserve immutability", () => {
      const originalLines = testLyric.paragraphs[0].lines;
      mergeLines(testLyric, ["l1", "l2"]);

      // 元のLyricは変更されていない
      expect(testLyric.paragraphs[0].lines).toBe(originalLines);
      expect(testLyric.paragraphs[0].lines.length).toBe(2);
    });

    test("should rebuild index correctly", () => {
      const result = mergeLines(testLyric, ["l1", "l2"]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      // l2が削除され、l1のみ存在
      expect(result.data._index.lineById.has("l1")).toBe(true);
      expect(result.data._index.lineById.has("l2")).toBe(false);

      // w5のlineIDがl1に更新されている
      const w5Line = result.data._index.lineByWordId.get("w5");
      expect(w5Line?.id).toBe("l1");
    });
  });
});
