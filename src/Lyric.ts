import Line, { LineArgs } from './Line';
import { Paragraph, ParagraphArgs } from './Paragraph';
import { Word } from './Word';

export type LyricArgs = {
  initID?: boolean;
  resourceID: string;
  duration: number;
  timelines: Map<number, ParagraphArgs['timelines']>;
  tokenizer?: (lineArgs: LineArgs) => LineArgs;
};

export class Lyric {
  id: string;
  resourceID: string;
  paragraphByPosition: Map<number, Paragraph>;
  duration: number;

  constructor(props: LyricArgs) {
    this.id = props.initID ? `lyric-${crypto.randomUUID()}` : '';
    this.resourceID = props.resourceID;
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
          tokenizer: props.tokenizer,
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

  public allLines(): Line[] {
    return Array.from(this.paragraphByPosition.values()).reduce<Line[]>(
      (acc, paragraph) => {
        acc.push(...paragraph.allLines());
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

export default Lyric;
