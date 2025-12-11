import type {
  Line,
  Lyric,
  LyricIndex,
  Paragraph,
  Word,
  WordTimeline,
} from "../types";
import { createParagraph } from "./createParagraph";

export type CreateLyricArgs = {
  initID?: boolean;
  id?: string;
  resourceID: string;
  timelines: WordTimeline[][][];
  lineTokenizer?: (lineArgs: {
    position: number;
    timelines: WordTimeline[];
  }) => Promise<
    Map<
      number,
      { position: number; timelines: WordTimeline[]; jointNearWord?: boolean }
    >
  >;
  paragraphTokenizer?: (
    timelines: WordTimeline[][],
  ) => Promise<WordTimeline[][]>;
  offsetSec?: number;
};

/**
 * Calculate duration from timelines (last end - first begin)
 * Returns 0 if timelines is empty
 */
function calculateDuration(timelines: WordTimeline[][][]): number {
  const allWords = timelines.flat(2);
  if (allWords.length === 0) return 0;

  const firstWord = allWords[0];
  const lastWord = allWords[allWords.length - 1];
  return Number((lastWord.end - firstWord.begin).toFixed(2));
}

/**
 * Build LyricIndex
 */
function buildIndex(paragraphs: readonly Paragraph[]): LyricIndex {
  const wordByCharId = new Map<string, Word>();
  const lineByWordId = new Map<string, Line>();
  const paragraphByLineId = new Map<string, Paragraph>();
  const wordById = new Map<string, Word>();
  const lineById = new Map<string, Line>();
  const paragraphById = new Map<string, Paragraph>();

  for (const paragraph of paragraphs) {
    paragraphById.set(paragraph.id, paragraph);

    for (const line of paragraph.lines) {
      lineById.set(line.id, line);
      paragraphByLineId.set(line.id, paragraph);

      for (const word of line.words) {
        wordById.set(word.id, word);
        lineByWordId.set(word.id, line);

        for (const char of word.chars) {
          wordByCharId.set(char.id, word);
        }
      }
    }
  }

  return Object.freeze({
    wordByCharId,
    lineByWordId,
    paragraphByLineId,
    wordById,
    lineById,
    paragraphById,
  });
}

export async function createLyric(args: CreateLyricArgs): Promise<Lyric> {
  const id = args.id
    ? args.id
    : args.initID
      ? `lyric-${crypto.randomUUID()}`
      : "";

  const paragraphPromises = args.timelines.map(async (timelines, index) => {
    const position = index + 1;
    return await createParagraph({
      position,
      timelines,
      lineTokenizer: args.lineTokenizer,
      paragraphTokenizer: args.paragraphTokenizer,
    });
  });

  const paragraphs = await Promise.all(paragraphPromises);
  const _index = buildIndex(paragraphs);
  const duration = calculateDuration(args.timelines);

  return Object.freeze({
    id,
    resourceID: args.resourceID,
    duration,
    offsetSec: args.offsetSec ?? 0,
    paragraphs,
    _index,
  });
}
