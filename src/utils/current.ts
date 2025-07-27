import type { Char, Line, Lyric, Paragraph, TimeOptions, Word } from "../types";
import {
  getCharBegin,
  getCharEnd,
  getLineBegin,
  getLineEnd,
  getLines,
  getLineWords,
  getParagraphBegin,
  getParagraphEnd,
  getParagraphLines,
  getParagraphs,
  getWordBegin,
  getWordChars,
  getWordEnd,
  isCurrentTime,
} from "./helpers";

export function getCurrentParagraph(
  lyric: Lyric,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec, equal: true },
): Paragraph | undefined {
  const offset = options.offset ?? lyric.offsetSec;
  const equal = options.equal ?? true;

  return getParagraphs(lyric).find((paragraph) => {
    const begin = getParagraphBegin(paragraph);
    const end = getParagraphEnd(paragraph);
    return isCurrentTime(begin, end, now, { offset, equal });
  });
}

export function getCurrentLine(
  lyric: Lyric,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec, equal: true },
): Line | undefined {
  const offset = options.offset ?? lyric.offsetSec;
  const equal = options.equal ?? true;

  const currentParagraph = getCurrentParagraph(lyric, now, { offset, equal });
  if (!currentParagraph) return undefined;

  return getParagraphLines(currentParagraph).find((line) => {
    const begin = getLineBegin(line);
    const end = getLineEnd(line);
    return isCurrentTime(begin, end, now, { offset, equal });
  });
}

export function getCurrentWord(
  lyric: Lyric,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec, equal: true },
): Word | undefined {
  const offset = options.offset ?? lyric.offsetSec;
  const equal = options.equal ?? true;

  const currentLine = getCurrentLine(lyric, now, { offset, equal });
  if (!currentLine) return undefined;

  return getLineWords(currentLine)
    .sort((a, b) => getWordBegin(b) - getWordBegin(a))
    .find((word) => {
      const begin = getWordBegin(word);
      const end = getWordEnd(word);
      return isCurrentTime(begin, end, now, { offset, equal });
    });
}

export function getCurrentChar(
  lyric: Lyric,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec, equal: true },
): Char | undefined {
  const offset = options.offset ?? lyric.offsetSec;
  const equal = options.equal ?? true;

  const currentWord = getCurrentWord(lyric, now, { offset, equal });
  if (!currentWord) return undefined;

  return getWordChars(currentWord)
    .sort((a, b) => getCharBegin(b) - getCharBegin(a))
    .find((char) => {
      const begin = getCharBegin(char);
      const end = getCharEnd(char);
      return isCurrentTime(begin, end, now, { offset, equal });
    });
}

export function getCurrentParagraphFromLine(
  line: Line,
  lyric: Lyric,
): Paragraph | undefined {
  return getParagraphs(lyric).find((paragraph) =>
    getParagraphLines(paragraph).some((l) => l.id === line.id),
  );
}

export function getCurrentLineFromWord(
  word: Word,
  lyric: Lyric,
): Line | undefined {
  return getLines(lyric).find((line) =>
    getLineWords(line).some((w) => w.id === word.id),
  );
}

export function getCurrentWordFromChar(
  char: Char,
  lyric: Lyric,
): Word | undefined {
  for (const paragraph of getParagraphs(lyric)) {
    for (const line of getParagraphLines(paragraph)) {
      for (const word of getLineWords(line)) {
        if (getWordChars(word).some((c) => c.id === char.id)) {
          return word;
        }
      }
    }
  }
  return undefined;
}
