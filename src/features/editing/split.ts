/**
 * Editing API - Split functions
 * Split Word/Line into multiple parts
 */

import { createWord } from "../../factories/createWord";
import type { ValidationResult } from "../../schemas/result";
import { failure, success } from "../../schemas/result";
import type { Line, Lyric, WordTimeline } from "../../types";
import { rebuildIndex, reindexPositions } from "./helpers";

/**
 * Split Word by character position
 */
export type SplitWordByPositionOptions = {
  type: "position";
  /** Split position (character index, 0-based) */
  charIndex: number;
};

/**
 * Split Word by time
 */
export type SplitWordByTimeOptions = {
  type: "time";
  /** Split time (seconds) */
  splitTime: number;
};

export type SplitWordOptions =
  | SplitWordByPositionOptions
  | SplitWordByTimeOptions;

/**
 * Split a Word into two
 *
 * @param lyric - Target Lyric
 * @param wordID - ID of the Word to split
 * @param options - Split options (position or time)
 * @returns Lyric after splitting
 *
 * @example
 * // "さくらさく" → "さくら" + "さく" (split by character position)
 * const result = splitWord(lyric, "word-1", {
 *   type: "position",
 *   charIndex: 3
 * });
 *
 * @example
 * // Split by time
 * const result = splitWord(lyric, "word-1", {
 *   type: "time",
 *   splitTime: 1.5
 * });
 */
export function splitWord(
  lyric: Lyric,
  wordID: string,
  options: SplitWordOptions,
): ValidationResult<Lyric> {
  // 1. Check word existence
  const word = lyric._index.wordById.get(wordID);
  if (!word) {
    return failure("WORD_NOT_FOUND", `Word not found: ${wordID}`, { wordID });
  }

  // 2. Determine split position
  let splitCharIndex: number;

  if (options.type === "position") {
    splitCharIndex = options.charIndex;

    if (splitCharIndex <= 0 || splitCharIndex >= word.chars.length) {
      return failure(
        "INVALID_SPLIT_POSITION",
        `Invalid character position: ${options.charIndex}`,
        { charIndex: options.charIndex, wordLength: word.chars.length },
      );
    }
  } else {
    // For time option, find the corresponding character
    const charIdx = word.chars.findIndex(
      (char) => char.begin <= options.splitTime && options.splitTime < char.end,
    );

    if (charIdx <= 0 || charIdx >= word.chars.length) {
      return failure(
        "INVALID_SPLIT_TIME",
        `Split time ${options.splitTime} is outside word boundaries`,
        { splitTime: options.splitTime, word },
      );
    }

    splitCharIndex = charIdx;
  }

  // 3. Create two WordTimelines
  const firstChars = word.chars.slice(0, splitCharIndex);
  const secondChars = word.chars.slice(splitCharIndex);

  const firstTimeline: WordTimeline = {
    wordID: word.id, // Inherit original ID
    text: firstChars.map((c) => c.text).join(""),
    begin: word.timeline.begin,
    end: firstChars[firstChars.length - 1].end,
    hasWhitespace: false,
    hasNewLine: false,
  };

  const secondTimeline: WordTimeline = {
    wordID: `word-${crypto.randomUUID()}`, // New ID
    text: secondChars.map((c) => c.text).join(""),
    begin: secondChars[0].begin,
    end: word.timeline.end,
    hasWhitespace: word.timeline.hasWhitespace,
    hasNewLine: word.timeline.hasNewLine,
  };

  // 4. Build new paragraphs
  const line = lyric._index.lineByWordId.get(wordID);

  const newParagraphs = lyric.paragraphs.map((paragraph) => {
    const newLines = paragraph.lines.map((l) => {
      if (l.id !== line?.id) {
        return l;
      }

      const wordIndex = l.words.findIndex((w) => w.id === wordID);
      const firstWord = createWord({
        lineID: l.id,
        position: wordIndex + 1, // Temporary position, recalculated later
        timeline: firstTimeline,
      });
      const secondWord = createWord({
        lineID: l.id,
        position: wordIndex + 2, // Temporary position, recalculated later
        timeline: secondTimeline,
      });

      const newWords = [
        ...l.words.slice(0, wordIndex),
        firstWord,
        secondWord,
        ...l.words.slice(wordIndex + 1),
      ];

      // Recalculate positions
      const reindexedWords = reindexPositions(newWords);

      return Object.freeze({
        ...l,
        words: reindexedWords,
      });
    });

    return Object.freeze({
      ...paragraph,
      lines: newLines,
    });
  });

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
 * Split Line by Word position
 */
export type SplitLineByWordOptions = {
  type: "word";
  /** Split position (ID of the first Word of the second Line) */
  splitWordID: string;
};

/**
 * Split Line by time
 */
export type SplitLineByTimeOptions = {
  type: "time";
  /** Split time (seconds) */
  splitTime: number;
};

export type SplitLineOptions = SplitLineByWordOptions | SplitLineByTimeOptions;

/**
 * Split a Line into two
 *
 * @param lyric - Target Lyric
 * @param lineID - ID of the Line to split
 * @param options - Split options (position or time)
 * @returns Lyric after splitting
 *
 * @example
 * // Split by Word ID
 * const result = splitLine(lyric, "line-1", {
 *   type: "word",
 *   splitWordID: "word-3"
 * });
 *
 * @example
 * // Split by time
 * const result = splitLine(lyric, "line-1", {
 *   type: "time",
 *   splitTime: 2.0
 * });
 */
export function splitLine(
  lyric: Lyric,
  lineID: string,
  options: SplitLineOptions,
): ValidationResult<Lyric> {
  // 1. Check line existence
  const line = lyric._index.lineById.get(lineID);
  if (!line) {
    return failure("LINE_NOT_FOUND", `Line not found: ${lineID}`, { lineID });
  }

  // 2. Determine split position
  let splitWordIndex: number;

  if (options.type === "word") {
    splitWordIndex = line.words.findIndex((w) => w.id === options.splitWordID);

    if (splitWordIndex <= 0 || splitWordIndex >= line.words.length) {
      return failure(
        "INVALID_SPLIT_WORD",
        `Invalid split word: ${options.splitWordID}`,
        { splitWordID: options.splitWordID },
      );
    }
  } else {
    // For time option
    const wordIdx = line.words.findIndex(
      (w) =>
        w.timeline.begin <= options.splitTime &&
        options.splitTime < w.timeline.end,
    );

    if (wordIdx <= 0 || wordIdx >= line.words.length) {
      return failure(
        "INVALID_SPLIT_TIME",
        `Split time ${options.splitTime} is outside line boundaries`,
        { splitTime: options.splitTime },
      );
    }

    splitWordIndex = wordIdx;
  }

  // 3. Create two Lines
  const firstWords = line.words.slice(0, splitWordIndex);
  const secondWords = line.words.slice(splitWordIndex);

  const newLineID = `line-${crypto.randomUUID()}`;

  // Update word lineID and recalculate positions
  const firstLineWords = firstWords.map((w) =>
    Object.freeze({ ...w, lineID: line.id }),
  );
  const secondLineWords = secondWords.map((w) =>
    Object.freeze({ ...w, lineID: newLineID }),
  );

  const firstLine: Line = Object.freeze({
    id: line.id,
    position: line.position, // Temporary position, recalculated later
    words: reindexPositions(firstLineWords),
  });

  const secondLine: Line = Object.freeze({
    id: newLineID,
    position: line.position + 1, // Temporary position, recalculated later
    words: reindexPositions(secondLineWords),
  });

  // 4. Build new paragraphs
  const paragraph = lyric._index.paragraphByLineId.get(lineID);

  const newParagraphs = lyric.paragraphs.map((p) => {
    if (p.id !== paragraph?.id) {
      return p;
    }

    const lineIndex = p.lines.findIndex((l) => l.id === lineID);
    const newLines = [
      ...p.lines.slice(0, lineIndex),
      firstLine,
      secondLine,
      ...p.lines.slice(lineIndex + 1),
    ];

    // Recalculate positions
    const reindexedLines = reindexPositions(newLines);

    return Object.freeze({
      ...p,
      lines: reindexedLines,
    });
  });

  const _index = rebuildIndex(newParagraphs);

  return success(
    Object.freeze({
      ...lyric,
      paragraphs: newParagraphs,
      _index,
    }),
  );
}
