import type {
  LineData,
  LyricData,
  ParagraphData,
  TimeOptions,
  WordData,
} from "../types";
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
  lyric: LyricData,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): ParagraphData | undefined {
  const offset = options.offset ?? 0;
  return getParagraphs(lyric).find((p) => getParagraphBegin(p) > now + offset);
}

export function getNextLine(
  lyric: LyricData,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): LineData | undefined {
  const offset = options.offset ?? 0;
  return getLines(lyric).find((l) => getLineBegin(l) > now + offset);
}

export function getNextWord(
  lyric: LyricData,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): WordData | undefined {
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
  lyric: LyricData,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): ParagraphData | undefined {
  const offset = options.offset ?? 0;
  return getParagraphs(lyric)
    .reverse()
    .find((p) => getParagraphEnd(p) < now + offset);
}

export function getPrevLine(
  lyric: LyricData,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): LineData | undefined {
  const offset = options.offset ?? 0;
  return getLines(lyric)
    .reverse()
    .find((l) => getLineEnd(l) < now + offset);
}

export function getPrevWord(
  lyric: LyricData,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): WordData | undefined {
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

export function getFirstWord(line: LineData): WordData | undefined {
  return getLineWords(line)[0];
}

export function getLastWord(line: LineData): WordData | undefined {
  const words = getLineWords(line);
  return words[words.length - 1];
}

export function getLinePositionInLyric(
  line: LineData,
  lyric: LyricData,
): number {
  return getLines(lyric).findIndex((l) => l.id === line.id) + 1;
}

export function getLinePositionInParagraph(
  line: LineData,
  lyric: LyricData,
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
