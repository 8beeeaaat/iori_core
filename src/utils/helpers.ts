import type {
  CharData,
  LineData,
  LyricData,
  ParagraphData,
  TimeOptions,
  WordData,
} from "../types";

export function getWords(lyric: LyricData): WordData[] {
  return lyric.paragraphs.flatMap((paragraph) =>
    paragraph.lines.flatMap((line) => line.words),
  );
}

export function getLines(lyric: LyricData): LineData[] {
  return lyric.paragraphs
    .flatMap((paragraph) => paragraph.lines)
    .sort((a, b) => getLineBegin(a) - getLineBegin(b));
}

export function getParagraphs(lyric: LyricData): ParagraphData[] {
  return [...lyric.paragraphs].sort(
    (a, b) => getParagraphBegin(a) - getParagraphBegin(b),
  );
}

export function getChars(word: WordData): CharData[] {
  return [...word.chars];
}

export function getLineWords(line: LineData): WordData[] {
  return [...line.words];
}

export function getParagraphLines(paragraph: ParagraphData): LineData[] {
  return [...paragraph.lines];
}

export function getCharBegin(char: CharData): number {
  return char.begin;
}

export function getCharEnd(char: CharData): number {
  return char.end;
}

export function getWordBegin(word: WordData): number {
  return word.timeline.begin;
}

export function getWordEnd(word: WordData): number {
  return word.timeline.end;
}

export function getLineBegin(line: LineData): number {
  return line.words[0]?.timeline.begin || 0;
}

export function getLineEnd(line: LineData): number {
  return line.words[line.words.length - 1]?.timeline.end || 0;
}

export function getParagraphBegin(paragraph: ParagraphData): number {
  return paragraph.lines[0] ? getLineBegin(paragraph.lines[0]) : 0;
}

export function getParagraphEnd(paragraph: ParagraphData): number {
  const lastLine = paragraph.lines[paragraph.lines.length - 1];
  return lastLine ? getLineEnd(lastLine) : 0;
}

export function getWordDuration(word: WordData): number {
  const begin = getWordBegin(word);
  const end = getWordEnd(word);
  if (begin >= end) {
    throw new Error(
      `Cannot calculate duration of invalid word: ${word.id} ${begin}-${end}`,
    );
  }
  return end - begin;
}

export function getLineDuration(line: LineData): number {
  const begin = getLineBegin(line);
  const end = getLineEnd(line);
  if (begin >= end) {
    throw new Error(
      `Cannot calculate duration of invalid line: ${line.id} ${begin}-${end}`,
    );
  }
  return end - begin;
}

export function getParagraphDuration(paragraph: ParagraphData): number {
  const begin = getParagraphBegin(paragraph);
  const end = getParagraphEnd(paragraph);
  if (begin >= end) {
    throw new Error("Cannot calculate duration of invalid paragraph");
  }
  return end - begin;
}

export function getWordText(word: WordData): string {
  return word.chars.map((char) => char.text).join("");
}

export function getLineText(line: LineData): string {
  return line.words
    .map(
      (word) =>
        `${getWordText(word)}${!word.timeline.hasNewLine && word.timeline.hasWhitespace ? " " : ""}${
          word.timeline.hasNewLine ? "\n" : ""
        }`,
    )
    .join("");
}

export function isCurrentTime(
  begin: number,
  end: number,
  now: number,
  options: TimeOptions = {},
): boolean {
  const offset = options.offset ?? 0;
  const equal = options.equal ?? true;

  return equal
    ? begin <= now + offset && now + offset <= end
    : begin < now + offset && now + offset < end;
}

export function findParagraphAt(
  lyric: LyricData,
  position: number,
): ParagraphData | undefined {
  return lyric.paragraphs.find((p) => p.position === position);
}

export function findLineAt(
  paragraph: ParagraphData,
  position: number,
): LineData | undefined {
  return paragraph.lines.find((l) => l.position === position);
}

export function findWordAt(
  line: LineData,
  position: number,
): WordData | undefined {
  return line.words.find((w) => w.position === position);
}

export function findCharAt(
  word: WordData,
  position: number,
): CharData | undefined {
  return word.chars.find((c) => c.position === position);
}
