/**
 * Editing API - Shift functions
 * 複数のWord/Line/Paragraphを一括でタイミング移動
 */

import type { ValidationResult } from "../schemas/result";
import { failure, success } from "../schemas/result";
import type { Char, Line, Lyric, LyricIndex, Paragraph, Word } from "../types";

/**
 * Charをシフトする（内部ヘルパー）
 */
function shiftChar(char: Char, offset: number): Char {
  return Object.freeze({
    ...char,
    begin: Number((char.begin + offset).toFixed(2)),
    end: Number((char.end + offset).toFixed(2)),
  });
}

/**
 * Wordをシフトする（内部ヘルパー）
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
 * LyricIndexを再構築する
 */
function rebuildIndex(paragraphs: readonly Paragraph[]): LyricIndex {
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
 * オーバーラップをチェックする
 */
function checkOverlaps(words: Word[]): {
  hasOverlap: boolean;
  details?: { word1: string; word2: string };
} {
  const sorted = [...words].sort((a, b) => a.timeline.begin - b.timeline.begin);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.timeline.end > next.timeline.begin) {
      return {
        hasOverlap: true,
        details: { word1: current.id, word2: next.id },
      };
    }
  }

  return { hasOverlap: false };
}

/**
 * 複数のWordを一括タイミング移動
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

  // Get all words and check for overlaps
  const allWords: Word[] = newParagraphs.flatMap((p) =>
    p.lines.flatMap((l) => l.words as Word[]),
  );

  const overlapCheck = checkOverlaps(allWords);
  if (overlapCheck.hasOverlap) {
    return failure(
      "OVERLAP_DETECTED",
      `Timeline overlap between words: ${overlapCheck.details?.word1} and ${overlapCheck.details?.word2}`,
      overlapCheck.details,
    );
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
 * 複数のLineを一括タイミング移動
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
 * 複数のParagraphを一括タイミング移動
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
 * 時間範囲内の全要素を移動
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
