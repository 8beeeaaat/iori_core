import type { Char, Line, Lyric, Paragraph, TimeOptions, Word } from "../types";

export function getWords(lyric: Lyric): Word[] {
  return lyric.paragraphs.flatMap((paragraph) =>
    paragraph.lines.flatMap((line) => line.words),
  );
}

export function getLines(lyric: Lyric): Line[] {
  return lyric.paragraphs
    .flatMap((paragraph) => paragraph.lines)
    .sort((a, b) => getLineBegin(a) - getLineBegin(b));
}

export function getParagraphs(lyric: Lyric): Paragraph[] {
  return [...lyric.paragraphs].sort(
    (a, b) => getParagraphBegin(a) - getParagraphBegin(b),
  );
}

export function getWordChars(word: Word): Char[] {
  return [...word.chars];
}

export function getLineChars(line: Line): Char[] {
  return line.words.flatMap((word) => getWordChars(word));
}

export function getLineWords(line: Line): Word[] {
  return [...line.words];
}

export function getParagraphLines(paragraph: Paragraph): Line[] {
  return [...paragraph.lines];
}

export function getCharBegin(char: Char): number {
  return char.begin;
}

export function getCharEnd(char: Char): number {
  return char.end;
}

export function getWordBegin(word: Word): number {
  return word.timeline.begin;
}

export function getWordEnd(word: Word): number {
  return word.timeline.end;
}

export function getLineBegin(line: Line): number {
  return line.words[0]?.timeline.begin || 0;
}

export function getLineEnd(line: Line): number {
  return line.words[line.words.length - 1]?.timeline.end || 0;
}

export function getParagraphBegin(paragraph: Paragraph): number {
  return paragraph.lines[0] ? getLineBegin(paragraph.lines[0]) : 0;
}

export function getParagraphEnd(paragraph: Paragraph): number {
  const lastLine = paragraph.lines[paragraph.lines.length - 1];
  return lastLine ? getLineEnd(lastLine) : 0;
}

export function getCharDuration(char: Char): number {
  const begin = getCharBegin(char);
  const end = getCharEnd(char);
  if (begin >= end) {
    console.error(
      `Cannot calculate duration of invalid char: ${char.id} ${begin}-${end}`,
    );
  }
  return end - begin;
}

export function getWordDuration(word: Word): number {
  const begin = getWordBegin(word);
  const end = getWordEnd(word);
  if (begin >= end) {
    console.error(
      `Cannot calculate duration of invalid word: ${word.id} ${begin}-${end}`,
    );
  }
  return end - begin;
}

export function getLineDuration(line: Line): number {
  const begin = getLineBegin(line);
  const end = getLineEnd(line);
  if (begin >= end) {
    console.error(
      `Cannot calculate duration of invalid line: ${line.id} ${begin}-${end}`,
    );
  }
  return end - begin;
}

export function getParagraphDuration(paragraph: Paragraph): number {
  const begin = getParagraphBegin(paragraph);
  const end = getParagraphEnd(paragraph);
  if (begin >= end) {
    console.error(
      `Cannot calculate duration of invalid paragraph: ${paragraph.id} ${begin}-${end}`,
    );
  }
  return end - begin;
}

export function getWordText(word: Word): string {
  return word.chars.map((char) => char.text).join("");
}

export function getLineText(line: Line): string {
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
  lyric: Lyric,
  position: number,
): Paragraph | undefined {
  return lyric.paragraphs.find((p) => p.position === position);
}

export function findLineAt(
  paragraph: Paragraph,
  position: number,
): Line | undefined {
  return paragraph.lines.find((l) => l.position === position);
}

export function findWordAt(line: Line, position: number): Word | undefined {
  return line.words.find((w) => w.position === position);
}

export function findCharAt(word: Word, position: number): Char | undefined {
  return word.chars.find((c) => c.position === position);
}
