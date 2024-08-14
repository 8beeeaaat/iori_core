import Line, { LineCreateArgs, LineUpdateArgs } from './Line';
import { Word } from './Word';

export type ParagraphCreateArgs = {
  lyricID: string;
  position: number;
  timelines: LineCreateArgs['timelines'][];
  tokenizer?: (
    lineArgs: LineCreateArgs
  ) => Promise<Map<number, LineCreateArgs>>;
};

export type ParagraphUpdateArgs = {
  position: number;
  timelines: LineUpdateArgs['timelines'][];
  tokenizer?: (
    lineArgs: LineUpdateArgs
  ) => Promise<Map<number, LineUpdateArgs>>;
};

export class Paragraph {
  id: string;
  lyricID: string;
  lineByPosition: Map<number, Line>;
  position: number;
  _args: ParagraphCreateArgs;

  constructor(props: ParagraphCreateArgs) {
    this.id = '';
    this.lyricID = props.lyricID;
    this.position = props.position;
    this.lineByPosition = new Map();
    this._args = props;
  }

  public async init() {
    this.id = `paragraph-${crypto.randomUUID()}`;

    const lineCreateArgsByPosition = this._args.timelines.reduce<
      Array<Promise<Map<number, LineCreateArgs>>>
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
                  jointNearWord: true,
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

    const resolved = await Promise.all(lineCreateArgsByPosition);

    this.lineByPosition = resolved.reduce<Map<number, Line>>(
      (acc, lineByPosition) => {
        Array.from(lineByPosition).forEach(([, args]) => {
          const lastLine = acc.get(acc.size);
          const position = lastLine ? lastLine.position + 1 : acc.size + 1;
          acc.set(
            position,
            new Line({
              ...args,
              position,
            })
          );
        });
        return acc;
      },
      new Map()
    );

    return this;
  }

  public async update(props: ParagraphUpdateArgs) {
    this.position = props.position;

    const lineUpdateCreateArgsByPosition = props.timelines.reduce<
      Array<Promise<Map<number, LineUpdateArgs>>>
    >((acc, timelines, index) => {
      const position = index + 1;
      if (props.tokenizer) {
        const result = props.tokenizer({ position, timelines });
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
                  jointNearWord: true,
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

    const resolved = await Promise.all(lineUpdateCreateArgsByPosition);

    this.lineByPosition = resolved.reduce<Map<number, Line>>(
      (acc, lineByPosition) => {
        Array.from(lineByPosition).forEach(([, args]) => {
          const lastLine = acc.get(acc.size);
          const position = lastLine ? lastLine.position + 1 : acc.size + 1;
          const currentLine = this.lineByPosition.get(position);
          if (!currentLine) {
            acc.set(
              position,
              new Line({
                ...args,
                position,
              })
            );
            return;
          }
          acc.set(position, currentLine.update(args));
        });
        return acc;
      },
      new Map()
    );

    return this;
  }

  public begin(): number {
    return this.lineByPosition.get(1)?.begin() || 0;
  }

  public end(): number {
    return this.lineByPosition.get(this.lineByPosition.size)?.end() || 0;
  }

  public betweenDuration(c: Paragraph): number {
    if (this.id === c.id) {
      throw new Error('Can not compare between the same paragraph');
    }
    return c.begin() > this.end()
      ? c.begin() - this.end()
      : this.begin() - c.end();
  }

  public currentLine(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
        offset: 0,
        equal: true,
      }
  ): Line | undefined {
    const offset = options.offset ?? 0;
    const equal = options.equal ?? true;
    return Array.from(this.lineByPosition.values())
      .sort((a, b) => a.begin() - b.begin())
      .find((line) => line.isCurrent(now, { offset, equal }));
  }

  public currentLines(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
        offset: 0,
        equal: true,
      }
  ): Line[] {
    const offset = options.offset ?? 0;
    const equal = options.equal ?? true;
    return Array.from(this.lineByPosition.values())
      .sort((a, b) => a.begin() - b.begin())
      .filter((line) => line.isCurrent(now, { offset, equal }));
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
    if (this.begin() >= this.end()) {
      throw new Error('Can not calculate duration of a invalid paragraph');
    }
    return this.end() - this.begin();
  }

  public speed(): number {
    const speeds = this.allLines().map(w => w.speed())
    speeds.sort((a, b) => a - b)
    const half = Math.floor(speeds.length / 2)
    return parseFloat((speeds.length % 2 ? speeds[half] : (speeds[half - 1] + speeds[half]) / 2).toFixed(2))
  }

  public voids(): { begin: number; end: number; duration: number }[] {
    const words = this.words();

    return words.reduce<{ begin: number; end: number; duration: number }[]>(
      (acc, word, index) => {
        const isFirstWord = index === 0;
        const isLastWord = index === words.length - 1;

        if (isFirstWord && word.begin() > this.begin()) {
          acc.push({
            begin: this.begin(),
            end: word.begin(),
            duration: Number(word.begin().toFixed(2)),
          });
        }
        if (isLastWord && this.end() - word.end() > 0) {
          acc.push({
            begin: word.end(),
            end: this.end(),
            duration: Number((this.end() - word.end()).toFixed(2)),
          });
        }
        const prevWord = words[index - 1];
        if (prevWord && word.begin() - prevWord.end() > 0) {
          acc.push({
            begin: prevWord.end(),
            end: word.begin(),
            duration: Number((word.begin() - prevWord.end()).toFixed(2)),
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
