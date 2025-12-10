import type { Char, Line, Lyric, Paragraph, TimeOptions, Word } from "../types";
import {
  getLineBegin,
  getLineEnd,
  getLines,
  getParagraphBegin,
  getParagraphEnd,
  getParagraphs,
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

  return currentParagraph.lines.find((line) => {
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

  return [...currentLine.words]
    .sort((a, b) => b.timeline.begin - a.timeline.begin)
    .find((word) => {
      return isCurrentTime(word.timeline.begin, word.timeline.end, now, { offset, equal });
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

  return [...currentWord.chars]
    .sort((a, b) => b.begin - a.begin)
    .find((char) => {
      return isCurrentTime(char.begin, char.end, now, { offset, equal });
    });
}

export function getCurrentParagraphFromLine(
  line: Line,
  lyric: Lyric,
): Paragraph | undefined {
  return getParagraphs(lyric).find((paragraph) =>
    paragraph.lines.some((l) => l.id === line.id),
  );
}

export function getCurrentLineFromWord(
  word: Word,
  lyric: Lyric,
): Line | undefined {
  return getLines(lyric).find((line) =>
    line.words.some((w) => w.id === word.id),
  );
}

export function getCurrentWordFromChar(
  char: Char,
  lyric: Lyric,
): Word | undefined {
  for (const paragraph of getParagraphs(lyric)) {
    for (const line of paragraph.lines) {
      for (const word of line.words) {
        if (word.chars.some((c) => c.id === char.id)) {
          return word;
        }
      }
    }
  }
  return undefined;
}
