import Line, { LineArgs } from './Line';
import { Word } from './Word';

export type ParagraphArgs = {
  lyricID: string;
  position: number;
  timelines: LineArgs['timelines'][];
  tokenizer?: (lineArgs: LineArgs) => Promise<Map<number, LineArgs>>;
};

export class Paragraph {
  id: string;
  lyricID: string;
  lineByPosition: Map<number, Line>;
  position: number;
  begin: number;
  end: number;
  _args: ParagraphArgs;

  constructor(props: ParagraphArgs) {
    this.id = '';
    this.lyricID = props.lyricID;
    this.position = props.position;
    this.begin = 0;
    this.end = 0;
    this.lineByPosition = new Map();
    this._args = props;
  }

  public async init() {
    this.id = `paragraph-${crypto.randomUUID()}`;

    const lineByPosition = this._args.timelines.reduce<
      Array<Promise<Map<number, LineArgs>>>
    >((acc, timelines, index) => {
      const position = index + 1;
      if (this._args.tokenizer) {
        const result = this._args.tokenizer({ position, timelines });
        acc.push(result);
        return acc;
      }

      acc.push(
        new Promise((resolve) => {
          resolve(
            new Map([
              [
                position,
                {
                  position,
                  timelines,
                },
              ],
            ])
          );
        })
      );
      return acc;
    }, []);

    const resolved = await Promise.all(lineByPosition);

    this.lineByPosition = resolved.reduce<Map<number, Line>>(
      (acc, lineByPosition) => {
        Array.from(lineByPosition).forEach(([, args]) => {
          const lastLine = acc.get(acc.size);
          const position = lastLine ? lastLine.position + 1 : acc.size + 1;
          acc.set(
            position,
            new Line({
              position,
              timelines: args.timelines,
            })
          );
        });
        return acc;
      },
      new Map()
    );

    this.begin = this.lineByPosition.get(1)?.begin || 0;
    this.end = this.lineByPosition.get(this.lineByPosition.size)?.end || 0;
    return this;
  }

  public betweenDuration(c: Paragraph): number {
    if (this.id === c.id) {
      throw new Error('Can not compare between the same paragraph');
    }
    return c.begin > this.end ? c.begin - this.end : this.begin - c.end;
  }

  public currentLine(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
      offset: 0,
      equal: false,
    }
  ): Line | undefined {
    const offset = options.offset || 0;
    return Array.from(this.lineByPosition.values()).find((line) =>
      options.equal
        ? line.begin <= now + offset && now + offset <= line.end
        : line.begin < now + offset && now + offset < line.end
    );
  }

  public currentLines(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
      offset: 0,
      equal: false,
    }
  ): Line[] {
    const offset = options.offset || 0;
    return Array.from(this.lineByPosition.values()).filter((line) =>
      options.equal
        ? line.begin <= now + offset && now + offset <= line.end
        : line.begin < now + offset && now + offset < line.end
    );
  }

  public lineAt(position: number): Line | undefined {
    return this.lineByPosition.get(position);
  }

  public words(): Word[] {
    return Array.from(this.lineByPosition.values()).reduce<Word[]>(
      (acc, line) => {
        acc.push(...line.words());
        return acc;
      },
      []
    );
  }

  public allLines(): Line[] {
    return Array.from(this.lineByPosition.values());
  }

  public averageLineDuration(): number {
    const durations = Array.from(this.lineByPosition.values()).map((line) =>
      line.duration()
    );
    return (
      durations.reduce((sum, duration) => sum + duration, 0) / durations.length
    );
  }

  public duration(): number {
    if (this.begin >= this.end) {
      throw new Error('Can not calculate duration of a invalid paragraph');
    }
    return this.end - this.begin;
  }

  public voids(): { begin: number; end: number; duration: number }[] {
    const words = this.words();

    return words.reduce<{ begin: number; end: number; duration: number }[]>(
      (acc, word, index) => {
        const isFirstWord = index === 0;
        const isLastWord = index === words.length - 1;

        if (isFirstWord && word.timeline.begin > this.begin) {
          acc.push({
            begin: this.begin,
            end: word.timeline.begin,
            duration: Number(word.timeline.begin.toFixed(2)),
          });
        }
        if (isLastWord && this.end - word.timeline.end > 0) {
          acc.push({
            begin: word.timeline.end,
            end: this.end,
            duration: Number((this.end - word.timeline.end).toFixed(2)),
          });
        }
        const prevWord = words[index - 1];
        if (prevWord && word.timeline.begin - prevWord.timeline.end > 0) {
          acc.push({
            begin: prevWord.timeline.end,
            end: word.timeline.begin,
            duration: Number(
              (word.timeline.begin - prevWord.timeline.end).toFixed(2)
            ),
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

export default Paragraph;
