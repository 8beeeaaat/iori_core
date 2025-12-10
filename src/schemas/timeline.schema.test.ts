import { describe, expect, test } from "vitest";
import {
  parseWordTimeline,
  parseWordTimelines,
  wordTimelineSchema,
  wordTimelinesSchema,
} from "./timeline.schema";
import { isFailure, isSuccess } from "./result";

describe("wordTimelineSchema", () => {
  describe("valid input", () => {
    test("should accept valid WordTimeline", () => {
      const input = {
        text: "hello",
        begin: 0,
        end: 1,
      };

      const result = wordTimelineSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe("hello");
        expect(result.data.begin).toBe(0);
        expect(result.data.end).toBe(1);
      }
    });

    test("should accept WordTimeline with optional fields", () => {
      const input = {
        wordID: "word-123",
        text: "hello",
        begin: 0,
        end: 1,
        hasWhitespace: true,
        hasNewLine: false,
      };

      const result = wordTimelineSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.wordID).toBe("word-123");
        expect(result.data.hasWhitespace).toBe(true);
        expect(result.data.hasNewLine).toBe(false);
      }
    });

    test("should default hasWhitespace and hasNewLine to false", () => {
      const input = {
        text: "hello",
        begin: 0,
        end: 1,
      };

      const result = wordTimelineSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasWhitespace).toBe(false);
        expect(result.data.hasNewLine).toBe(false);
      }
    });
  });

  describe("invalid input", () => {
    test("should reject when begin >= end", () => {
      const input = {
        text: "hello",
        begin: 1,
        end: 1,
      };

      const result = wordTimelineSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    test("should reject when begin > end", () => {
      const input = {
        text: "hello",
        begin: 2,
        end: 1,
      };

      const result = wordTimelineSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    test("should reject empty text", () => {
      const input = {
        text: "",
        begin: 0,
        end: 1,
      };

      const result = wordTimelineSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    test("should reject negative begin", () => {
      const input = {
        text: "hello",
        begin: -1,
        end: 1,
      };

      const result = wordTimelineSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    test("should reject non-finite numbers", () => {
      const input = {
        text: "hello",
        begin: 0,
        end: Number.POSITIVE_INFINITY,
      };

      const result = wordTimelineSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});

describe("wordTimelinesSchema", () => {
  describe("valid input", () => {
    test("should accept valid array of WordTimelines", () => {
      const input = [
        { text: "hello", begin: 0, end: 1 },
        { text: "world", begin: 1, end: 2 },
      ];

      const result = wordTimelinesSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    test("should accept single WordTimeline", () => {
      const input = [{ text: "hello", begin: 0, end: 1 }];

      const result = wordTimelinesSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    test("should accept empty array", () => {
      const input: unknown[] = [];

      const result = wordTimelinesSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    test("should accept adjacent timelines (no gap)", () => {
      const input = [
        { text: "hello", begin: 0, end: 1 },
        { text: "world", begin: 1, end: 2 },
      ];

      const result = wordTimelinesSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    test("should accept timelines with gap", () => {
      const input = [
        { text: "hello", begin: 0, end: 1 },
        { text: "world", begin: 2, end: 3 },
      ];

      const result = wordTimelinesSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe("overlap detection", () => {
    test("should reject overlapping timelines", () => {
      const input = [
        { text: "hello", begin: 0, end: 2 },
        { text: "world", begin: 1, end: 3 },
      ];

      const result = wordTimelinesSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    test("should reject completely overlapping timelines", () => {
      const input = [
        { text: "hello", begin: 0, end: 5 },
        { text: "world", begin: 1, end: 2 },
      ];

      const result = wordTimelinesSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    test("should reject out-of-order overlapping timelines", () => {
      const input = [
        { text: "world", begin: 1, end: 3 },
        { text: "hello", begin: 0, end: 2 },
      ];

      const result = wordTimelinesSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});

describe("parseWordTimeline", () => {
  test("should return success result for valid input", () => {
    const input = {
      text: "hello",
      begin: 0,
      end: 1,
    };

    const result = parseWordTimeline(input);

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.text).toBe("hello");
    }
  });

  test("should return failure result for invalid input", () => {
    const input = {
      text: "hello",
      begin: 2,
      end: 1,
    };

    const result = parseWordTimeline(input);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});

describe("parseWordTimelines", () => {
  test("should return success result for valid input", () => {
    const input = [
      { text: "hello", begin: 0, end: 1 },
      { text: "world", begin: 1, end: 2 },
    ];

    const result = parseWordTimelines(input);

    expect(isSuccess(result)).toBe(true);
  });

  test("should return failure result for overlapping timelines", () => {
    const input = [
      { text: "hello", begin: 0, end: 2 },
      { text: "world", begin: 1, end: 3 },
    ];

    const result = parseWordTimelines(input);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.code).toBe("OVERLAP_DETECTED");
    }
  });
});
