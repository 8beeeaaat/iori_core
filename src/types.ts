import type { CharType, WordTimeline } from "./Constants";

export type { WordTimeline } from "./Constants";

export type Char = {
  readonly id: string;
  readonly wordID: string;
  readonly text: string;
  readonly type: CharType;
  readonly position: number;
  readonly begin: number;
  readonly end: number;
};

export type Word = {
  readonly id: string;
  readonly lineID: string;
  readonly position: number;
  readonly timeline: WordTimeline;
  readonly chars: readonly Char[];
};

export type Line = {
  readonly id: string;
  readonly position: number;
  readonly words: readonly Word[];
};

export type Paragraph = {
  readonly id: string;
  readonly position: number;
  readonly lines: readonly Line[];
};

export type Lyric = {
  readonly id: string;
  readonly resourceID: string;
  readonly duration: number;
  readonly offsetSec: number;
  readonly paragraphs: readonly Paragraph[];
};

export type TimeOptions = {
  offset?: number;
  equal?: boolean;
};

export type GridPosition = {
  row: number;
  column: number;
  word: Word;
};

export type CharPosition = {
  row: number;
  column: number;
  inLinePosition: number;
};

export type FunctionalRowStatus = {
  wordIDs: string[];
  isCurrentRow: boolean;
  isPrevRow: boolean;
  isNextRow: boolean;
  chars: Char[];
};

export type LyricSummary = {
  currentChar?: Char;
  currentLine?: Line;
  currentParagraph?: Paragraph;
  currentWord?: Word;
  isConnected: boolean;
  isParagraphFinishMotion: boolean;
  lastLineIndex?: number;
  lastLineIndexInParagraph?: number;
  nextLine?: Line;
  nextWord?: Word;
  nextParagraph?: Paragraph;
  nextWaitingTime?: number;
  prevLine?: Line;
  prevParagraph?: Paragraph;
  prevWord?: Word;
  lyricTextPerSecond?: number;
  paragraphTextPerSecond?: number;
  lineTextPerSecond?: number;
};

export type VoidPeriod = {
  begin: number;
  end: number;
  duration: number;
};

export type LyricCreateArgs = {
  initID?: boolean;
  id?: string;
  resourceID: string;
  duration: number;
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

export type LyricUpdateArgs = {
  resourceID?: string;
  duration?: number;
  timelines?: WordTimeline[][][];
  offsetSec?: number;
};
