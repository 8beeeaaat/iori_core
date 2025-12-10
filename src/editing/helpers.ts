/**
 * Editing API - 共通ヘルパー関数
 */

import type { Line, LyricIndex, Paragraph, Word } from "../types";

/**
 * LyricIndexを再構築する
 * Paragraph配列から全てのインデックスマップを構築
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
 * オーバーラップをチェックする
 * Word配列をソートして隣接するWordのタイムラインがオーバーラップしていないか確認
 */
export function checkOverlaps(words: Word[]): {
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
 * Position値を再割り当て
 * 配列のインデックスから1始まりのposition値を設定
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
