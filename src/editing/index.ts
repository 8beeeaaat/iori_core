/**
 * Editing API
 * Lyricオブジェクトの編集機能を提供
 */

export { mergeLines, mergeWords } from "./merge";
export { shiftLines, shiftParagraphs, shiftRange, shiftWords } from "./shift";
export type { SplitLineOptions, SplitWordOptions } from "./split";
export { splitLine, splitWord } from "./split";
