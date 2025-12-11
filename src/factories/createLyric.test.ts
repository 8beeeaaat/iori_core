import { describe, expect, test, vi } from "vitest";
import type { WordTimeline } from "../Constants";
import type { CreateLyricArgs } from "../types";
import { createLyric } from "./createLyric";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

describe("createLyric", () => {
  const basicTimelines: WordTimeline[][][] = [
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
    ],
    [
      // Paragraph 2
      [
        // Line 1
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
          end: 5,
          hasWhitespace: true,
        },
        {
          wordID: "word5",
          text: "you",
          begin: 5.5,
          end: 6,
        },
      ],
    ],
  ];

  const baseArgs: CreateLyricArgs = {
    resourceID: "test-resource",
    timelines: basicTimelines,
  };

  test("should create a lyric with paragraphs", async () => {
    const lyric = await createLyric(baseArgs);

    expect(lyric.resourceID).toBe("test-resource");
    expect(lyric.duration).toBe(6); // Last end (6) - First begin (0)
    expect(lyric.offsetSec).toBe(0);
    expect(lyric.paragraphs).toHaveLength(2);
    expect(lyric.paragraphs[0].lines[0].words[0].timeline.text).toBe("Hello");
    expect(lyric.paragraphs[1].lines[0].words[0].timeline.text).toBe("How");
  });

  test("should be frozen (immutable)", async () => {
    const lyric = await createLyric(baseArgs);

    expect(Object.isFrozen(lyric)).toBe(true);
    // Arrays may not be automatically frozen, but lyric itself is immutable
    expect(Array.isArray(lyric.paragraphs)).toBe(true);
  });

  test("should calculate duration from timelines", async () => {
    // Duration is now auto-calculated: last end - first begin
    const lyric = await createLyric(baseArgs);

    // basicTimelines: first begin=0, last end=6 => duration=6
    expect(lyric.duration).toBe(6);
  });

  describe("ID handling", () => {
    test("should use provided ID", async () => {
      const lyric = await createLyric({
        ...baseArgs,
        id: "custom-id",
      });

      expect(lyric.id).toBe("custom-id");
    });

    test("should generate ID when initID is true", async () => {
      const lyric = await createLyric({
        ...baseArgs,
        initID: true,
      });

      expect(lyric.id).toBe("lyric-test-uuid-123");
    });

    test("should use empty string when no ID options", async () => {
      const lyric = await createLyric(baseArgs);

      expect(lyric.id).toBe("");
    });

    test("should prefer provided ID over initID", async () => {
      const lyric = await createLyric({
        ...baseArgs,
        id: "custom-id",
        initID: true,
      });

      expect(lyric.id).toBe("custom-id");
    });
  });

  test("should handle custom offsetSec", async () => {
    const lyric = await createLyric({
      ...baseArgs,
      offsetSec: 2.5,
    });

    expect(lyric.offsetSec).toBe(2.5);
  });

  test("should use default offsetSec when not provided", async () => {
    const lyric = await createLyric(baseArgs);

    expect(lyric.offsetSec).toBe(0);
  });

  test("should assign correct positions to paragraphs", async () => {
    const lyric = await createLyric(baseArgs);

    expect(lyric.paragraphs[0].position).toBe(1);
    expect(lyric.paragraphs[1].position).toBe(2);
  });

  test("should handle single paragraph", async () => {
    const singleParagraphTimelines: WordTimeline[][][] = [
      [
        [
          {
            wordID: "single",
            text: "Hello",
            begin: 0,
            end: 1,
          },
        ],
      ],
    ];

    const lyric = await createLyric({
      ...baseArgs,
      timelines: singleParagraphTimelines,
    });

    expect(lyric.paragraphs).toHaveLength(1);
    expect(lyric.paragraphs[0].lines[0].words[0].timeline.text).toBe("Hello");
  });

  test("should handle empty timelines", async () => {
    const lyric = await createLyric({
      ...baseArgs,
      timelines: [],
    });

    expect(lyric.paragraphs).toHaveLength(0);
  });

  test("should pass tokenizers to paragraphs", async () => {
    const mockLineTokenizer = vi
      .fn()
      .mockImplementation(({ position, timelines }) =>
        Promise.resolve(
          new Map([
            [
              position,
              {
                position,
                timelines,
                jointNearWord: false,
              },
            ],
          ]),
        ),
      );

    const mockParagraphTokenizer = vi
      .fn()
      .mockImplementation((timelines) => Promise.resolve(timelines));

    const lyric = await createLyric({
      ...baseArgs,
      lineTokenizer: mockLineTokenizer,
      paragraphTokenizer: mockParagraphTokenizer,
    });

    expect(mockParagraphTokenizer).toHaveBeenCalledTimes(2);
    expect(mockLineTokenizer).toHaveBeenCalled();
    expect(lyric.paragraphs).toHaveLength(2);
  });

  test("should handle complex nested structure", async () => {
    const complexTimelines: WordTimeline[][][] = [
      [
        // Paragraph 1
        [
          // Line 1
          {
            wordID: "p1l1w1",
            text: "First",
            begin: 0,
            end: 1,
          },
          {
            wordID: "p1l1w2",
            text: "line",
            begin: 1.5,
            end: 2,
          },
        ],
        [
          // Line 2
          {
            wordID: "p1l2w1",
            text: "Second",
            begin: 3,
            end: 4,
          },
          {
            wordID: "p1l2w2",
            text: "line",
            begin: 4.5,
            end: 5,
          },
        ],
      ],
      [
        // Paragraph 2
        [
          // Line 1
          {
            wordID: "p2l1w1",
            text: "Third",
            begin: 6,
            end: 7,
          },
          {
            wordID: "p2l1w2",
            text: "line",
            begin: 7.5,
            end: 8,
          },
        ],
      ],
    ];

    const lyric = await createLyric({
      ...baseArgs,
      timelines: complexTimelines,
    });

    expect(lyric.paragraphs).toHaveLength(2);
    expect(lyric.paragraphs[0].lines).toHaveLength(2);
    expect(lyric.paragraphs[1].lines).toHaveLength(1);

    // Words may be joined by the line creation logic
    expect(lyric.paragraphs[0].lines[0].words[0].timeline.text).toContain(
      "First",
    );
    expect(lyric.paragraphs[0].lines[1].words[0].timeline.text).toContain(
      "Second",
    );
    expect(lyric.paragraphs[1].lines[0].words[0].timeline.text).toContain(
      "Third",
    );
  });

  test("should handle empty timelines with zero duration", async () => {
    const lyric = await createLyric({
      resourceID: "test-resource",
      timelines: [],
    });

    expect(lyric.duration).toBe(0);
  });

  test("should handle negative offsetSec", async () => {
    const lyric = await createLyric({
      ...baseArgs,
      offsetSec: -1.5,
    });

    expect(lyric.offsetSec).toBe(-1.5);
  });

  test("should preserve resourceID exactly", async () => {
    const specialResourceID = "special-resource-123!@#";

    const lyric = await createLyric({
      ...baseArgs,
      resourceID: specialResourceID,
    });

    expect(lyric.resourceID).toBe(specialResourceID);
  });
});
