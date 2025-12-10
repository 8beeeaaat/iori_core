import { describe, expect, test } from "vitest";
import {
  type ValidationResult,
  failure,
  isFailure,
  isSuccess,
  success,
} from "./result";

describe("ValidationResult", () => {
  describe("success", () => {
    test("should create a success result with data", () => {
      const result = success({ name: "test" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: "test" });
    });

    test("should create a success result with primitive value", () => {
      const result = success(42);

      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
    });
  });

  describe("failure", () => {
    test("should create a failure result with error code and message", () => {
      const result = failure("VALIDATION_ERROR", "Invalid input");

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toBe("Invalid input");
    });

    test("should create a failure result with optional details", () => {
      const result = failure("OVERLAP_DETECTED", "Timeline overlap", {
        wordId: "word-1",
        conflictWith: "word-2",
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("OVERLAP_DETECTED");
      expect(result.error.message).toBe("Timeline overlap");
      expect(result.error.details).toEqual({
        wordId: "word-1",
        conflictWith: "word-2",
      });
    });
  });

  describe("isSuccess", () => {
    test("should return true for success result", () => {
      const result = success("data");
      expect(isSuccess(result)).toBe(true);
    });

    test("should return false for failure result", () => {
      const result = failure("ERROR", "message");
      expect(isSuccess(result)).toBe(false);
    });

    test("should narrow type correctly", () => {
      const result: ValidationResult<string> = success("data");

      if (isSuccess(result)) {
        // TypeScript should know result.data exists here
        expect(result.data).toBe("data");
      }
    });
  });

  describe("isFailure", () => {
    test("should return true for failure result", () => {
      const result = failure("ERROR", "message");
      expect(isFailure(result)).toBe(true);
    });

    test("should return false for success result", () => {
      const result = success("data");
      expect(isFailure(result)).toBe(false);
    });

    test("should narrow type correctly", () => {
      const result: ValidationResult<string> = failure("ERROR", "message");

      if (isFailure(result)) {
        // TypeScript should know result.error exists here
        expect(result.error.code).toBe("ERROR");
      }
    });
  });
});
