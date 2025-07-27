import type { CharType, WordTimeline } from "./Constants";

export type { WordTimeline } from "./Constants";

export type CharData = {
  readonly id: string;
  readonly wordID: string;
  readonly text: string;
  readonly type: CharType;
  readonly position: number;
  readonly begin: number;
  readonly end: number;
};

export type WordData = {
  readonly id: string;
  readonly lineID: string;
  readonly position: number;
  readonly timeline: WordTimeline;
  readonly chars: readonly CharData[];
};

export type LineData = {
  readonly id: string;
  readonly position: number;
  readonly words: readonly WordData[];
};

export type ParagraphData = {
  readonly id: string;
  readonly position: number;
  readonly lines: readonly LineData[];
};

export type LyricData = {
  readonly id: string;
  readonly resourceID: string;
  readonly duration: number;
  readonly offsetSec: number;
  readonly paragraphs: readonly ParagraphData[];
};

export type TimeOptions = {
  offset?: number;
  equal?: boolean;
};

export type GridPosition = {
  row: number;
  column: number;
  word: WordData;
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
  chars: CharData[];
};

export type LyricSummary = {
  currentChar?: CharData;
  currentLine?: LineData;
  currentParagraph?: ParagraphData;
  currentWord?: WordData;
  isConnected: boolean;
  isParagraphFinishMotion: boolean;
  lastLineIndex?: number;
  lastLineIndexInParagraph?: number;
  nextLine?: LineData;
  nextWord?: WordData;
  nextParagraph?: ParagraphData;
  nextWaitingTime?: number;
  prevLine?: LineData;
  prevParagraph?: ParagraphData;
  prevWord?: WordData;
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
