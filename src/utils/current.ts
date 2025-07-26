import type {
  CharData,
  LineData,
  LyricData,
  ParagraphData,
  TimeOptions,
  WordData,
} from "../types";
import {
  getCharBegin,
  getCharEnd,
  getChars,
  getLineBegin,
  getLineEnd,
  getLines,
  getLineWords,
  getParagraphBegin,
  getParagraphEnd,
  getParagraphLines,
  getParagraphs,
  getWordBegin,
  getWordEnd,
  isCurrentTime,
} from "./helpers";

export function getCurrentParagraph(
  lyric: LyricData,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec, equal: true },
): ParagraphData | undefined {
  const offset = options.offset ?? lyric.offsetSec;
  const equal = options.equal ?? true;

  return getParagraphs(lyric).find((paragraph) => {
    const begin = getParagraphBegin(paragraph);
    const end = getParagraphEnd(paragraph);
    return isCurrentTime(begin, end, now, { offset, equal });
  });
}

export function getCurrentLine(
  lyric: LyricData,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec, equal: true },
): LineData | undefined {
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
  lyric: LyricData,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec, equal: true },
): WordData | undefined {
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
  lyric: LyricData,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec, equal: true },
): CharData | undefined {
  const offset = options.offset ?? lyric.offsetSec;
  const equal = options.equal ?? true;

  const currentWord = getCurrentWord(lyric, now, { offset, equal });
  if (!currentWord) return undefined;

  return getChars(currentWord)
    .sort((a, b) => getCharBegin(b) - getCharBegin(a))
    .find((char) => {
      const begin = getCharBegin(char);
      const end = getCharEnd(char);
      return isCurrentTime(begin, end, now, { offset, equal });
    });
}

export function getCurrentParagraphFromLine(
  line: LineData,
  lyric: LyricData,
): ParagraphData | undefined {
  return getParagraphs(lyric).find((paragraph) =>
    getParagraphLines(paragraph).some((l) => l.id === line.id),
  );
}

export function getCurrentLineFromWord(
  word: WordData,
  lyric: LyricData,
): LineData | undefined {
  return getLines(lyric).find((line) =>
    getLineWords(line).some((w) => w.id === word.id),
  );
}

export function getCurrentWordFromChar(
  char: CharData,
  lyric: LyricData,
): WordData | undefined {
  for (const paragraph of getParagraphs(lyric)) {
    for (const line of getParagraphLines(paragraph)) {
      for (const word of getLineWords(line)) {
        if (getChars(word).some((c) => c.id === char.id)) {
          return word;
        }
      }
    }
  }
  return undefined;
}
