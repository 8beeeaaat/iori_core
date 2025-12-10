/**
 * Editing API - Merge functions
 * 複数のWord/Lineを1つに結合
 */

import { createWord } from "../factories/createWord";
import type { ValidationResult } from "../schemas/result";
import { failure, success } from "../schemas/result";
import type { Line, Lyric, Word, WordTimeline } from "../types";
import { rebuildIndex, reindexPositions } from "./helpers";

/**
 * 複数のWordを1つに結合
 *
 * @param lyric - 対象Lyric
 * @param wordIDs - 結合するWordのID配列（2つ以上、同じLine内）
 * @returns 結合後のLyric
 *
 * @example
 * // "さ", "く", "ら" → "さくら"
 * const result = mergeWords(lyric, ["word-1", "word-2", "word-3"]);
 */
export function mergeWords(
  lyric: Lyric,
  wordIDs: string[],
): ValidationResult<Lyric> {
  // 1. 最低2つ必要
  if (wordIDs.length < 2) {
    return failure(
      "INSUFFICIENT_WORDS",
      "At least 2 words are required for merging",
      { count: wordIDs.length },
    );
  }

  // 2. ID存在チェック
  for (const wordId of wordIDs) {
    if (!lyric._index.wordById.has(wordId)) {
      return failure("WORD_NOT_FOUND", `Word not found: ${wordId}`, { wordId });
    }
  }

  // 3. 全て同じLineに属するか確認
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

  // 4. 時系列順にソート
  const sortedWords = [...words].sort(
    (a, b) => a.timeline.begin - b.timeline.begin,
  );

  // 5. 新しいWordTimelineを作成
  const mergedTimeline: WordTimeline = {
    wordID: sortedWords[0].id, // 最初のWordのIDを継承
    text: sortedWords.map((w) => w.timeline.text).join(""),
    begin: sortedWords[0].timeline.begin,
    end: sortedWords[sortedWords.length - 1].timeline.end,
    hasWhitespace: sortedWords.some((w) => w.timeline.hasWhitespace),
    hasNewLine: sortedWords[sortedWords.length - 1].timeline.hasNewLine,
  };

  // 6. 新しいParagraphs構築
  const wordIDSet = new Set(wordIDs);
  const newParagraphs = lyric.paragraphs.map((paragraph) => {
    const newLines = paragraph.lines.map((line) => {
      if (line.id !== firstLine?.id) {
        return line;
      }

      // 元のWord配列から最初のマージ対象Wordの位置を見つける
      const firstWordIndex = line.words.findIndex(
        (w) => w.id === sortedWords[0].id,
      );

      // マージされたWordを作成
      const mergedWord = createWord({
        lineID: line.id,
        position: firstWordIndex + 1, // 仮position、後で再計算
        timeline: mergedTimeline,
      });

      // マージ対象以外のWordをフィルタ
      const filteredWords = line.words.filter((w) => !wordIDSet.has(w.id));

      // 元の位置にマージされたWordを挿入
      const newWords = [
        ...filteredWords.slice(0, firstWordIndex),
        mergedWord,
        ...filteredWords.slice(firstWordIndex),
      ];

      // position再計算
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

  // 7. インデックス再構築
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
 * 複数のLineを1つに結合
 *
 * @param lyric - 対象Lyric
 * @param lineIDs - 結合するLineのID配列（2つ以上、同じParagraph内）
 * @returns 結合後のLyric
 *
 * @example
 * // Line1 + Line2 → 1つのLineに
 * const result = mergeLines(lyric, ["line-1", "line-2"]);
 */
export function mergeLines(
  lyric: Lyric,
  lineIDs: string[],
): ValidationResult<Lyric> {
  // 1. 最低2つ必要
  if (lineIDs.length < 2) {
    return failure(
      "INSUFFICIENT_LINES",
      "At least 2 lines are required for merging",
      { count: lineIDs.length },
    );
  }

  // 2. ID存在チェック
  for (const lineId of lineIDs) {
    if (!lyric._index.lineById.has(lineId)) {
      return failure("LINE_NOT_FOUND", `Line not found: ${lineId}`, { lineId });
    }
  }

  // 3. 全て同じParagraphに属するか確認
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

  // 4. position順にソート（最初のWord.beginで判定）
  const sortedLines = [...lines].sort((a, b) => {
    const aBegin = a.words[0]?.timeline.begin ?? 0;
    const bBegin = b.words[0]?.timeline.begin ?? 0;
    return aBegin - bBegin;
  });

  // 5. 全Wordを結合
  const allWords: Word[] = [];
  const mergedLineID = sortedLines[0].id; // 最初のLineのIDを継承

  for (const line of sortedLines) {
    for (const word of line.words) {
      // lineIDを更新
      const updatedWord = Object.freeze({
        ...word,
        lineID: mergedLineID,
      });
      allWords.push(updatedWord);
    }
  }

  // position再計算
  const reindexedWords = reindexPositions(allWords);

  // 6. マージされたLineを作成
  const mergedLine: Line = Object.freeze({
    id: mergedLineID,
    position: sortedLines[0].position, // 仮position、後で再計算
    words: reindexedWords,
  });

  // 7. 新しいParagraphs構築
  const lineIDSet = new Set(lineIDs);
  const newParagraphs = lyric.paragraphs.map((paragraph) => {
    if (paragraph.id !== firstParagraph?.id) {
      return paragraph;
    }

    // 元のLine配列から最初のマージ対象Lineの位置を見つける
    const firstLineIndex = paragraph.lines.findIndex(
      (l) => l.id === sortedLines[0].id,
    );

    // マージ対象以外のLineをフィルタ
    const filteredLines = paragraph.lines.filter((l) => !lineIDSet.has(l.id));

    // 元の位置にマージされたLineを挿入
    const newLines = [
      ...filteredLines.slice(0, firstLineIndex),
      mergedLine,
      ...filteredLines.slice(firstLineIndex),
    ];

    // position再計算
    const reindexedLines = reindexPositions(newLines);

    return Object.freeze({
      ...paragraph,
      lines: reindexedLines,
    });
  });

  // 8. インデックス再構築
  const _index = rebuildIndex(newParagraphs);

  return success(
    Object.freeze({
      ...lyric,
      paragraphs: newParagraphs,
      _index,
    }),
  );
}
