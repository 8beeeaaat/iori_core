import type { Line, Lyric, Paragraph, TimeOptions, Word } from "../types";
import { getCurrentLine } from "./current";
import {
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
} from "./helpers";

export function getNextParagraph(
  lyric: Lyric,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): Paragraph | undefined {
  const offset = options.offset ?? 0;
  return getParagraphs(lyric).find((p) => getParagraphBegin(p) > now + offset);
}

export function getNextLine(
  lyric: Lyric,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): Line | undefined {
  const offset = options.offset ?? 0;
  return getLines(lyric).find((l) => getLineBegin(l) > now + offset);
}

export function getNextWord(
  lyric: Lyric,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): Word | undefined {
  const offset = options.offset ?? 0;
  const currentLine = getCurrentLine(lyric, now);

  if (currentLine) {
    const nextWordInLine = getLineWords(currentLine)
      .sort((a, b) => getWordBegin(a) - getWordBegin(b))
      .find((word) => getWordBegin(word) > now + offset);

    if (nextWordInLine) {
      return nextWordInLine;
    }
  }

  const nextLine = getNextLine(lyric, now, { offset });
  return nextLine ? getLineWords(nextLine)[0] : undefined;
}

export function getPrevParagraph(
  lyric: Lyric,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): Paragraph | undefined {
  const offset = options.offset ?? 0;
  return getParagraphs(lyric)
    .reverse()
    .find((p) => getParagraphEnd(p) < now + offset);
}

export function getPrevLine(
  lyric: Lyric,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): Line | undefined {
  const offset = options.offset ?? 0;
  return getLines(lyric)
    .reverse()
    .find((l) => getLineEnd(l) < now + offset);
}

export function getPrevWord(
  lyric: Lyric,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): Word | undefined {
  const offset = options.offset ?? 0;
  const currentLine = getCurrentLine(lyric, now);

  if (currentLine) {
    const prevWordInLine = getLineWords(currentLine)
      .sort((a, b) => getWordBegin(b) - getWordBegin(a))
      .find((word) => getWordEnd(word) < now + offset);

    if (prevWordInLine) {
      return prevWordInLine;
    }
  }

  const prevLine = getPrevLine(lyric, now, { offset });
  if (prevLine) {
    const words = getLineWords(prevLine);
    return words[words.length - 1];
  }

  return undefined;
}

export function getFirstWord(line: Line): Word | undefined {
  return getLineWords(line)[0];
}

export function getLastWord(line: Line): Word | undefined {
  const words = getLineWords(line);
  return words[words.length - 1];
}

export function getLinePositionInLyric(line: Line, lyric: Lyric): number {
  return getLines(lyric).findIndex((l) => l.id === line.id) + 1;
}

export function getLinePositionInParagraph(
  line: Line,
  lyric: Lyric,
): number | undefined {
  for (const paragraph of getParagraphs(lyric)) {
    const lines = getParagraphLines(paragraph);
    const index = lines.findIndex((l) => l.id === line.id);
    if (index !== -1) {
      return index + 1;
    }
  }
  return undefined;
}
