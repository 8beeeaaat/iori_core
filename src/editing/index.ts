/**
 * Editing API
 * Provides editing functionality for Lyric objects
 */

export { mergeLines, mergeWords } from "./merge";
export { shiftLines, shiftParagraphs, shiftRange, shiftWords } from "./shift";
export { splitLine, splitWord } from "./split";
export type { SplitLineOptions, SplitWordOptions } from "./split";

