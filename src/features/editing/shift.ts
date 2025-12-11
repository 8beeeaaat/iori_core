/**
 * Editing API - Shift functions
 * Batch timing shift for multiple Word/Line/Paragraph
 */

import type { ValidationResult } from "../../schemas/result";
import { failure, success } from "../../schemas/result";
import type { Char, Lyric, Word } from "../../types";
import { checkOverlaps, rebuildIndex } from "./helpers";

/**
 * Shift a Char (internal helper)
 */
function shiftChar(char: Char, offset: number): Char {
  return Object.freeze({
    ...char,
    begin: Number((char.begin + offset).toFixed(2)),
    end: Number((char.end + offset).toFixed(2)),
  });
}

/**
 * Shift a Word (internal helper)
 */
function shiftWord(word: Word, offset: number): Word {
  const newChars = word.chars.map((char) => shiftChar(char, offset));

  return Object.freeze({
    ...word,
    timeline: Object.freeze({
      ...word.timeline,
      begin: Number((word.timeline.begin + offset).toFixed(2)),
      end: Number((word.timeline.end + offset).toFixed(2)),
    }),
    chars: newChars,
  });
}

/**
 * Batch timing shift for multiple Words
 */
export function shiftWords(
  lyric: Lyric,
  wordIDs: string[],
  offsetSec: number,
): ValidationResult<Lyric> {
  const wordIDSet = new Set(wordIDs);

  // Check if all word IDs exist
  for (const wordId of wordIDs) {
    if (!lyric._index.wordById.has(wordId)) {
      return failure("WORD_NOT_FOUND", `Word not found: ${wordId}`, { wordId });
    }
  }

  // Check if shift would result in negative time
  for (const wordId of wordIDs) {
    const word = lyric._index.wordById.get(wordId);
    if (word && word.timeline.begin + offsetSec < 0) {
      return failure(
        "INVALID_TIME",
        `Shift would result in negative begin time for word: ${wordId}`,
        { wordId, newBegin: word.timeline.begin + offsetSec },
      );
    }
  }

  // Build new paragraphs with shifted words
  const newParagraphs = lyric.paragraphs.map((paragraph) => {
    const newLines = paragraph.lines.map((line) => {
      const newWords = line.words.map((word) => {
        if (wordIDSet.has(word.id)) {
          return shiftWord(word, offsetSec);
        }
        return word;
      });

      return Object.freeze({
        ...line,
        words: newWords,
      });
    });

    return Object.freeze({
      ...paragraph,
      lines: newLines,
    });
  });

  // Get all words and validate no overlaps using Zod
  const allWords: Word[] = newParagraphs.flatMap((p) =>
    p.lines.flatMap((l) => l.words as Word[]),
  );

  const overlapResult = checkOverlaps(allWords);
  if (!overlapResult.success) {
    return overlapResult;
  }

  const _index = rebuildIndex(newParagraphs);

  return success(
    Object.freeze({
      ...lyric,
      paragraphs: newParagraphs,
      _index,
    }),
  );
}

/**
 * Batch timing shift for multiple Lines
 */
export function shiftLines(
  lyric: Lyric,
  lineIDs: string[],
  offsetSec: number,
): ValidationResult<Lyric> {
  // Check if all line IDs exist
  for (const lineId of lineIDs) {
    if (!lyric._index.lineById.has(lineId)) {
      return failure("LINE_NOT_FOUND", `Line not found: ${lineId}`, { lineId });
    }
  }

  // Collect all word IDs from the lines
  const wordIDs: string[] = [];
  for (const lineId of lineIDs) {
    const line = lyric._index.lineById.get(lineId);
    if (line) {
      for (const word of line.words) {
        wordIDs.push(word.id);
      }
    }
  }

  return shiftWords(lyric, wordIDs, offsetSec);
}

/**
 * Batch timing shift for multiple Paragraphs
 */
export function shiftParagraphs(
  lyric: Lyric,
  paragraphIDs: string[],
  offsetSec: number,
): ValidationResult<Lyric> {
  // Check if all paragraph IDs exist
  for (const paragraphId of paragraphIDs) {
    if (!lyric._index.paragraphById.has(paragraphId)) {
      return failure(
        "PARAGRAPH_NOT_FOUND",
        `Paragraph not found: ${paragraphId}`,
        { paragraphId },
      );
    }
  }

  // Collect all word IDs from the paragraphs
  const wordIDs: string[] = [];
  for (const paragraphId of paragraphIDs) {
    const paragraph = lyric._index.paragraphById.get(paragraphId);
    if (paragraph) {
      for (const line of paragraph.lines) {
        for (const word of line.words) {
          wordIDs.push(word.id);
        }
      }
    }
  }

  return shiftWords(lyric, wordIDs, offsetSec);
}

/**
 * Shift all elements within a time range
 */
export function shiftRange(
  lyric: Lyric,
  beginTime: number,
  endTime: number,
  offsetSec: number,
): ValidationResult<Lyric> {
  // Find all words that fall within the time range
  const wordIDs: string[] = [];

  for (const paragraph of lyric.paragraphs) {
    for (const line of paragraph.lines) {
      for (const word of line.words) {
        // Word is in range if it starts within the range
        if (word.timeline.begin >= beginTime && word.timeline.begin < endTime) {
          wordIDs.push(word.id);
        }
      }
    }
  }

  if (wordIDs.length === 0) {
    return success(lyric);
  }

  return shiftWords(lyric, wordIDs, offsetSec);
}

/**
 * Adjust the begin time of a Word
 */
export function adjustWordBegin(
  lyric: Lyric,
  wordID: string,
  newBegin: number,
): ValidationResult<Lyric> {
  const word = lyric._index.wordById.get(wordID);
  if (!word) {
    return failure("WORD_NOT_FOUND", `Word not found: ${wordID}`, { wordID });
  }

  if (newBegin < 0) {
    return failure("INVALID_TIME", "Begin time cannot be negative", {
      wordID,
      newBegin,
    });
  }

  if (newBegin >= word.timeline.end) {
    return failure("INVALID_TIME", "Begin time must be less than end time", {
      wordID,
      newBegin,
      currentEnd: word.timeline.end,
    });
  }

  // Calculate how to adjust char timings proportionally
  const oldDuration = word.timeline.end - word.timeline.begin;
  const newDuration = word.timeline.end - newBegin;
  const ratio = newDuration / oldDuration;

  const newChars = word.chars.map((char) => {
    const relativeBegin = char.begin - word.timeline.begin;
    const relativeEnd = char.end - word.timeline.begin;
    return Object.freeze({
      ...char,
      begin: Number((newBegin + relativeBegin * ratio).toFixed(2)),
      end: Number((newBegin + relativeEnd * ratio).toFixed(2)),
    });
  });

  const newWord = Object.freeze({
    ...word,
    timeline: Object.freeze({
      ...word.timeline,
      begin: Number(newBegin.toFixed(2)),
    }),
    chars: newChars,
  });

  // Build new paragraphs
  const newParagraphs = lyric.paragraphs.map((paragraph) => {
    const newLines = paragraph.lines.map((line) => {
      const newWords = line.words.map((w) => (w.id === wordID ? newWord : w));
      return Object.freeze({ ...line, words: newWords });
    });
    return Object.freeze({ ...paragraph, lines: newLines });
  });

  // Validate no overlaps using Zod
  const allWords: Word[] = newParagraphs.flatMap((p) =>
    p.lines.flatMap((l) => l.words as Word[]),
  );
  const overlapResult = checkOverlaps(allWords);
  if (!overlapResult.success) {
    return overlapResult;
  }

  const _index = rebuildIndex(newParagraphs);

  return success(
    Object.freeze({
      ...lyric,
      paragraphs: newParagraphs,
      _index,
    }),
  );
}

/**
 * Adjust the end time of a Word
 */
export function adjustWordEnd(
  lyric: Lyric,
  wordID: string,
  newEnd: number,
): ValidationResult<Lyric> {
  const word = lyric._index.wordById.get(wordID);
  if (!word) {
    return failure("WORD_NOT_FOUND", `Word not found: ${wordID}`, { wordID });
  }

  if (newEnd <= word.timeline.begin) {
    return failure("INVALID_TIME", "End time must be greater than begin time", {
      wordID,
      newEnd,
      currentBegin: word.timeline.begin,
    });
  }

  // Calculate how to adjust char timings proportionally
  const oldDuration = word.timeline.end - word.timeline.begin;
  const newDuration = newEnd - word.timeline.begin;
  const ratio = newDuration / oldDuration;

  const newChars = word.chars.map((char) => {
    const relativeBegin = char.begin - word.timeline.begin;
    const relativeEnd = char.end - word.timeline.begin;
    return Object.freeze({
      ...char,
      begin: Number((word.timeline.begin + relativeBegin * ratio).toFixed(2)),
      end: Number((word.timeline.begin + relativeEnd * ratio).toFixed(2)),
    });
  });

  const newWord = Object.freeze({
    ...word,
    timeline: Object.freeze({
      ...word.timeline,
      end: Number(newEnd.toFixed(2)),
    }),
    chars: newChars,
  });

  // Build new paragraphs
  const newParagraphs = lyric.paragraphs.map((paragraph) => {
    const newLines = paragraph.lines.map((line) => {
      const newWords = line.words.map((w) => (w.id === wordID ? newWord : w));
      return Object.freeze({ ...line, words: newWords });
    });
    return Object.freeze({ ...paragraph, lines: newLines });
  });

  // Validate no overlaps using Zod
  const allWords: Word[] = newParagraphs.flatMap((p) =>
    p.lines.flatMap((l) => l.words as Word[]),
  );
  const overlapResult = checkOverlaps(allWords);
  if (!overlapResult.success) {
    return overlapResult;
  }

  const _index = rebuildIndex(newParagraphs);

  return success(
    Object.freeze({
      ...lyric,
      paragraphs: newParagraphs,
      _index,
    }),
  );
}

/**
 * Adjust both begin and end times of a Word
 */
export function adjustWordTiming(
  lyric: Lyric,
  wordID: string,
  newBegin: number,
  newEnd: number,
): ValidationResult<Lyric> {
  const word = lyric._index.wordById.get(wordID);
  if (!word) {
    return failure("WORD_NOT_FOUND", `Word not found: ${wordID}`, { wordID });
  }

  if (newBegin < 0) {
    return failure("INVALID_TIME", "Begin time cannot be negative", {
      wordID,
      newBegin,
    });
  }

  if (newEnd <= newBegin) {
    return failure("INVALID_TIME", "End time must be greater than begin time", {
      wordID,
      newBegin,
      newEnd,
    });
  }

  // Calculate how to adjust char timings proportionally
  const oldDuration = word.timeline.end - word.timeline.begin;
  const newDuration = newEnd - newBegin;
  const ratio = newDuration / oldDuration;

  const newChars = word.chars.map((char) => {
    const relativeBegin = char.begin - word.timeline.begin;
    const relativeEnd = char.end - word.timeline.begin;
    return Object.freeze({
      ...char,
      begin: Number((newBegin + relativeBegin * ratio).toFixed(2)),
      end: Number((newBegin + relativeEnd * ratio).toFixed(2)),
    });
  });

  const newWord = Object.freeze({
    ...word,
    timeline: Object.freeze({
      ...word.timeline,
      begin: Number(newBegin.toFixed(2)),
      end: Number(newEnd.toFixed(2)),
    }),
    chars: newChars,
  });

  // Build new paragraphs
  const newParagraphs = lyric.paragraphs.map((paragraph) => {
    const newLines = paragraph.lines.map((line) => {
      const newWords = line.words.map((w) => (w.id === wordID ? newWord : w));
      return Object.freeze({ ...line, words: newWords });
    });
    return Object.freeze({ ...paragraph, lines: newLines });
  });

  // Validate no overlaps using Zod
  const allWords: Word[] = newParagraphs.flatMap((p) =>
    p.lines.flatMap((l) => l.words as Word[]),
  );
  const overlapResult = checkOverlaps(allWords);
  if (!overlapResult.success) {
    return overlapResult;
  }

  const _index = rebuildIndex(newParagraphs);

  return success(
    Object.freeze({
      ...lyric,
      paragraphs: newParagraphs,
      _index,
    }),
  );
}
