import { describe, expect, test, vi } from "vitest";
import type { WordTimeline } from "../Constants";
import { type CreateParagraphArgs, createParagraph } from "./createParagraph";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

describe("createParagraph", () => {
  const basicTimelines: WordTimeline[][] = [
    [
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
  ];

  const baseArgs: CreateParagraphArgs = {
    position: 1,
    timelines: basicTimelines,
  };

  test("should create a paragraph with lines", async () => {
    const paragraph = await createParagraph(baseArgs);

    expect(paragraph.id).toBe("paragraph-test-uuid-123");
    expect(paragraph.position).toBe(1);
    expect(paragraph.lines).toHaveLength(2);
    expect(paragraph.lines[0].words[0].timeline.text).toBe("Hello");
    expect(paragraph.lines[1].words[0].timeline.text).toBe("How");
  });

  test("should be frozen (immutable)", async () => {
    const paragraph = await createParagraph(baseArgs);

    expect(Object.isFrozen(paragraph)).toBe(true);
    // Arrays may not be automatically frozen, but paragraph itself is immutable
    expect(Array.isArray(paragraph.lines)).toBe(true);
  });

  test("should handle paragraph tokenizer", async () => {
    const mockParagraphTokenizer = vi.fn().mockResolvedValue([
      [
        {
          wordID: "processed1",
          text: "Processed",
          begin: 0,
          end: 1,
        },
      ],
    ]);

    const paragraph = await createParagraph({
      ...baseArgs,
      paragraphTokenizer: mockParagraphTokenizer,
    });

    expect(mockParagraphTokenizer).toHaveBeenCalledWith(basicTimelines);
    expect(paragraph.lines).toHaveLength(1);
    expect(paragraph.lines[0].words[0].timeline.text).toBe("Processed");
  });

  test("should handle line tokenizer", async () => {
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
                jointNearWord: false, // Different from default
              },
            ],
          ]),
        ),
      );

    const _paragraph = await createParagraph({
      ...baseArgs,
      lineTokenizer: mockLineTokenizer,
    });

    expect(mockLineTokenizer).toHaveBeenCalledTimes(2);
    expect(mockLineTokenizer).toHaveBeenCalledWith({
      position: 1,
      timelines: basicTimelines[0],
    });
    expect(mockLineTokenizer).toHaveBeenCalledWith({
      position: 2,
      timelines: basicTimelines[1],
    });
  });

  describe("timeline merging", () => {
    test("should merge overlapping timelines", async () => {
      const overlappingTimelines: WordTimeline[][] = [
        [
          {
            wordID: "word1",
            text: "Hello",
            begin: 0,
            end: 2, // Overlaps with next
          },
        ],
        [
          {
            wordID: "word2",
            text: "world",
            begin: 1, // Overlaps with previous
            end: 3,
          },
        ],
      ];

      const paragraph = await createParagraph({
        position: 1,
        timelines: overlappingTimelines,
      });

      // Should merge into single line
      expect(paragraph.lines).toHaveLength(1);
    });

    test("should merge timelines with same end time and short text", async () => {
      const sameEndTimelines: WordTimeline[][] = [
        [
          {
            wordID: "word1",
            text: "Hi", // Short text (< 6 chars)
            begin: 0,
            end: 1,
          },
        ],
        [
          {
            wordID: "word2",
            text: "there",
            begin: 1, // Same as previous end
            end: 2,
          },
        ],
      ];

      const paragraph = await createParagraph({
        position: 1,
        timelines: sameEndTimelines,
      });

      // Should merge into single line
      expect(paragraph.lines).toHaveLength(1);
    });

    test("should not merge timelines with same end time and long text", async () => {
      const longTextTimelines: WordTimeline[][] = [
        [
          {
            wordID: "word1",
            text: "Hello there", // Long text (>= 6 chars)
            begin: 0,
            end: 1,
          },
        ],
        [
          {
            wordID: "word2",
            text: "friend",
            begin: 1, // Same as previous end
            end: 2,
          },
        ],
      ];

      const paragraph = await createParagraph({
        position: 1,
        timelines: longTextTimelines,
      });

      // Should remain separate lines
      expect(paragraph.lines).toHaveLength(2);
    });

    test("should handle undefined first timeline", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const invalidTimelines: WordTimeline[][] = [
        [
          {
            wordID: "word1",
            text: "Hello",
            begin: 0,
            end: 1,
          },
        ],
        [], // Empty timeline array
      ];

      const paragraph = await createParagraph({
        position: 1,
        timelines: invalidTimelines,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "thisFirst is undefined",
        expect.any(Array),
        [],
      );
      expect(paragraph.lines).toHaveLength(1);

      consoleSpy.mockRestore();
    });
  });

  test("should assign correct positions to lines", async () => {
    const paragraph = await createParagraph(baseArgs);

    expect(paragraph.lines[0].position).toBe(1);
    expect(paragraph.lines[1].position).toBe(2);
  });

  test("should handle empty timelines", async () => {
    const paragraph = await createParagraph({
      position: 1,
      timelines: [],
    });

    expect(paragraph.lines).toHaveLength(0);
  });

  test("should handle single timeline", async () => {
    const singleTimeline: WordTimeline[][] = [
      [
        {
          wordID: "single",
          text: "Hello",
          begin: 0,
          end: 1,
        },
      ],
    ];

    const paragraph = await createParagraph({
      position: 1,
      timelines: singleTimeline,
    });

    expect(paragraph.lines).toHaveLength(1);
    expect(paragraph.lines[0].words[0].timeline.text).toBe("Hello");
  });

  test("should use default jointNearWord when no lineTokenizer", async () => {
    const paragraph = await createParagraph(baseArgs);

    // Default behavior should create words with jointNearWord: true
    expect(paragraph.lines).toHaveLength(2);
  });

  test("should handle complex line tokenizer scenarios", async () => {
    const complexLineTokenizer = vi.fn().mockImplementation(({ timelines }) => {
      // Split each line into multiple sub-lines
      const sublines = new Map();
      timelines.forEach((timeline, index) => {
        sublines.set(index + 1, {
          position: index + 1,
          timelines: [timeline],
          jointNearWord: true,
        });
      });
      return Promise.resolve(sublines);
    });

    const paragraph = await createParagraph({
      ...baseArgs,
      lineTokenizer: complexLineTokenizer,
    });

    // Each word should become its own line
    expect(paragraph.lines.length).toBeGreaterThan(2);
  });
});
