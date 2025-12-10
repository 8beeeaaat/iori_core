/**
 * WordTimeline Zod Schema
 * Timeline validation and overlap detection
 */

import { z } from "zod";
import { failure, success, type ValidationResult } from "./result";

/**
 * Single WordTimeline schema
 */
export const wordTimelineSchema = z
  .object({
    wordID: z.string().optional(),
    text: z.string().min(1, "text must not be empty"),
    begin: z
      .number()
      .finite("begin must be finite")
      .nonnegative("begin must be non-negative"),
    end: z.number().finite("end must be finite"),
    hasWhitespace: z.boolean().default(false),
    hasNewLine: z.boolean().default(false),
  })
  .refine((data) => data.begin < data.end, {
    message: "begin must be less than end",
    path: ["begin"],
  });

export type WordTimelineInput = z.input<typeof wordTimelineSchema>;
export type WordTimelineOutput = z.output<typeof wordTimelineSchema>;

/**
 * WordTimeline array schema (with overlap detection)
 */
export const wordTimelinesSchema = z
  .array(wordTimelineSchema)
  .superRefine((timelines, ctx) => {
    if (timelines.length < 2) return;

    // Sort and detect overlap in O(n log n)
    const sorted = [...timelines].sort((a, b) => a.begin - b.begin);

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      if (current.end > next.begin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Timeline overlap: word ending at ${current.end} overlaps with word starting at ${next.begin}`,
          path: [i],
        });
      }
    }
  });

export type WordTimelinesInput = z.input<typeof wordTimelinesSchema>;
export type WordTimelinesOutput = z.output<typeof wordTimelinesSchema>;

/**
 * Parse WordTimeline and return as Result type
 */
export function parseWordTimeline(
  input: unknown,
): ValidationResult<WordTimelineOutput> {
  const result = wordTimelineSchema.safeParse(input);

  if (result.success) {
    return success(result.data);
  }

  return failure(
    "VALIDATION_ERROR",
    result.error.issues.map((e) => e.message).join(", "),
    { issues: result.error.issues },
  );
}

/**
 * Parse WordTimeline array and return as Result type
 */
export function parseWordTimelines(
  input: unknown,
): ValidationResult<WordTimelinesOutput> {
  const result = wordTimelinesSchema.safeParse(input);

  if (result.success) {
    return success(result.data);
  }

  // Return dedicated error code for overlap errors
  const hasOverlapError = result.error.issues.some(
    (e) => e.code === "custom" && e.message.includes("overlap"),
  );

  return failure(
    hasOverlapError ? "OVERLAP_DETECTED" : "VALIDATION_ERROR",
    result.error.issues.map((e) => e.message).join(", "),
    { issues: result.error.issues },
  );
}
