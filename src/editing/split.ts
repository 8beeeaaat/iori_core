/**
 * Editing API - Split functions
 * Word/Lineを複数に分割
 */

import { createWord } from "../factories/createWord";
import type { ValidationResult } from "../schemas/result";
import { failure, success } from "../schemas/result";
import type { Line, Lyric, WordTimeline } from "../types";
import { rebuildIndex, reindexPositions } from "./helpers";

/**
 * Wordを文字位置で分割
 */
export type SplitWordByPositionOptions = {
  type: "position";
  /** 分割位置（文字インデックス、0始まり） */
  charIndex: number;
};

/**
 * Wordを時間で分割
 */
export type SplitWordByTimeOptions = {
  type: "time";
  /** 分割時間（秒） */
  splitTime: number;
};

export type SplitWordOptions =
  | SplitWordByPositionOptions
  | SplitWordByTimeOptions;

/**
 * Wordを2つに分割
 *
 * @param lyric - 対象Lyric
 * @param wordID - 分割するWordのID
 * @param options - 分割オプション（位置または時間）
 * @returns 分割後のLyric
 *
 * @example
 * // "さくらさく" → "さくら" + "さく" (文字位置で分割)
 * const result = splitWord(lyric, "word-1", {
 *   type: "position",
 *   charIndex: 3
 * });
 *
 * @example
 * // 時間で分割
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
  // 1. Word存在チェック
  const word = lyric._index.wordById.get(wordID);
  if (!word) {
    return failure("WORD_NOT_FOUND", `Word not found: ${wordID}`, { wordID });
  }

  // 2. 分割位置の決定
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
    // time指定の場合、該当する文字を探す
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

  // 3. 2つのWordTimelineを作成
  const firstChars = word.chars.slice(0, splitCharIndex);
  const secondChars = word.chars.slice(splitCharIndex);

  const firstTimeline: WordTimeline = {
    wordID: word.id, // 元のIDを継承
    text: firstChars.map((c) => c.text).join(""),
    begin: word.timeline.begin,
    end: firstChars[firstChars.length - 1].end,
    hasWhitespace: false,
    hasNewLine: false,
  };

  const secondTimeline: WordTimeline = {
    wordID: `word-${crypto.randomUUID()}`, // 新しいID
    text: secondChars.map((c) => c.text).join(""),
    begin: secondChars[0].begin,
    end: word.timeline.end,
    hasWhitespace: word.timeline.hasWhitespace,
    hasNewLine: word.timeline.hasNewLine,
  };

  // 4. 新しいParagraphs構築
  const line = lyric._index.lineByWordId.get(wordID);

  const newParagraphs = lyric.paragraphs.map((paragraph) => {
    const newLines = paragraph.lines.map((l) => {
      if (l.id !== line?.id) {
        return l;
      }

      const wordIndex = l.words.findIndex((w) => w.id === wordID);
      const firstWord = createWord({
        lineID: l.id,
        position: wordIndex + 1, // 仮position、後で再計算
        timeline: firstTimeline,
      });
      const secondWord = createWord({
        lineID: l.id,
        position: wordIndex + 2, // 仮position、後で再計算
        timeline: secondTimeline,
      });

      const newWords = [
        ...l.words.slice(0, wordIndex),
        firstWord,
        secondWord,
        ...l.words.slice(wordIndex + 1),
      ];

      // position再計算
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
 * LineをWord位置で分割
 */
export type SplitLineByWordOptions = {
  type: "word";
  /** 分割する位置（2つ目のLineの最初のWordのID） */
  splitWordID: string;
};

/**
 * Lineを時間で分割
 */
export type SplitLineByTimeOptions = {
  type: "time";
  /** 分割時間（秒） */
  splitTime: number;
};

export type SplitLineOptions = SplitLineByWordOptions | SplitLineByTimeOptions;

/**
 * Lineを2つに分割
 *
 * @param lyric - 対象Lyric
 * @param lineID - 分割するLineのID
 * @param options - 分割オプション（位置または時間）
 * @returns 分割後のLyric
 *
 * @example
 * // Word IDで分割
 * const result = splitLine(lyric, "line-1", {
 *   type: "word",
 *   splitWordID: "word-3"
 * });
 *
 * @example
 * // 時間で分割
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
  // 1. Line存在チェック
  const line = lyric._index.lineById.get(lineID);
  if (!line) {
    return failure("LINE_NOT_FOUND", `Line not found: ${lineID}`, { lineID });
  }

  // 2. 分割位置の決定
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
    // time指定の場合
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

  // 3. 2つのLineを作成
  const firstWords = line.words.slice(0, splitWordIndex);
  const secondWords = line.words.slice(splitWordIndex);

  const newLineID = `line-${crypto.randomUUID()}`;

  // Word の lineID 更新と position 再計算
  const firstLineWords = firstWords.map((w) =>
    Object.freeze({ ...w, lineID: line.id }),
  );
  const secondLineWords = secondWords.map((w) =>
    Object.freeze({ ...w, lineID: newLineID }),
  );

  const firstLine: Line = Object.freeze({
    id: line.id,
    position: line.position, // 仮position、後で再計算
    words: reindexPositions(firstLineWords),
  });

  const secondLine: Line = Object.freeze({
    id: newLineID,
    position: line.position + 1, // 仮position、後で再計算
    words: reindexPositions(secondLineWords),
  });

  // 4. 新しいParagraphs構築
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

    // position再計算
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
