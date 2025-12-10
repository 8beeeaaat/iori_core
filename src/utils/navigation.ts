import type { Line, Lyric, Paragraph, TimeOptions, Word } from "../types";
import { getCurrentLine } from "./current";
import {
  getLineBegin,
  getLineEnd,
  getLines,
  getParagraphBegin,
  getParagraphEnd,
  getParagraphs,
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
    const nextWordInLine = [...currentLine.words]
      .sort((a, b) => a.timeline.begin - b.timeline.begin)
      .find((word) => word.timeline.begin > now + offset);

    if (nextWordInLine) {
      return nextWordInLine;
    }
  }

  const nextLine = getNextLine(lyric, now, { offset });
  return nextLine ? nextLine.words[0] : undefined;
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
    const prevWordInLine = [...currentLine.words]
      .sort((a, b) => b.timeline.begin - a.timeline.begin)
      .find((word) => word.timeline.end < now + offset);

    if (prevWordInLine) {
      return prevWordInLine;
    }
  }

  const prevLine = getPrevLine(lyric, now, { offset });
  if (prevLine) {
    return prevLine.words[prevLine.words.length - 1];
  }

  return undefined;
}

export function getFirstWord(line: Line): Word | undefined {
  return line.words[0];
}

export function getLastWord(line: Line): Word | undefined {
  return line.words[line.words.length - 1];
}

export function getLinePositionInLyric(line: Line, lyric: Lyric): number {
  return getLines(lyric).findIndex((l) => l.id === line.id) + 1;
}

export function getLinePositionInParagraph(
  line: Line,
  lyric: Lyric,
): number | undefined {
  for (const paragraph of getParagraphs(lyric)) {
    const index = paragraph.lines.findIndex((l) => l.id === line.id);
    if (index !== -1) {
      return index + 1;
    }
  }
  return undefined;
}
