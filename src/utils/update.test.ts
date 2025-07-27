import { describe, expect, test, vi } from "vitest";
import type { WordTimeline } from "../Constants";
import { createLyric } from "../factories/createLyric";
import type { Lyric, LyricUpdateArgs } from "../types";
import { getTimelines, getTimelinesByLine, updateLyric } from "./update";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

describe("update", () => {
  const originalTimelines: WordTimeline[][][] = [
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

  let originalLyric: Lyric;

  beforeEach(async () => {
    originalLyric = await createLyric({
      resourceID: "test-resource",
      duration: 15,
      timelines: originalTimelines,
      offsetSec: 1,
      initID: true,
    });
  });

  describe("updateLyric", () => {
    test("should update resourceID only", async () => {
      const updateArgs: LyricUpdateArgs = {
        resourceID: "new-resource",
      };

      const updatedLyric = await updateLyric(originalLyric, updateArgs);

      expect(updatedLyric.resourceID).toBe("new-resource");
      expect(updatedLyric.duration).toBe(originalLyric.duration);
      expect(updatedLyric.offsetSec).toBe(originalLyric.offsetSec);
      expect(updatedLyric.paragraphs).toBe(originalLyric.paragraphs); // Same reference
    });

    test("should update duration only", async () => {
      const updateArgs: LyricUpdateArgs = {
        duration: 20.123456,
      };

      const updatedLyric = await updateLyric(originalLyric, updateArgs);

      expect(updatedLyric.resourceID).toBe(originalLyric.resourceID);
      expect(updatedLyric.duration).toBe(20.12); // Rounded to 2 decimal places
      expect(updatedLyric.offsetSec).toBe(originalLyric.offsetSec);
      expect(updatedLyric.paragraphs).toBe(originalLyric.paragraphs); // Same reference
    });

    test("should update offsetSec only", async () => {
      const updateArgs: LyricUpdateArgs = {
        offsetSec: 2.5,
      };

      const updatedLyric = await updateLyric(originalLyric, updateArgs);

      expect(updatedLyric.resourceID).toBe(originalLyric.resourceID);
      expect(updatedLyric.duration).toBe(originalLyric.duration);
      expect(updatedLyric.offsetSec).toBe(2.5);
      expect(updatedLyric.paragraphs).toBe(originalLyric.paragraphs); // Same reference
    });

    test("should handle offsetSec = 0", async () => {
      const updateArgs: LyricUpdateArgs = {
        offsetSec: 0,
      };

      const updatedLyric = await updateLyric(originalLyric, updateArgs);

      expect(updatedLyric.offsetSec).toBe(0);
    });

    test("should update multiple properties without timelines", async () => {
      const updateArgs: LyricUpdateArgs = {
        resourceID: "multi-update",
        duration: 25.5,
        offsetSec: -1,
      };

      const updatedLyric = await updateLyric(originalLyric, updateArgs);

      expect(updatedLyric.resourceID).toBe("multi-update");
      expect(updatedLyric.duration).toBe(25.5);
      expect(updatedLyric.offsetSec).toBe(-1);
      expect(updatedLyric.paragraphs).toBe(originalLyric.paragraphs); // Same reference
    });

    test("should recreate lyric when timelines are provided", async () => {
      const newTimelines: WordTimeline[][][] = [
        [
          [
            {
              wordID: "new-word",
              text: "Updated",
              begin: 0,
              end: 2,
            },
          ],
        ],
      ];

      const updateArgs: LyricUpdateArgs = {
        timelines: newTimelines,
      };

      const updatedLyric = await updateLyric(originalLyric, updateArgs);

      expect(updatedLyric.id).toBe(originalLyric.id); // Preserves original ID
      expect(updatedLyric.resourceID).toBe(originalLyric.resourceID);
      expect(updatedLyric.duration).toBe(originalLyric.duration);
      expect(updatedLyric.offsetSec).toBe(originalLyric.offsetSec);
      expect(updatedLyric.paragraphs).not.toBe(originalLyric.paragraphs); // New reference
      expect(updatedLyric.paragraphs[0].lines[0].words[0].timeline.text).toBe(
        "Updated",
      );
    });

    test("should update all properties with new timelines", async () => {
      const newTimelines: WordTimeline[][][] = [
        [
          [
            {
              wordID: "complete-update",
              text: "Complete",
              begin: 0,
              end: 3,
            },
          ],
        ],
      ];

      const updateArgs: LyricUpdateArgs = {
        resourceID: "complete-resource",
        duration: 30,
        offsetSec: 5,
        timelines: newTimelines,
      };

      const updatedLyric = await updateLyric(originalLyric, updateArgs);

      expect(updatedLyric.id).toBe(originalLyric.id);
      expect(updatedLyric.resourceID).toBe("complete-resource");
      expect(updatedLyric.duration).toBe(30);
      expect(updatedLyric.offsetSec).toBe(5);
      expect(updatedLyric.paragraphs[0].lines[0].words[0].timeline.text).toBe(
        "Complete",
      );
    });

    test("should preserve immutability", async () => {
      const updateArgs: LyricUpdateArgs = {
        resourceID: "immutable-test",
        timelines: [],
      };

      const updatedLyric = await updateLyric(originalLyric, updateArgs);

      expect(Object.isFrozen(updatedLyric)).toBe(true);
      expect(originalLyric.resourceID).toBe("test-resource"); // Original unchanged
    });
  });

  describe("getTimelines", () => {
    test("should extract timelines from lyric", () => {
      const timelines = getTimelines(originalLyric);

      expect(Array.isArray(timelines)).toBe(true);
      expect(timelines).toHaveLength(2); // 2 paragraphs
      expect(timelines[0]).toHaveLength(2); // 2 lines in first paragraph
      expect(timelines[1]).toHaveLength(1); // 1 line in second paragraph

      expect(timelines[0][0]).toHaveLength(2); // 2 words in first line
      expect(timelines[0][1]).toHaveLength(3); // 3 words in second line
      expect(timelines[1][0]).toHaveLength(2); // 2 words in third line
    });

    test("should return exact timeline objects", () => {
      const timelines = getTimelines(originalLyric);
      const firstWordTimeline = timelines[0][0][0];

      expect(firstWordTimeline.wordID).toBe("word1");
      expect(firstWordTimeline.text).toBe("Hello");
      expect(firstWordTimeline.begin).toBe(0);
      expect(firstWordTimeline.end).toBe(1);
      expect(firstWordTimeline.hasWhitespace).toBe(true);
    });

    test("should maintain structure consistency", () => {
      const timelines = getTimelines(originalLyric);

      // Check that structure matches original
      expect(timelines[0][1][2].text).toBe("you"); // Third word of second line
      expect(timelines[1][0][1].text).toBe("thanks"); // Second word of first line in second paragraph
    });

    test("should handle empty lyric", async () => {
      const emptyLyric = await createLyric({
        resourceID: "empty",
        duration: 10,
        timelines: [],
        initID: true,
      });

      const timelines = getTimelines(emptyLyric);
      expect(timelines).toEqual([]);
    });
  });

  describe("getTimelinesByLine", () => {
    test("should create line-based timelines", () => {
      const lineTimelines = getTimelinesByLine(originalLyric);

      expect(Array.isArray(lineTimelines)).toBe(true);
      expect(lineTimelines).toHaveLength(3); // 3 lines total
    });

    test("should merge words within each line", () => {
      const lineTimelines = getTimelinesByLine(originalLyric);

      // First line: "Hello world"
      const firstLineTimeline = lineTimelines[0];
      expect(firstLineTimeline.wordID).toBe("word1"); // Uses first word's ID
      expect(firstLineTimeline.begin).toBe(0); // First word's begin
      expect(firstLineTimeline.end).toBe(2.5); // Last word's end
      expect(firstLineTimeline.text).toBe("Helloworld"); // Concatenated text
      expect(firstLineTimeline.hasNewLine).toBe(false); // Last word's hasNewLine
      expect(firstLineTimeline.hasWhitespace).toBe(false); // Last word's hasWhitespace
    });

    test("should handle single word lines", () => {
      const singleWordTimelines: WordTimeline[][][] = [
        [
          [
            {
              wordID: "single",
              text: "Single",
              begin: 0,
              end: 1,
              hasNewLine: true,
              hasWhitespace: false,
            },
          ],
        ],
      ];

      const _singleWordLyric = createLyric({
        resourceID: "single",
        duration: 5,
        timelines: singleWordTimelines,
        initID: true,
      }).then(async (lyric) => {
        const lineTimelines = getTimelinesByLine(lyric);

        expect(lineTimelines).toHaveLength(1);
        expect(lineTimelines[0].wordID).toBe("single");
        expect(lineTimelines[0].text).toBe("Single");
        expect(lineTimelines[0].hasNewLine).toBe(true);
        expect(lineTimelines[0].hasWhitespace).toBe(false);
      });
    });

    test("should preserve timing information", () => {
      const lineTimelines = getTimelinesByLine(originalLyric);

      // Second line: "How are you"
      const secondLineTimeline = lineTimelines[1];
      expect(secondLineTimeline.begin).toBe(3); // First word "How" begins at 3
      expect(secondLineTimeline.end).toBe(7); // Last word "you" ends at 7
    });

    test("should preserve last word properties", () => {
      const lineTimelines = getTimelinesByLine(originalLyric);

      // Check that the last word's properties are preserved
      lineTimelines.forEach((timeline, index) => {
        const originalLine =
          index === 0
            ? originalLyric.paragraphs[0].lines[0]
            : index === 1
              ? originalLyric.paragraphs[0].lines[1]
              : originalLyric.paragraphs[1].lines[0];

        const lastWord = originalLine.words[originalLine.words.length - 1];

        expect(timeline.hasNewLine).toBe(lastWord.timeline.hasNewLine ?? false);
        expect(timeline.hasWhitespace).toBe(
          lastWord.timeline.hasWhitespace ?? false,
        );
      });
    });

    test("should throw error for empty line", async () => {
      // Create a mock lyric with empty line
      const mockLyricWithEmptyLine = {
        ...originalLyric,
        paragraphs: [
          {
            ...originalLyric.paragraphs[0],
            lines: [
              {
                id: "empty-line",
                position: 1,
                words: [],
              },
            ],
          },
        ],
      };

      expect(() => getTimelinesByLine(mockLyricWithEmptyLine)).toThrow(
        "firstWord is undefined",
      );
    });

    test("should concatenate text correctly", () => {
      const lineTimelines = getTimelinesByLine(originalLyric);

      // Verify text concatenation for each line
      expect(lineTimelines[0].text).toBe("Helloworld"); // First line
      expect(lineTimelines[1].text).toBe("Howareyou"); // Second line
      expect(lineTimelines[2].text).toBe("Finethanks"); // Third line
    });
  });

  describe("edge cases", () => {
    test("should handle lyric with no changes", async () => {
      const updateArgs: LyricUpdateArgs = {};

      const updatedLyric = await updateLyric(originalLyric, updateArgs);

      expect(updatedLyric.resourceID).toBe(originalLyric.resourceID);
      expect(updatedLyric.duration).toBe(originalLyric.duration);
      expect(updatedLyric.offsetSec).toBe(originalLyric.offsetSec);
      expect(updatedLyric.paragraphs).toBe(originalLyric.paragraphs);
    });

    test("should handle extreme duration values", async () => {
      const updateArgs: LyricUpdateArgs = {
        duration: 999.999999,
      };

      const updatedLyric = await updateLyric(originalLyric, updateArgs);
      expect(updatedLyric.duration).toBe(1000); // Rounded to 2 decimal places
    });

    test("should handle negative offsetSec", async () => {
      const updateArgs: LyricUpdateArgs = {
        offsetSec: -5.5,
      };

      const updatedLyric = await updateLyric(originalLyric, updateArgs);
      expect(updatedLyric.offsetSec).toBe(-5.5);
    });

    test("should handle empty timelines array", async () => {
      const updateArgs: LyricUpdateArgs = {
        timelines: [],
      };

      const updatedLyric = await updateLyric(originalLyric, updateArgs);

      expect(updatedLyric.paragraphs).toHaveLength(0);
    });

    test("should preserve original ID through updates", async () => {
      const originalId = originalLyric.id;

      const updatedLyric = await updateLyric(originalLyric, {
        timelines: [[[{ wordID: "new", text: "New", begin: 0, end: 1 }]]],
      });

      expect(updatedLyric.id).toBe(originalId);
    });
  });
});
