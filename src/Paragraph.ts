import Line, { LineArgs } from './Line';
import { Word } from './Word';

export type ParagraphArgs = {
  position: number;
  timelines: Map<number, LineArgs['timelines']>;
  tokenizer?: (lineArgs: LineArgs) => LineArgs;
};

export class Paragraph {
  id: string;
  lineByPosition: Map<number, Line>;
  position: number;
  begin: number;
  end: number;

  constructor(props: ParagraphArgs) {
    this.id = '';
    this.position = props.position;
    this.begin = 0;
    this.end = 0;
    this.lineByPosition = new Map();

    this.init(props);
  }

  private init(props: ParagraphArgs) {
    this.id = `paragraph-${crypto.randomUUID()}`;

    this.lineByPosition = Array.from(props.timelines).reduce<Map<number, Line>>(
      (acc, [position, timelines]) => {
        const args: LineArgs = props.tokenizer
          ? props.tokenizer({
              position,
              timelines,
            })
          : {
              position,
              timelines,
            };
        acc.set(position, new Line(args));
        return acc;
      },
      this.lineByPosition
    );

    this.begin = this.lineByPosition.get(1)?.begin || 0;
    this.end = this.lineByPosition.get(this.lineByPosition.size)?.end || 0;
  }

  public betweenDuration(c: Paragraph): number {
    if (this.id === c.id) {
      throw new Error('Can not compare between the same paragraph');
    }
    return c.begin > this.end ? c.begin - this.end : this.begin - c.end;
  }

  public lineAt(position: number): Line | undefined {
    return this.lineByPosition.get(position);
  }

  public allWords(): Word[] {
    return Array.from(this.lineByPosition.values()).reduce<Word[]>(
      (acc, line) => {
        acc.push(...line.allWords());
        return acc;
      },
      []
    );
  }

  public allLines(): Line[] {
    return Array.from(this.lineByPosition.values());
  }

  public duration(): number {
    if (this.begin >= this.end) {
      throw new Error('Can not calculate duration of a invalid paragraph');
    }
    return this.end - this.begin;
  }

  public voids(): { begin: number; end: number; duration: number }[] {
    const allWords = this.allWords();

    return allWords.reduce<{ begin: number; end: number; duration: number }[]>(
      (acc, word, index) => {
        const isFirstWord = index === 0;
        const isLastWord = index === allWords.length - 1;

        if (isFirstWord && word.begin > this.begin) {
          acc.push({
            begin: this.begin,
            end: word.begin,
            duration: Number(word.begin.toFixed(2)),
          });
        }
        if (isLastWord && this.end - word.end > 0) {
          acc.push({
            begin: word.end,
            end: this.end,
            duration: Number((this.end - word.end).toFixed(2)),
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

export default Paragraph;
