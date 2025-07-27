import type { WordTimeline } from "../Constants";
import type { Paragraph } from "../types";
import { createLine } from "./createLine";

export type CreateParagraphArgs = {
  position: number;
  timelines: WordTimeline[][];
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
};

export async function createParagraph(
  args: CreateParagraphArgs,
): Promise<Paragraph> {
  const id = `paragraph-${crypto.randomUUID()}`;

  let timelines = args.timelines;

  if (args.paragraphTokenizer) {
    timelines = await args.paragraphTokenizer(timelines);
  }

  const mergedTimelines = timelines.reduce<WordTimeline[][]>(
    (acc, timeline) => {
      const lastTimelines = acc[acc.length - 1];
      const last = lastTimelines
        ? lastTimelines[lastTimelines.length - 1]
        : null;
      const thisFirst = timeline[0];

      if (!thisFirst) {
        console.error("thisFirst is undefined", timelines, timeline);
        return acc;
      }

      if (
        last &&
        (last.end > thisFirst.begin ||
          (last.end === thisFirst.begin && last.text.length < 6))
      ) {
        last.end = thisFirst.end;
        last.text += ` ${thisFirst.text}`;
        return acc;
      }

      acc.push(timeline);
      return acc;
    },
    [],
  );

  const lineCreateArgsPromises = mergedTimelines.map(
    async (timeline, index) => {
      const position = index + 1;

      if (args.lineTokenizer) {
        return await args.lineTokenizer({ position, timelines: timeline });
      }

      return new Map([
        [
          position,
          {
            jointNearWord: true,
            position,
            timelines: timeline,
          },
        ],
      ]);
    },
  );

  const resolvedArgsArray = await Promise.all(lineCreateArgsPromises);

  const lines = [];

  for (const lineByPosition of resolvedArgsArray) {
    for (const [, lineArgs] of lineByPosition) {
      const position = lines.length + 1;
      const line = createLine({
        ...lineArgs,
        position,
      });
      lines.push(line);
    }
  }

  return Object.freeze({
    id,
    position: args.position,
    lines,
  });
}
