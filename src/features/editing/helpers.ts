/**
 * Editing API - Common helper functions
 */

import type { ValidationResult } from "../../schemas/result";
import { failure, success } from "../../schemas/result";
import { wordTimelinesSchema } from "../../schemas/timeline.schema";
import type { Line, LyricIndex, Paragraph, Word } from "../../types";

/**
 * Rebuild LyricIndex
 * Build all index maps from Paragraph array
 */
export function rebuildIndex(paragraphs: readonly Paragraph[]): LyricIndex {
  const wordByCharId = new Map<string, Word>();
  const lineByWordId = new Map<string, Line>();
  const paragraphByLineId = new Map<string, Paragraph>();
  const wordById = new Map<string, Word>();
  const lineById = new Map<string, Line>();
  const paragraphById = new Map<string, Paragraph>();

  for (const paragraph of paragraphs) {
    paragraphById.set(paragraph.id, paragraph);

    for (const line of paragraph.lines) {
      lineById.set(line.id, line);
      paragraphByLineId.set(line.id, paragraph);

      for (const word of line.words) {
        wordById.set(word.id, word);
        lineByWordId.set(word.id, line);

        for (const char of word.chars) {
          wordByCharId.set(char.id, word);
        }
      }
    }
  }

  return Object.freeze({
    wordByCharId,
    lineByWordId,
    paragraphByLineId,
    wordById,
    lineById,
    paragraphById,
  });
}

/**
 * Validate that Word array has no timeline overlaps using wordTimelinesSchema
 * Reuses the existing Zod schema from timeline.schema.ts
 */
export function checkOverlaps(words: Word[]): ValidationResult<Word[]> {
  // Convert Word[] to WordTimeline[] format for schema validation
  const timelines = words.map((w) => w.timeline);

  const result = wordTimelinesSchema.safeParse(timelines);

  if (result.success) {
    return success(words);
  }

  // Extract overlap details from Zod error message
  const overlapIssue = result.error.issues.find(
    (issue) =>
      issue.code === "custom" && issue.message.includes("Timeline overlap"),
  );

  if (overlapIssue) {
    // Find overlapping words by comparing sorted timelines
    const sorted = [...words].sort(
      (a, b) => a.timeline.begin - b.timeline.begin,
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].timeline.end > sorted[i + 1].timeline.begin) {
        return failure(
          "OVERLAP_DETECTED",
          `Timeline overlap between words: ${sorted[i].id} and ${sorted[i + 1].id}`,
          { word1: sorted[i].id, word2: sorted[i + 1].id },
        );
      }
    }
  }

  return failure(
    "VALIDATION_ERROR",
    result.error.issues.map((e) => e.message).join(", "),
    { issues: result.error.issues },
  );
}

/**
 * Reassign position values
 * Set 1-based position values from array indices
 */
export function reindexPositions<T extends { position: number }>(
  items: readonly T[],
): readonly T[] {
  return items.map((item, index) =>
    Object.freeze({
      ...item,
      position: index + 1,
    }),
  );
}
