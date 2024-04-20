import { WordTimeline } from './Constants';
import { Word } from './Word';

export type LineArgs = {
  position: number;
  timelines: Map<number, WordTimeline>;
};

export class Line {
  id: string;
  wordByPosition: Map<number, Word>;
  position: number;
  begin: number;
  end: number;

  constructor(props: LineArgs) {
    this.id = '';
    this.position = props.position;
    this.begin = 0;
    this.end = 0;
    this.wordByPosition = new Map();

    this.init(props);
  }

  private init(props: LineArgs) {
    this.id = `line-${crypto.randomUUID()}`;

    this.wordByPosition = Array.from(props.timelines).reduce<Map<number, Word>>(
      (acc, [position, tl]) => {
        const isWhitespace = /^\s+$/.test(tl.text);
        if (isWhitespace) {
          return acc;
        }

        const nextTl = props.timelines.get(position + 1);
        const nextIsWhitespace = /^\s+$/.test(nextTl?.text || '');

        acc.set(
          acc.size + 1,
          new Word({
            position: acc.size + 1,
            timeline: {
              ...tl,
              hasWhitespace: tl.hasWhitespace
                ? true
                : tl.hasNewLine
                ? false
                : nextIsWhitespace,
            },
          })
        );
        return acc;
      },
      this.wordByPosition
    );

    this.begin = this.wordByPosition.get(1)?.begin || 0;
    this.end = this.wordByPosition.get(this.wordByPosition.size)?.end || 0;
  }

  public betweenDuration(c: Line): number {
    if (this.id === c.id) {
      throw new Error('Can not compare between the same line');
    }
    return c.begin > this.end ? c.begin - this.end : this.begin - c.end;
  }

  public wordAt(position: number): Word | undefined {
    return this.wordByPosition.get(position);
  }

  public wordPosition(wordID: string): number | undefined {
    for (const [position, word] of this.wordByPosition) {
      if (word.id === wordID) {
        return position;
      }
    }
  }

  public allWords(): Word[] {
    return Array.from(this.wordByPosition.values());
  }

  public duration(): number {
    if (this.begin >= this.end) {
      throw new Error('Can not calculate duration of a invalid line');
    }
    return this.end - this.begin;
  }

  public text(): string {
    return this.allWords()
      .map(
        (word) =>
          `${word.text()}${word.hasWhitespace ? ' ' : ''}${
            word.hasNewLine ? `\n` : ''
          }`
      )
      .join('');
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

  public wordGridPositionByWordID(): Map<
    string,
    {
      row: number;
      column: number;
      word: Word;
    }
  > {
    const words = this.wordByPosition;
    const map = new Map<
      string,
      {
        row: number;
        column: number;
        word: Word;
      }
    >();

    let row = 1;
    let column = 0;

    for (const [position, word] of words) {
      const prevWord = words.get(Number(position) - 1);
      if (prevWord?.hasNewLine) {
        row++;
        column = 1;
      } else {
        column++;
      }
      map.set(word.id, {
        row,
        column,
        word,
      });
    }

    return map;
  }
}

export default Line;
