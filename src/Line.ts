import Char from './Char';
import { WordTimeline } from './Constants';
import { Word } from './Word';

export type LineArgs = {
  position: number;
  timelines: WordTimeline[];
  jointNearWord?: boolean;
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

    this.wordByPosition = props.timelines.reduce<Map<number, Word>>(
      (acc, tl, index) => {
        const isWhitespace = /^\s+$/.test(tl.text);
        if (isWhitespace) {
          return acc;
        }

        const nextTl = props.timelines[index + 1];
        const nextIsWhitespace = nextTl ? /^\s+$/.test(nextTl.text) : false;
        const hasWhitespace = tl.hasWhitespace || nextIsWhitespace;

        // 近接していたら同じ単語として扱う
        if (props.jointNearWord !== false) {
          const lastWord = acc.get(acc.size);
          if (
            lastWord &&
            lastWord.timeline.end - tl.begin <= 0.1 &&
            !lastWord.timeline.hasNewLine &&
            !lastWord.timeline.hasWhitespace
          ) {
            acc.set(
              acc.size,
              new Word({
                lineID: this.id,
                position: acc.size,
                timeline: {
                  begin: lastWord.timeline.begin,
                  end: tl.end,
                  text: lastWord.text() + tl.text,
                  hasNewLine: tl.hasNewLine,
                  hasWhitespace,
                },
              })
            );

            return acc;
          }
        }

        acc.set(
          acc.size + 1,
          new Word({
            lineID: this.id,
            position: acc.size + 1,
            timeline: {
              ...tl,
              hasWhitespace,
            },
          })
        );
        return acc;
      },
      this.wordByPosition
    );

    this.begin = this.wordByPosition.get(1)?.timeline.begin || 0;
    this.end =
      this.wordByPosition.get(this.wordByPosition.size)?.timeline.end || 0;
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

  public word(wordID: string): Word | undefined {
    for (const [, word] of this.wordByPosition) {
      if (word.id === wordID) {
        return word;
      }
    }
  }

  public words(): Word[] {
    return Array.from(this.wordByPosition.values());
  }

  public chars(): Char[] {
    return this.words().flatMap((word) => word.chars());
  }

  public duration(): number {
    if (this.begin >= this.end) {
      throw new Error('Can not calculate duration of a invalid line');
    }
    return this.end - this.begin;
  }

  public text(): string {
    return this.words()
      .map(
        (word) =>
          `${word.text()}${
            word.timeline.hasWhitespace && !word.timeline.hasNewLine ? ' ' : ''
          }${word.timeline.hasNewLine ? `\n` : ''}`
      )
      .join('');
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

  public firstWord(): Word {
    return this.wordByPosition.get(1)!;
  }

  public lastWord(): Word {
    return this.wordByPosition.get(this.wordByPosition.size)!;
  }

  public currentWord(now: number, offset = 0): Word | undefined {
    return Array.from(this.wordByPosition.values()).find(
      (word) =>
        word.timeline.begin <= now + offset && now + offset <= word.timeline.end
    );
  }

  public prevWord(now: number, offset = 0): Word | undefined {
    return Array.from(this.wordByPosition.values())
      .sort((a, b) => b.timeline.begin - a.timeline.begin)
      .find((word) => word.timeline.begin < now + offset);
  }

  public rowWords(row: number): Word[] {
    const map = this.wordGridPositionByWordID();
    return Array.from(map.values())
      .filter((v) => v.row === row)
      .map((v) => v.word);
  }

  public nextWord(now: number, offset = 0): Word | undefined {
    return Array.from(this.wordByPosition.values())
      .sort((a, b) => a.timeline.begin - b.timeline.begin)
      .find((word) => word.timeline.begin > now + offset);
  }

  public maxRowPosition() {
    return Math.max(
      ...Array.from(this.wordGridPositionByWordID().values()).map((v) => v.row)
    );
  }

  public charPositions(): Map<
    string,
    {
      row: number;
      column: number;
      inLinePosition: number;
    }
  > {
    const chars = this.chars();
    const allWords = this.words();
    const wordPositionMap = this.wordGridPositionByWordID();
    const map = new Map<
      string,
      {
        row: number;
        column: number;
        inLinePosition: number;
      }
    >();
    chars.forEach((char) => {
      const position = this._getCharPosition(
        char,
        chars,
        allWords,
        wordPositionMap
      );
      map.set(char.id, position);
    });

    return map;
  }

  private _getCharPosition(
    char: Char,
    allChars: Char[],
    allWords: Word[],
    wordPositionMap: ReturnType<Line['wordGridPositionByWordID']>
  ): {
    row: number;
    column: number;
    inLinePosition: number;
  } {
    const word = allWords.find((w) => w.id === char.wordID);
    if (!word) {
      throw new Error('word not found');
    }
    const inLinePosition = allChars.findIndex((c) => c.id === char.id) + 1;
    const wordPosition = wordPositionMap.get(word.id);
    if (!wordPosition) {
      throw new Error('wordPosition not found');
    }
    const sameRowWords = allWords.filter(
      (w) =>
        wordPositionMap.get(w.id)?.row === wordPosition.row &&
        w.timeline.begin < word.timeline.begin
    );

    const charColumnPosition =
      sameRowWords.reduce<number>((sum, w) => {
        return sum + w.charByPosition.size;
      }, 0) + char.position;

    return {
      row: wordPosition.row,
      column: charColumnPosition,
      inLinePosition,
    };
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
      const prevWord = words.get(position - 1);
      if (prevWord?.timeline.hasNewLine) {
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
