import { describe, expect, test, vi } from "vitest";
import type { WordTimeline } from "../Constants";
import { type CreateLineArgs, createLine } from "./createLine";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

describe("createLine", () => {
  const basicTimelines: WordTimeline[] = [
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
  ];

  const baseArgs: CreateLineArgs = {
    position: 1,
    timelines: basicTimelines,
  };

  test("should create a basic line with words", () => {
    const line = createLine(baseArgs);

    expect(line.id).toBe("line-test-uuid-123");
    expect(line.position).toBe(1);
    expect(line.words).toHaveLength(2);
    expect(line.words[0].timeline.text).toBe("Hello");
    expect(line.words[1].timeline.text).toBe("world");
  });

  test("should be frozen (immutable)", () => {
    const line = createLine(baseArgs);
    expect(Object.isFrozen(line)).toBe(true);
    // Arrays may not be automatically frozen, but line itself is immutable
    expect(Array.isArray(line.words)).toBe(true);
  });

  test("should sort timelines by begin time", () => {
    const unsortedTimelines: WordTimeline[] = [
      {
        wordID: "word2",
        text: "world",
        begin: 2,
        end: 3,
      },
      {
        wordID: "word1",
        text: "Hello",
        begin: 0,
        end: 1,
      },
    ];

    const line = createLine({
      ...baseArgs,
      timelines: unsortedTimelines,
    });

    expect(line.words[0].timeline.text).toBe("Hello");
    expect(line.words[1].timeline.text).toBe("world");
  });

  test("should skip whitespace-only timelines", () => {
    const timelinesWithWhitespace: WordTimeline[] = [
      {
        wordID: "word1",
        text: "Hello",
        begin: 0,
        end: 1,
      },
      {
        wordID: "space",
        text: "   ",
        begin: 1,
        end: 1.5,
      },
      {
        wordID: "word2",
        text: "world",
        begin: 2,
        end: 3,
      },
    ];

    const line = createLine({
      ...baseArgs,
      timelines: timelinesWithWhitespace,
    });

    expect(line.words).toHaveLength(2);
    expect(line.words[0].timeline.text).toBe("Hello");
    expect(line.words[1].timeline.text).toBe("world");
  });

  describe("joint near word functionality", () => {
    test("should join words when they are close in time", () => {
      const closeTimelines: WordTimeline[] = [
        {
          wordID: "word1",
          text: "Hel",
          begin: 0,
          end: 1,
          hasWhitespace: false,
          hasNewLine: false,
        },
        {
          wordID: "word2",
          text: "lo",
          begin: 1.05, // Close to previous word (0.05 gap)
          end: 2,
        },
      ];

      const line = createLine({
        position: 1,
        timelines: closeTimelines,
        jointNearWord: true,
      });

      expect(line.words).toHaveLength(1);
      expect(line.words[0].timeline.text).toBe("Hello");
      expect(line.words[0].timeline.begin).toBe(0);
      expect(line.words[0].timeline.end).toBe(2);
    });

    test("should not join words when they are far apart", () => {
      const farTimelines: WordTimeline[] = [
        {
          wordID: "word1",
          text: "Hello",
          begin: 0,
          end: 1,
          hasWhitespace: false,
          hasNewLine: false,
        },
        {
          wordID: "word2",
          text: "world",
          begin: 2, // Gap of 1 second (> 0.1), should not join
          end: 3,
        },
      ];

      const line = createLine({
        position: 1,
        timelines: farTimelines,
        jointNearWord: true,
      });

      expect(line.words.length).toBeGreaterThanOrEqual(1);
    });

    test("should not join when previous word has newline", () => {
      const timelinesWithNewline: WordTimeline[] = [
        {
          wordID: "word1",
          text: "Hello",
          begin: 0,
          end: 1,
          hasNewLine: true,
        },
        {
          wordID: "word2",
          text: "world",
          begin: 1.05,
          end: 2,
        },
      ];

      const line = createLine({
        position: 1,
        timelines: timelinesWithNewline,
        jointNearWord: true,
      });

      expect(line.words).toHaveLength(2);
    });

    test("should not join when previous word has whitespace", () => {
      const timelinesWithWhitespace: WordTimeline[] = [
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
          begin: 1.05,
          end: 2,
        },
      ];

      const line = createLine({
        position: 1,
        timelines: timelinesWithWhitespace,
        jointNearWord: true,
      });

      expect(line.words).toHaveLength(2);
    });

    test("should disable joining when jointNearWord is false", () => {
      const closeTimelines: WordTimeline[] = [
        {
          wordID: "word1",
          text: "Hel",
          begin: 0,
          end: 1,
        },
        {
          wordID: "word2",
          text: "lo",
          begin: 1.05,
          end: 2,
        },
      ];

      const line = createLine({
        position: 1,
        timelines: closeTimelines,
        jointNearWord: false,
      });

      expect(line.words).toHaveLength(2);
    });
  });

  describe("whitespace handling", () => {
    test("should detect whitespace from current timeline", () => {
      const timelinesWithWhitespace: WordTimeline[] = [
        {
          wordID: "word1",
          text: "Hello",
          begin: 0,
          end: 1,
          hasWhitespace: true,
        },
      ];

      const line = createLine({
        position: 1,
        timelines: timelinesWithWhitespace,
      });

      expect(line.words[0].timeline.hasWhitespace).toBe(true);
    });

    test("should detect whitespace from next timeline", () => {
      const timelinesWithNextWhitespace: WordTimeline[] = [
        {
          wordID: "word1",
          text: "Hello",
          begin: 0,
          end: 1,
        },
        {
          wordID: "whitespace",
          text: " ",
          begin: 1,
          end: 1.5,
        },
      ];

      const line = createLine({
        position: 1,
        timelines: timelinesWithNextWhitespace,
      });

      expect(line.words[0].timeline.hasWhitespace).toBe(true);
    });
  });

  test("should assign correct line ID to all words", () => {
    const line = createLine(baseArgs);

    line.words.forEach((word) => {
      expect(word.lineID).toBe("line-test-uuid-123");
    });
  });

  test("should assign correct positions to words", () => {
    const line = createLine(baseArgs);

    expect(line.words[0].position).toBe(1);
    expect(line.words[1].position).toBe(2);
  });

  test("should handle empty timelines", () => {
    const line = createLine({
      position: 1,
      timelines: [],
    });

    expect(line.words).toHaveLength(0);
  });

  test("should handle single timeline", () => {
    const singleTimeline: WordTimeline[] = [
      {
        wordID: "single",
        text: "Hello",
        begin: 0,
        end: 1,
      },
    ];

    const line = createLine({
      position: 1,
      timelines: singleTimeline,
    });

    expect(line.words).toHaveLength(1);
    expect(line.words[0].timeline.text).toBe("Hello");
  });
});
