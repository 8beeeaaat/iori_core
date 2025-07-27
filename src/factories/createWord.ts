import type { WordTimeline } from "../Constants";
import type { Word } from "../types";
import { createChar } from "./createChar";

export type CreateWordArgs = {
  lineID: string;
  position: number;
  timeline: WordTimeline | Omit<WordTimeline, "wordID">;
};

function isWordTimeline(
  timeline: WordTimeline | Omit<WordTimeline, "wordID">,
): timeline is WordTimeline {
  return (timeline as WordTimeline).wordID !== undefined;
}

export function createWord(args: CreateWordArgs): Word {
  const id = isWordTimeline(args.timeline)
    ? args.timeline.wordID
    : `word-${crypto.randomUUID()}`;

  const timeline: WordTimeline = {
    ...args.timeline,
    wordID: id,
    hasNewLine: args.timeline.hasNewLine ?? false,
    hasWhitespace: args.timeline.hasWhitespace ?? false,
  };

  const charTexts = timeline.text.split("");
  const wordDuration = timeline.end - timeline.begin;
  const durationByChar = wordDuration / charTexts.length;

  const chars = charTexts.map((char, index) => {
    const position = index + 1;
    return createChar({
      wordID: id,
      position,
      text: char,
      begin: timeline.begin + index * durationByChar,
      end: timeline.begin + position * durationByChar,
    });
  });

  return Object.freeze({
    id,
    lineID: args.lineID,
    position: args.position,
    timeline,
    chars,
  });
}
