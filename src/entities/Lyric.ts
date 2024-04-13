import { Paragraph } from './Paragraph';
import { Word, WordTimeline } from './Word';

export const TIMING_TYPE = {
  Line: 'Line',
  Word: 'Word',
} as const;
export type TimingType = 'Line' | 'Word';

export type LyricArgs = {
  initID?: boolean;
  resourceID: string;
  timingType: TimingType;
  duration: number;
  timelines: Map<number, Map<number, Map<number, WordTimeline>>>;
};

export class Lyric {
  id: string;
  resourceID: string;
  timingType: TimingType;
  paragraphByPosition: Map<number, Paragraph>;
  duration: number;

  constructor(props: LyricArgs) {
    this.id = props.initID ? `lyric-${crypto.randomUUID()}` : '';
    this.resourceID = props.resourceID;
    this.timingType = props.timingType;
    this.duration = Number(props.duration.toFixed(2));
    this.paragraphByPosition = new Map();

    this.init(props);
  }

  private init(props: LyricArgs) {
    this.paragraphByPosition = Array.from(props.timelines).reduce<
      Map<number, Paragraph>
    >((acc, [position, timelines]) => {
      acc.set(
        position,
        new Paragraph({
          position,
          timelines,
        })
      );
      return acc;
    }, this.paragraphByPosition);
  }

  public paragraphAt(position: number): Paragraph | undefined {
    return this.paragraphByPosition.get(position);
  }

  public allWords(): Word[] {
    return Array.from(this.paragraphByPosition.values()).reduce<Word[]>(
      (acc, paragraph) => {
        acc.push(...paragraph.allWords());
        return acc;
      },
      []
    );
  }

  public voids(): { begin: number; end: number; duration: number }[] {
    const allWords = this.allWords();

    return allWords.reduce<{ begin: number; end: number; duration: number }[]>(
      (acc, word, index) => {
        const isFirstWord = index === 0;
        const isLastWord = index === allWords.length - 1;

        if (isFirstWord && word.begin > 0) {
          acc.push({
            begin: 0,
            end: word.begin,
            duration: Number(word.begin.toFixed(2)),
          });
        }
        if (isLastWord && this.duration - word.end > 0) {
          acc.push({
            begin: word.end,
            end: this.duration,
            duration: Number((this.duration - word.end).toFixed(2)),
          });
        }
        const prevWord = allWords[index - 1];
        if (prevWord && word.begin - prevWord.end > 0) {
          acc.push({
            begin: prevWord.end,
            end: word.begin,
            duration: Number((word.begin - prevWord.end).toFixed(2)),
          });
        }

        return acc;
      },
      []
    );
  }

  public isVoid(now: number): boolean {
    const voids = this.voids();
    return voids.some(({ begin, end }) => now >= begin && now <= end);
  }
}
