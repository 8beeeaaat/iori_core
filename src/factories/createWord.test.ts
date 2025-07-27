import { describe, expect, test, vi } from "vitest";
import type { WordTimeline } from "../Constants";
import { type CreateWordArgs, createWord } from "./createWord";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-123"),
});

describe("createWord", () => {
  const baseTimeline: WordTimeline = {
    wordID: "existing-word-id",
    text: "hello",
    begin: 0,
    end: 2,
    hasWhitespace: true,
    hasNewLine: false,
  };

  const baseArgs: CreateWordArgs = {
    lineID: "line-1",
    position: 1,
    timeline: baseTimeline,
  };

  test("should create a word with existing wordID", () => {
    const word = createWord(baseArgs);

    expect(word.id).toBe("existing-word-id");
    expect(word.lineID).toBe("line-1");
    expect(word.position).toBe(1);
    expect(word.timeline.wordID).toBe("existing-word-id");
    expect(word.timeline.text).toBe("hello");
    expect(word.timeline.begin).toBe(0);
    expect(word.timeline.end).toBe(2);
    expect(word.timeline.hasWhitespace).toBe(true);
    expect(word.timeline.hasNewLine).toBe(false);
  });

  test("should generate wordID when not provided", () => {
    const timelineWithoutID: Omit<WordTimeline, "wordID"> = {
      text: "hello",
      begin: 0,
      end: 2,
    };

    const word = createWord({
      ...baseArgs,
      timeline: timelineWithoutID,
    });

    expect(word.id).toBe("word-test-uuid-123");
    expect(word.timeline.wordID).toBe("word-test-uuid-123");
  });

  test("should be frozen (immutable)", () => {
    const word = createWord(baseArgs);
    expect(Object.isFrozen(word)).toBe(true);
    // Arrays and nested objects may not be automatically frozen
    expect(Array.isArray(word.chars)).toBe(true);
  });

  test("should set default values for optional timeline properties", () => {
    const minimalTimeline: Omit<WordTimeline, "wordID"> = {
      text: "test",
      begin: 0,
      end: 1,
    };

    const word = createWord({
      ...baseArgs,
      timeline: minimalTimeline,
    });

    expect(word.timeline.hasWhitespace).toBe(false);
    expect(word.timeline.hasNewLine).toBe(false);
  });

  describe("character creation", () => {
    test("should create characters for each letter", () => {
      const word = createWord(baseArgs);

      expect(word.chars).toHaveLength(5); // "hello" has 5 characters
      expect(word.chars[0].text).toBe("h");
      expect(word.chars[1].text).toBe("e");
      expect(word.chars[2].text).toBe("l");
      expect(word.chars[3].text).toBe("l");
      expect(word.chars[4].text).toBe("o");
    });

    test("should set correct positions for characters", () => {
      const word = createWord(baseArgs);

      expect(word.chars[0].position).toBe(1);
      expect(word.chars[1].position).toBe(2);
      expect(word.chars[2].position).toBe(3);
      expect(word.chars[3].position).toBe(4);
      expect(word.chars[4].position).toBe(5);
    });

    test("should calculate timing correctly for characters", () => {
      // Word duration: 2 seconds, 5 characters = 0.4 seconds per character
      const word = createWord(baseArgs);

      expect(word.chars[0].begin).toBe(0);
      expect(word.chars[0].end).toBeCloseTo(0.4, 1);
      expect(word.chars[1].begin).toBeCloseTo(0.4, 1);
      expect(word.chars[1].end).toBeCloseTo(0.8, 1);
      expect(word.chars[2].begin).toBeCloseTo(0.8, 1);
      expect(word.chars[2].end).toBeCloseTo(1.2, 1);
      expect(word.chars[3].begin).toBeCloseTo(1.2, 1);
      expect(word.chars[3].end).toBeCloseTo(1.6, 1);
      expect(word.chars[4].begin).toBeCloseTo(1.6, 1);
      expect(word.chars[4].end).toBe(2);
    });

    test("should handle single character words", () => {
      const singleCharTimeline: WordTimeline = {
        wordID: "single-char",
        text: "a",
        begin: 1,
        end: 2,
      };

      const word = createWord({
        ...baseArgs,
        timeline: singleCharTimeline,
      });

      expect(word.chars).toHaveLength(1);
      expect(word.chars[0].text).toBe("a");
      expect(word.chars[0].begin).toBe(1);
      expect(word.chars[0].end).toBe(2);
      expect(word.chars[0].position).toBe(1);
    });

    test("should handle empty text", () => {
      const emptyTimeline: WordTimeline = {
        wordID: "empty",
        text: "",
        begin: 0,
        end: 1,
      };

      const word = createWord({
        ...baseArgs,
        timeline: emptyTimeline,
      });

      expect(word.chars).toHaveLength(0);
    });

    test("should assign correct wordID to all characters", () => {
      const word = createWord(baseArgs);

      word.chars.forEach((char) => {
        expect(char.wordID).toBe("existing-word-id");
      });
    });
  });

  test("should handle different line IDs and positions", () => {
    const word1 = createWord({
      ...baseArgs,
      lineID: "line-1",
      position: 1,
    });

    const word2 = createWord({
      ...baseArgs,
      lineID: "line-2",
      position: 5,
    });

    expect(word1.lineID).toBe("line-1");
    expect(word1.position).toBe(1);
    expect(word2.lineID).toBe("line-2");
    expect(word2.position).toBe(5);
  });

  test("should preserve original timeline properties", () => {
    const customTimeline: WordTimeline = {
      wordID: "custom-id",
      text: "world",
      begin: 5.5,
      end: 7.8,
      hasWhitespace: false,
      hasNewLine: true,
    };

    const word = createWord({
      ...baseArgs,
      timeline: customTimeline,
    });

    expect(word.timeline.wordID).toBe("custom-id");
    expect(word.timeline.text).toBe("world");
    expect(word.timeline.begin).toBe(5.5);
    expect(word.timeline.end).toBe(7.8);
    expect(word.timeline.hasWhitespace).toBe(false);
    expect(word.timeline.hasNewLine).toBe(true);
  });

  test("should handle complex text with various characters", () => {
    const complexTimeline: WordTimeline = {
      wordID: "complex",
      text: "Hello123!",
      begin: 0,
      end: 9,
    };

    const word = createWord({
      ...baseArgs,
      timeline: complexTimeline,
    });

    expect(word.chars).toHaveLength(9);
    expect(word.chars[0].text).toBe("H");
    expect(word.chars[4].text).toBe("o");
    expect(word.chars[5].text).toBe("1");
    expect(word.chars[7].text).toBe("3");
    expect(word.chars[8].text).toBe("!");
  });
});
