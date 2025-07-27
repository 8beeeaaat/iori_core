import type { CharPosition, GridPosition, Line, Lyric, Word } from "../types";
import { getLines, getLineWords } from "./helpers";

export function getWordGridPositions(line: Line): Map<string, GridPosition> {
  const words = getLineWords(line);
  const map = new Map<string, GridPosition>();

  let row = 1;
  let column = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = words[i - 1];

    if (prevWord?.timeline.hasNewLine) {
      row++;
      column = 1;
    } else {
      column++;
    }

    map.set(word.id, {
      row,
      column,
      word,
    });
  }

  return map;
}

export function getWordsByRow(line: Line): Map<number, Word[]> {
  const gridPositions = getWordGridPositions(line);
  return Array.from(gridPositions.values()).reduce<Map<number, Word[]>>(
    (acc, position) => {
      if (!acc.has(position.row)) {
        acc.set(position.row, []);
      }
      acc.get(position.row)?.push(position.word);
      return acc;
    },
    new Map(),
  );
}

export function getRowWords(line: Line, row: number): Word[] {
  const wordsByRow = getWordsByRow(line);
  return wordsByRow.get(row) || [];
}

export function getWordRowPosition(
  line: Line,
  wordID: string,
): number | undefined {
  const gridPositions = getWordGridPositions(line);
  return gridPositions.get(wordID)?.row;
}

export function getMaxRowPosition(line: Line): number {
  const gridPositions = getWordGridPositions(line);
  return Math.max(...Array.from(gridPositions.values()).map((pos) => pos.row));
}

export function getCharPositions(line: Line): Map<string, CharPosition> {
  const chars = getLineWords(line).flatMap((word) => getWordChars(word));
  const allWords = getLineWords(line);
  const wordPositionMap = getWordGridPositions(line);
  const map = new Map<string, CharPosition>();

  for (const char of chars) {
    const word = allWords.find((w) =>
      getWordChars(w).some((c) => c.id === char.id),
    );
    if (!word) {
      throw new Error(`word not found for character ID: ${char.id}`);
    }

    const inLinePosition = chars.findIndex((c) => c.id === char.id) + 1;
    const wordPosition = wordPositionMap.get(word.id);
    if (!wordPosition) {
      throw new Error(`wordPosition not found for word ID: ${word.id}`);
    }

    const sameRowWords = allWords.filter((w) => {
      const pos = wordPositionMap.get(w.id);
      return (
        pos?.row === wordPosition.row && w.timeline.begin < word.timeline.begin
      );
    });

    const charColumnPosition =
      sameRowWords.reduce<number>((sum, w) => {
        return sum + getWordChars(w).length;
      }, 0) + char.position;

    map.set(char.id, {
      row: wordPosition.row,
      column: charColumnPosition,
      inLinePosition,
    });
  }

  return map;
}

export function getWordsByLineIDAndRowPosition(
  lyric: Lyric,
): Map<string, Map<number, Map<number, Word>>> {
  const lines = getLines(lyric);
  const result = new Map<string, Map<number, Map<number, Word>>>();

  for (const line of lines) {
    const gridPositions = getWordGridPositions(line);
    const lineMap = new Map<number, Map<number, Word>>();

    for (const { row, column, word } of gridPositions.values()) {
      if (!lineMap.has(row)) {
        lineMap.set(row, new Map<number, Word>());
      }
      lineMap.get(row)?.set(column, word);
    }

    result.set(line.id, lineMap);
  }

  return result;
}
