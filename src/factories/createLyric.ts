import type { LyricCreateArgs, LyricData } from "../types";
import { createParagraph } from "./createParagraph";

export async function createLyric(args: LyricCreateArgs): Promise<LyricData> {
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

  return Object.freeze({
    id,
    resourceID: args.resourceID,
    duration: Number(args.duration.toFixed(2)),
    offsetSec: args.offsetSec ?? 0,
    paragraphs,
  });
}
