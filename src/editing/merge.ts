/**
 * Editing API - Merge functions
 * Merge multiple Word/Line into one
 */

import { createWord } from "../factories/createWord";
import type { ValidationResult } from "../schemas/result";
import { failure, success } from "../schemas/result";
import type { Line, Lyric, Word, WordTimeline } from "../types";
import { rebuildIndex, reindexPositions } from "./helpers";

/**
 * Merge multiple Words into one
 *
 * @param lyric - Target Lyric
 * @param wordIDs - Array of Word IDs to merge (2 or more, within the same Line)
 * @returns Lyric after merging
 *
 * @example
 * // "さ", "く", "ら" → "さくら"(Japanese hiragana merge)
 * const result = mergeWords(lyric, ["word-1", "word-2", "word-3"]);
 */
export function mergeWords(
  lyric: Lyric,
  wordIDs: string[],
): ValidationResult<Lyric> {
  // 1. At least 2 required
  if (wordIDs.length < 2) {
    return failure(
      "INSUFFICIENT_WORDS",
      "At least 2 words are required for merging",
      { count: wordIDs.length },
    );
  }

  // 2. Check ID existence
  for (const wordId of wordIDs) {
    if (!lyric._index.wordById.has(wordId)) {
      return failure("WORD_NOT_FOUND", `Word not found: ${wordId}`, { wordId });
    }
  }

  // 3. Verify all words belong to the same line
  const words: Word[] = [];
  for (const id of wordIDs) {
    const word = lyric._index.wordById.get(id);
    if (word) {
      words.push(word);
    }
  }
  const firstLine = lyric._index.lineByWordId.get(words[0].id);

  for (const word of words) {
    const line = lyric._index.lineByWordId.get(word.id);
    if (line?.id !== firstLine?.id) {
      return failure(
        "WORDS_NOT_IN_SAME_LINE",
        "All words must belong to the same line",
        { wordIDs, lineIDs: [firstLine?.id, line?.id] },
      );
    }
  }

  // 4. Sort chronologically
  const sortedWords = [...words].sort(
    (a, b) => a.timeline.begin - b.timeline.begin,
  );

  // 5. Create new WordTimeline
  const mergedTimeline: WordTimeline = {
    wordID: sortedWords[0].id, // Inherit ID from first word
    text: sortedWords.map((w) => w.timeline.text).join(""),
    begin: sortedWords[0].timeline.begin,
    end: sortedWords[sortedWords.length - 1].timeline.end,
    hasWhitespace: sortedWords.some((w) => w.timeline.hasWhitespace),
    hasNewLine: sortedWords[sortedWords.length - 1].timeline.hasNewLine,
  };

  // 6. Build new paragraphs
  const wordIDSet = new Set(wordIDs);
  const newParagraphs = lyric.paragraphs.map((paragraph) => {
    const newLines = paragraph.lines.map((line) => {
      if (line.id !== firstLine?.id) {
        return line;
      }

      // Find the position of the first merge target word in the original array
      const firstWordIndex = line.words.findIndex(
        (w) => w.id === sortedWords[0].id,
      );

      // Create merged word
      const mergedWord = createWord({
        lineID: line.id,
        position: firstWordIndex + 1, // Temporary position, recalculated later
        timeline: mergedTimeline,
      });

      // Filter out words that are merge targets
      const filteredWords = line.words.filter((w) => !wordIDSet.has(w.id));

      // Insert merged word at the original position
      const newWords = [
        ...filteredWords.slice(0, firstWordIndex),
        mergedWord,
        ...filteredWords.slice(firstWordIndex),
      ];

      // Recalculate positions
      const reindexedWords = reindexPositions(newWords);

      return Object.freeze({
        ...line,
        words: reindexedWords,
      });
    });

    return Object.freeze({
      ...paragraph,
      lines: newLines,
    });
  });

  // 7. Rebuild index
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
 * Merge multiple Lines into one
 *
 * @param lyric - Target Lyric
 * @param lineIDs - Array of Line IDs to merge (2 or more, within the same Paragraph)
 * @returns Lyric after merging
 *
 * @example
 * // Line1 + Line2 → merged into one Line
 * const result = mergeLines(lyric, ["line-1", "line-2"]);
 */
export function mergeLines(
  lyric: Lyric,
  lineIDs: string[],
): ValidationResult<Lyric> {
  // 1. At least 2 required
  if (lineIDs.length < 2) {
    return failure(
      "INSUFFICIENT_LINES",
      "At least 2 lines are required for merging",
      { count: lineIDs.length },
    );
  }

  // 2. Check ID existence
  for (const lineId of lineIDs) {
    if (!lyric._index.lineById.has(lineId)) {
      return failure("LINE_NOT_FOUND", `Line not found: ${lineId}`, { lineId });
    }
  }

  // 3. Verify all lines belong to the same paragraph
  const lines: Line[] = [];
  for (const id of lineIDs) {
    const line = lyric._index.lineById.get(id);
    if (line) {
      lines.push(line);
    }
  }
  const firstParagraph = lyric._index.paragraphByLineId.get(lines[0].id);

  for (const line of lines) {
    const paragraph = lyric._index.paragraphByLineId.get(line.id);
    if (paragraph?.id !== firstParagraph?.id) {
      return failure(
        "LINES_NOT_IN_SAME_PARAGRAPH",
        "All lines must belong to the same paragraph",
        { lineIDs },
      );
    }
  }

  // 4. Sort by position (determined by first Word.begin)
  const sortedLines = [...lines].sort((a, b) => {
    const aBegin = a.words[0]?.timeline.begin ?? 0;
    const bBegin = b.words[0]?.timeline.begin ?? 0;
    return aBegin - bBegin;
  });

  // 5. Combine all words
  const allWords: Word[] = [];
  const mergedLineID = sortedLines[0].id; // Inherit ID from first line

  for (const line of sortedLines) {
    for (const word of line.words) {
      // Update lineID
      const updatedWord = Object.freeze({
        ...word,
        lineID: mergedLineID,
      });
      allWords.push(updatedWord);
    }
  }

  // Recalculate positions
  const reindexedWords = reindexPositions(allWords);

  // 6. Create merged line
  const mergedLine: Line = Object.freeze({
    id: mergedLineID,
    position: sortedLines[0].position, // Temporary position, recalculated later
    words: reindexedWords,
  });

  // 7. Build new paragraphs
  const lineIDSet = new Set(lineIDs);
  const newParagraphs = lyric.paragraphs.map((paragraph) => {
    if (paragraph.id !== firstParagraph?.id) {
      return paragraph;
    }

    // Find the position of the first merge target line in the original array
    const firstLineIndex = paragraph.lines.findIndex(
      (l) => l.id === sortedLines[0].id,
    );

    // Filter out lines that are merge targets
    const filteredLines = paragraph.lines.filter((l) => !lineIDSet.has(l.id));

    // Insert merged line at the original position
    const newLines = [
      ...filteredLines.slice(0, firstLineIndex),
      mergedLine,
      ...filteredLines.slice(firstLineIndex),
    ];

    // Recalculate positions
    const reindexedLines = reindexPositions(newLines);

    return Object.freeze({
      ...paragraph,
      lines: reindexedLines,
    });
  });

  // 8. Rebuild index
  const _index = rebuildIndex(newParagraphs);

  return success(
    Object.freeze({
      ...lyric,
      paragraphs: newParagraphs,
      _index,
    }),
  );
}
