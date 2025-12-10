import { CHAR_TYPES } from "../Constants";
import type {
  Char,
  Line,
  Lyric,
  LyricSummary,
  Paragraph,
  TimeOptions,
  VoidPeriod,
  Word,
} from "../types";
import {
  getCurrentChar,
  getCurrentLine,
  getCurrentParagraph,
  getCurrentWord,
} from "./current";
import {
  getLineBegin,
  getLineDuration,
  getLineEnd,
  getLines,
  getParagraphDuration,
  getParagraphEnd,
  getParagraphs,
  getWordDuration,
  getWords,
} from "./helpers";
import {
  getNextLine,
  getNextParagraph,
  getNextWord,
  getPrevLine,
  getPrevParagraph,
  getPrevWord,
} from "./navigation";

export function calculateSpeed(
  items: { duration: () => number; chars?: () => Char[] }[],
): number {
  const speeds = items.map((item) => {
    const duration = item.duration();
    if (item.chars) {
      const charCount = item.chars().reduce((acc, char) => {
        if (char.type === CHAR_TYPES.WHITESPACE) return acc;
        return (
          acc +
          (char.type === CHAR_TYPES.ALPHABET || char.type === CHAR_TYPES.NUMBER
            ? 0.5
            : 1)
        );
      }, 0);
      return charCount / duration;
    }
    return 0;
  });

  speeds.sort((a, b) => a - b);
  const half = Math.floor(speeds.length / 2);
  return Number.parseFloat(
    (speeds.length % 2
      ? speeds[half]
      : (speeds[half - 1] + speeds[half]) / 2
    ).toFixed(2),
  );
}

export function getWordSpeed(word: Word): number {
  const duration = getWordDuration(word);
  return (
    word.chars.reduce((acc, char) => {
      if (char.type === CHAR_TYPES.WHITESPACE) return acc;
      return (
        acc +
        (char.type === CHAR_TYPES.ALPHABET || char.type === CHAR_TYPES.NUMBER
          ? 0.5
          : 1)
      );
    }, 0) / duration
  );
}

export function getLineSpeed(line: Line): number {
  const words = line.words.map((word) => ({
    duration: () => getWordDuration(word),
    chars: () => [...word.chars],
  }));
  return calculateSpeed(words);
}

export function getParagraphSpeed(paragraph: Paragraph): number {
  const lines = paragraph.lines.map((line) => ({
    duration: () => getLineDuration(line),
    chars: () => line.words.flatMap((word) => [...word.chars]),
  }));
  return calculateSpeed(lines);
}

export function getLyricSpeed(lyric: Lyric): number {
  const paragraphs = getParagraphs(lyric).map((paragraph) => ({
    duration: () => getParagraphDuration(paragraph),
    chars: () =>
      paragraph.lines.flatMap((line) =>
        line.words.flatMap((word) => [...word.chars]),
      ),
  }));
  return calculateSpeed(paragraphs);
}

export function getVoidPeriods(lyric: Lyric): VoidPeriod[] {
  const words = getWords(lyric);

  return words.reduce<VoidPeriod[]>((acc, word, index) => {
    const isFirstWord = index === 0;
    const isLastWord = index === words.length - 1;

    if (isFirstWord && word.timeline.begin > 0) {
      acc.push({
        begin: 0,
        end: word.timeline.begin,
        duration: Number(word.timeline.begin.toFixed(2)),
      });
    }

    if (isLastWord && lyric.duration - word.timeline.end > 0) {
      acc.push({
        begin: word.timeline.end,
        end: lyric.duration,
        duration: Number((lyric.duration - word.timeline.end).toFixed(2)),
      });
    }

    const prevWord = words[index - 1];
    if (prevWord && word.timeline.begin - prevWord.timeline.end > 0) {
      acc.push({
        begin: prevWord.timeline.end,
        end: word.timeline.begin,
        duration: Number(
          (word.timeline.begin - prevWord.timeline.end).toFixed(2),
        ),
      });
    }

    return acc;
  }, []);
}

export function isVoidTime(lyric: Lyric, now: number): boolean {
  const voids = getVoidPeriods(lyric);
  return voids.some(({ begin, end }) => now >= begin && now <= end);
}

export function getParagraphAverageLineDuration(paragraph: Paragraph): number {
  const durations = paragraph.lines.map((line) => getLineDuration(line));
  return (
    durations.reduce((sum, duration) => sum + duration, 0) / durations.length
  );
}

export function getCurrentSummary(
  lyric: Lyric,
  now: number,
  options: TimeOptions = { offset: lyric.offsetSec },
): LyricSummary {
  const currentParagraph = getCurrentParagraph(lyric, now, options);
  const nextParagraph = getNextParagraph(lyric, now, options);
  const prevParagraph = getPrevParagraph(lyric, now, options);
  const allLines = getLines(lyric);
  const currentLine = getCurrentLine(lyric, now, options);

  const lastLineIndexInParagraph = currentParagraph
    ? currentParagraph.lines.length - 1
    : undefined;

  const nextLine = getNextLine(lyric, now, options);
  const nextWord = getNextWord(lyric, now, options);
  const prevLine = getPrevLine(lyric, now, options);
  const prevWord = getPrevWord(lyric, now, options);
  const currentWord = getCurrentWord(lyric, now, options);
  const currentChar = getCurrentChar(lyric, now, options);

  const beforeCurrentTimeDiff =
    currentLine && prevLine
      ? getLineBegin(currentLine) - getLineEnd(prevLine)
      : undefined;

  const isCurrentParagraphAverageTimeDiff = currentParagraph
    ? getParagraphAverageLineDuration(currentParagraph) < 1.5
    : undefined;

  const isConnected =
    isCurrentParagraphAverageTimeDiff === true &&
    beforeCurrentTimeDiff !== undefined &&
    beforeCurrentTimeDiff < 0.1;

  const isParagraphFinishMotion = currentParagraph
    ? getParagraphEnd(currentParagraph) < now
    : true;

  const nextWaitingTime = nextLine ? getLineBegin(nextLine) - now : undefined;
  const lastLineIndex = allLines.length - 1;

  const lyricTextPerSecond = getLyricSpeed(lyric);
  const paragraphTextPerSecond = currentParagraph
    ? getParagraphSpeed(currentParagraph)
    : undefined;
  const lineTextPerSecond = currentLine ? getLineSpeed(currentLine) : undefined;

  return {
    currentChar,
    currentLine,
    currentParagraph,
    currentWord,
    isConnected,
    isParagraphFinishMotion,
    lastLineIndex,
    lastLineIndexInParagraph,
    nextLine,
    nextWord,
    nextParagraph,
    nextWaitingTime,
    prevLine,
    prevWord,
    prevParagraph,
    lyricTextPerSecond,
    paragraphTextPerSecond,
    lineTextPerSecond,
  };
}
