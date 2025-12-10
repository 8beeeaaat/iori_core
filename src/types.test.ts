import { describe, expect, test, vi } from "vitest";
import { createLyric } from "./factories/createLyric";
import type { Lyric } from "./types";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${Math.random().toString(36).slice(2, 11)}`),
});

describe("Lyric._index", () => {
  const createTestLyric = async (): Promise<Lyric> => {
    return await createLyric({
      resourceID: "test-resource",
      duration: 10,
      timelines: [
        [
          [
            { text: "Hello", begin: 0, end: 1 },
            { text: "World", begin: 1, end: 2 },
          ],
          [{ text: "Test", begin: 2, end: 3 }],
        ],
        [
          [
            { text: "Second", begin: 4, end: 5 },
            { text: "Paragraph", begin: 5, end: 6 },
          ],
        ],
      ],
    });
  };

  describe("wordByCharId", () => {
    test("should find word by char ID in O(1)", async () => {
      const lyric = await createTestLyric();

      // Get a char from the lyric
      const firstChar = lyric.paragraphs[0].lines[0].words[0].chars[0];

      const foundWord = lyric._index.wordByCharId.get(firstChar.id);

      expect(foundWord).toBeDefined();
      expect(foundWord?.id).toBe(lyric.paragraphs[0].lines[0].words[0].id);
    });

    test("should return undefined for unknown char ID", async () => {
      const lyric = await createTestLyric();

      const foundWord = lyric._index.wordByCharId.get("unknown-id");

      expect(foundWord).toBeUndefined();
    });

    test("should index all chars", async () => {
      const lyric = await createTestLyric();

      let totalChars = 0;
      for (const paragraph of lyric.paragraphs) {
        for (const line of paragraph.lines) {
          for (const word of line.words) {
            totalChars += word.chars.length;
          }
        }
      }

      expect(lyric._index.wordByCharId.size).toBe(totalChars);
    });
  });

  describe("lineByWordId", () => {
    test("should find line by word ID in O(1)", async () => {
      const lyric = await createTestLyric();

      const firstWord = lyric.paragraphs[0].lines[0].words[0];

      const foundLine = lyric._index.lineByWordId.get(firstWord.id);

      expect(foundLine).toBeDefined();
      expect(foundLine?.id).toBe(lyric.paragraphs[0].lines[0].id);
    });

    test("should return undefined for unknown word ID", async () => {
      const lyric = await createTestLyric();

      const foundLine = lyric._index.lineByWordId.get("unknown-id");

      expect(foundLine).toBeUndefined();
    });
  });

  describe("paragraphByLineId", () => {
    test("should find paragraph by line ID in O(1)", async () => {
      const lyric = await createTestLyric();

      const firstLine = lyric.paragraphs[0].lines[0];

      const foundParagraph = lyric._index.paragraphByLineId.get(firstLine.id);

      expect(foundParagraph).toBeDefined();
      expect(foundParagraph?.id).toBe(lyric.paragraphs[0].id);
    });

    test("should return undefined for unknown line ID", async () => {
      const lyric = await createTestLyric();

      const foundParagraph = lyric._index.paragraphByLineId.get("unknown-id");

      expect(foundParagraph).toBeUndefined();
    });
  });

  describe("wordById", () => {
    test("should find word by ID in O(1)", async () => {
      const lyric = await createTestLyric();

      const firstWord = lyric.paragraphs[0].lines[0].words[0];

      const foundWord = lyric._index.wordById.get(firstWord.id);

      expect(foundWord).toBeDefined();
      expect(foundWord?.id).toBe(firstWord.id);
    });
  });

  describe("lineById", () => {
    test("should find line by ID in O(1)", async () => {
      const lyric = await createTestLyric();

      const firstLine = lyric.paragraphs[0].lines[0];

      const foundLine = lyric._index.lineById.get(firstLine.id);

      expect(foundLine).toBeDefined();
      expect(foundLine?.id).toBe(firstLine.id);
    });
  });

  describe("paragraphById", () => {
    test("should find paragraph by ID in O(1)", async () => {
      const lyric = await createTestLyric();

      const firstParagraph = lyric.paragraphs[0];

      const foundParagraph = lyric._index.paragraphById.get(firstParagraph.id);

      expect(foundParagraph).toBeDefined();
      expect(foundParagraph?.id).toBe(firstParagraph.id);
    });
  });
});
