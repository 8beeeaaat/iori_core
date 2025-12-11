/**
 * Editing API
 * Provides editing functionality for Lyric objects
 */

export { mergeLines, mergeWords } from "./merge";
export {
  adjustWordBegin,
  adjustWordEnd,
  adjustWordTiming,
  shiftLines,
  shiftParagraphs,
  shiftRange,
  shiftWords,
} from "./shift";
export type { SplitLineOptions, SplitWordOptions } from "./split";
export { splitLine, splitWord } from "./split";
