import { createLyric } from "../factories/createLyric";
import type {
  FunctionalLyricUpdateArgs,
  LyricData,
  WordTimeline,
} from "../types";

export async function updateLyric(
  lyric: LyricData,
  args: FunctionalLyricUpdateArgs,
): Promise<LyricData> {
  const resourceID = args.resourceID || lyric.resourceID;
  const duration = args.duration
    ? Number(args.duration.toFixed(2))
    : lyric.duration;
  const offsetSec =
    args.offsetSec !== undefined ? args.offsetSec : lyric.offsetSec;

  if (args.timelines === undefined) {
    return {
      ...lyric,
      resourceID,
      duration,
      offsetSec,
    };
  }

  return await createLyric({
    id: lyric.id,
    resourceID,
    duration,
    timelines: args.timelines,
    offsetSec,
  });
}

export function getTimelines(lyric: LyricData): WordTimeline[][][] {
  return lyric.paragraphs.map((paragraph) =>
    paragraph.lines.map((line) => line.words.map((word) => word.timeline)),
  );
}

export function getTimelinesByLine(lyric: LyricData): WordTimeline[] {
  return lyric.paragraphs.flatMap((paragraph) =>
    paragraph.lines.map((line) => {
      const firstWord = line.words[0];
      if (!firstWord) {
        throw new Error("firstWord is undefined");
      }
      const lastWord = line.words[line.words.length - 1];
      if (!lastWord) {
        throw new Error("lastWord is undefined");
      }
      return {
        wordID: firstWord.id,
        begin: firstWord.timeline.begin,
        end: lastWord.timeline.end,
        text: line.words.map((w) => w.timeline.text).join(""),
        hasNewLine: lastWord.timeline.hasNewLine,
        hasWhitespace: lastWord.timeline.hasWhitespace,
      };
    }),
  );
}
