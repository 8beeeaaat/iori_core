import { describe, expect, test, vi } from "vitest";
import { createLine } from "../../factories/createLine";
import { createWord } from "../../factories/createWord";
import type { Line, Paragraph, Word } from "../../types";
import { checkOverlaps, rebuildIndex, reindexPositions } from "./helpers";

// Mock crypto.randomUUID for consistent testing with unique IDs
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `test-uuid-${++uuidCounter}`),
});

describe("helpers", () => {
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

  const line3: Line = createLine({
    position: 1,
    timelines: [{ wordID: "word4", text: "Good", begin: 5, end: 6 }],
  });

  const paragraph1: Paragraph = {
    id: "paragraph1",
    position: 1,
    lines: [line1, line2],
  };

  const paragraph2: Paragraph = {
    id: "paragraph2",
    position: 2,
    lines: [line3],
  };

  describe("editing helpers", () => {
    describe("rebuildIndex", () => {
      test("should rebuild index from paragraphs", () => {
        const index = rebuildIndex([paragraph1, paragraph2]);

        expect(index.paragraphById.size).toBe(2);
        expect(index.lineById.size).toBe(3);
        expect(index.wordById.size).toBe(4);

        // Check paragraph mapping
        expect(index.paragraphById.get("paragraph1")).toBe(paragraph1);
        expect(index.paragraphById.get("paragraph2")).toBe(paragraph2);

        // Check line to paragraph mapping
        expect(index.paragraphByLineId.get(line1.id)).toBe(paragraph1);
        expect(index.paragraphByLineId.get(line2.id)).toBe(paragraph1);
        expect(index.paragraphByLineId.get(line3.id)).toBe(paragraph2);

        // Check word to line mapping
        const firstWord = line1.words[0];
        expect(index.lineByWordId.get(firstWord.id)).toBe(line1);

        // Check char to word mapping
        const firstChar = firstWord.chars[0];
        expect(index.wordByCharId.get(firstChar.id)).toBe(firstWord);
      });

      test("should handle empty paragraphs", () => {
        const index = rebuildIndex([]);

        expect(index.paragraphById.size).toBe(0);
        expect(index.lineById.size).toBe(0);
        expect(index.wordById.size).toBe(0);
        expect(index.wordByCharId.size).toBe(0);
        expect(index.lineByWordId.size).toBe(0);
        expect(index.paragraphByLineId.size).toBe(0);
      });

      test("should return frozen object", () => {
        const index = rebuildIndex([paragraph1]);
        expect(Object.isFrozen(index)).toBe(true);
      });
    });

    describe("checkOverlaps", () => {
      test("should detect overlapping words", () => {
        const word1: Word = createWord({
          lineID: "line1",
          position: 1,
          timeline: {
            wordID: "word1",
            text: "First",
            begin: 0,
            end: 2,
          },
        });

        const word2: Word = createWord({
          lineID: "line1",
          position: 2,
          timeline: {
            wordID: "word2",
            text: "Second",
            begin: 1.5,
            end: 3,
          },
        });

        const result = checkOverlaps([word1, word2]);
        expect(result.hasOverlap).toBe(true);
        expect(result.details).toEqual({ word1: word1.id, word2: word2.id });
      });

      test("should not detect overlaps for adjacent non-overlapping words", () => {
        const word1: Word = createWord({
          lineID: "line1",
          position: 1,
          timeline: {
            wordID: "word1",
            text: "First",
            begin: 0,
            end: 1,
          },
        });

        const word2: Word = createWord({
          lineID: "line1",
          position: 2,
          timeline: {
            wordID: "word2",
            text: "Second",
            begin: 1.5,
            end: 2.5,
          },
        });

        const result = checkOverlaps([word1, word2]);
        expect(result.hasOverlap).toBe(false);
        expect(result.details).toBeUndefined();
      });

      test("should handle exact boundary (end === next begin)", () => {
        const word1: Word = createWord({
          lineID: "line1",
          position: 1,
          timeline: {
            wordID: "word1",
            text: "First",
            begin: 0,
            end: 1,
          },
        });

        const word2: Word = createWord({
          lineID: "line1",
          position: 2,
          timeline: {
            wordID: "word2",
            text: "Second",
            begin: 1,
            end: 2,
          },
        });

        const result = checkOverlaps([word1, word2]);
        expect(result.hasOverlap).toBe(false);
      });

      test("should sort words before checking", () => {
        const word1: Word = createWord({
          lineID: "line1",
          position: 1,
          timeline: {
            wordID: "word1",
            text: "First",
            begin: 2,
            end: 3,
          },
        });

        const word2: Word = createWord({
          lineID: "line1",
          position: 2,
          timeline: {
            wordID: "word2",
            text: "Second",
            begin: 0,
            end: 2.5,
          },
        });

        // Pass in wrong order
        const result = checkOverlaps([word1, word2]);
        expect(result.hasOverlap).toBe(true);
      });

      test("should handle single word", () => {
        const word: Word = createWord({
          lineID: "line1",
          position: 1,
          timeline: {
            wordID: "word1",
            text: "Only",
            begin: 0,
            end: 1,
          },
        });

        const result = checkOverlaps([word]);
        expect(result.hasOverlap).toBe(false);
      });

      test("should handle empty array", () => {
        const result = checkOverlaps([]);
        expect(result.hasOverlap).toBe(false);
      });
    });

    describe("reindexPositions", () => {
      test("should reassign 1-based positions", () => {
        const items = [
          { id: "a", position: 5 },
          { id: "b", position: 10 },
          { id: "c", position: 15 },
        ];

        const result = reindexPositions(items);

        expect(result[0].position).toBe(1);
        expect(result[1].position).toBe(2);
        expect(result[2].position).toBe(3);
      });

      test("should preserve other properties", () => {
        const items = [
          { id: "a", position: 5, extra: "data" },
          { id: "b", position: 10, extra: "more" },
        ];

        const result = reindexPositions(items);

        expect(result[0]).toEqual({ id: "a", position: 1, extra: "data" });
        expect(result[1]).toEqual({ id: "b", position: 2, extra: "more" });
      });

      test("should return frozen objects", () => {
        const items = [{ id: "a", position: 1 }];
        const result = reindexPositions(items);

        expect(Object.isFrozen(result[0])).toBe(true);
      });

      test("should handle empty array", () => {
        const result = reindexPositions([]);
        expect(result).toEqual([]);
      });

      test("should not mutate original array", () => {
        const items = [
          { id: "a", position: 5 },
          { id: "b", position: 10 },
        ];

        reindexPositions(items);

        expect(items[0].position).toBe(5);
        expect(items[1].position).toBe(10);
      });
    });
  });
});
