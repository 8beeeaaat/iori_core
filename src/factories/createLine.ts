import type { WordTimeline } from "../Constants";
import type { LineData, WordData } from "../types";
import { createWord } from "./createWord";

export type CreateLineArgs = {
  position: number;
  timelines: WordTimeline[];
  jointNearWord?: boolean;
};

function confirmJointNearWord(
  timeline: WordTimeline,
  nextTimeline: WordTimeline | undefined,
  lastWord: WordData | undefined,
  jointNearWord: boolean,
): { isJoint: boolean; hasWhitespace: boolean } | undefined {
  const isWhitespace = /^\s+$/.test(timeline.text);
  if (isWhitespace) {
    return undefined;
  }

  const nextIsWhitespace = nextTimeline
    ? /^\s+$/.test(nextTimeline.text)
    : false;
  const hasWhitespace = timeline.hasWhitespace || nextIsWhitespace;

  if (jointNearWord !== false) {
    if (
      lastWord &&
      lastWord.timeline.end - timeline.begin <= 0.1 &&
      !lastWord.timeline.hasNewLine &&
      !lastWord.timeline.hasWhitespace
    ) {
      return { isJoint: true, hasWhitespace };
    }
  }
  return { isJoint: false, hasWhitespace };
}

export function createLine(args: CreateLineArgs): LineData {
  const id = `line-${crypto.randomUUID()}`;
  const sortedTimelines = args.timelines.sort((a, b) => a.begin - b.begin);

  const words: WordData[] = [];

  for (let index = 0; index < sortedTimelines.length; index++) {
    const timeline = sortedTimelines[index];
    const nextTimeline = sortedTimelines[index + 1];
    const lastWord = words[words.length - 1];

    const jointResult = confirmJointNearWord(
      timeline,
      nextTimeline,
      lastWord,
      args.jointNearWord === true,
    );

    if (!jointResult) {
      continue;
    }

    const { isJoint, hasWhitespace } = jointResult;

    if (lastWord && isJoint) {
      const updatedWord = createWord({
        lineID: id,
        position: words.length,
        timeline: {
          wordID: lastWord.id,
          begin: lastWord.timeline.begin,
          end: timeline.end,
          text: lastWord.timeline.text + timeline.text,
          hasNewLine: timeline.hasNewLine === true,
          hasWhitespace,
        },
      });
      words[words.length - 1] = updatedWord;
    } else {
      const word = createWord({
        lineID: id,
        position: words.length + 1,
        timeline: {
          ...timeline,
          hasWhitespace,
        },
      });
      words.push(word);
    }
  }

  return Object.freeze({
    id,
    position: args.position,
    words,
  });
}
