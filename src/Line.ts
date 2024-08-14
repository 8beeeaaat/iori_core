import Char from './Char';
import { CHAR_TYPES } from './Constants';
import Word, { WordCreateArgs, WordUpdateArgs } from './Word';

export type LineCreateArgs = {
  position: number;
  timelines: WordCreateArgs['timeline'][];
  jointNearWord?: boolean;
};

export type LineUpdateArgs = {
  position: number;
  timelines: WordUpdateArgs['timeline'][];
  jointNearWord?: boolean;
};

export class Line {
  id: string;
  wordByPosition: Map<number, Word>;
  position: number;

  constructor(props: LineCreateArgs) {
    this.id = '';
    this.position = props.position;
    this.wordByPosition = new Map();

    this.init(props);
  }

  private confirmJointNearWord(
    timeline: WordCreateArgs['timeline'],
    nextTimeline: WordCreateArgs['timeline'] | undefined,
    lastWord: Word | undefined,
    jointNearWord: boolean
  ) {
    const isWhitespace = /^\s+$/.test(timeline.text);
    if (isWhitespace) {
      return undefined;
    }

    const nextIsWhitespace = nextTimeline
      ? /^\s+$/.test(nextTimeline.text)
      : false;
    const hasWhitespace = timeline.hasWhitespace || nextIsWhitespace;

    // 近接していたら同じ単語として扱う
    if (jointNearWord !== false) {
      if (
        lastWord &&
        lastWord.end() - timeline.begin <= 0.1 &&
        !lastWord.timeline.hasNewLine &&
        !lastWord.timeline.hasWhitespace
      ) {
        return [true, hasWhitespace];
      }
    }
    return [false, hasWhitespace];
  }

  private init(props: LineCreateArgs) {
    this.id = `line-${crypto.randomUUID()}`;

    const timeline = props.timelines.sort((a, b) => a.begin - b.begin);
    this.wordByPosition = timeline.reduce<Map<number, Word>>(
      (acc, tl, index) => {
        const nextTl = timeline[index + 1];
        const lastWord = acc.get(acc.size);
        const res = this.confirmJointNearWord(
          tl,
          nextTl,
          lastWord,
          props.jointNearWord === true
        );
        if (!res) {
          return acc;
        }
        const [isJoint, hasWhitespace] = res;

        // 近接していたら同じ単語として扱う
        if (lastWord && isJoint) {
          acc.set(
            acc.size,
            new Word({
              lineID: this.id,
              position: acc.size,
              timeline: {
                begin: lastWord.begin(),
                end: tl.end,
                text: lastWord.text() + tl.text,
                hasNewLine: tl.hasNewLine === true,
                hasWhitespace,
              },
            })
          );
          return acc;
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
      new Map()
    );
  }

  public update(props: LineUpdateArgs) {
    this.position = props.position;

    const timeline = props.timelines.sort((a, b) => a.begin - b.begin);
    this.wordByPosition = timeline.reduce<Map<number, Word>>(
      (acc, tl, index) => {
        const nextTl = timeline[index + 1];
        const lastWord = acc.get(acc.size);
        const res = this.confirmJointNearWord(
          tl,
          nextTl,
          lastWord,
          props.jointNearWord === true
        );
        if (!res) {
          return acc;
        }
        const [isJoint, hasWhitespace] = res;

        // 近接していたら同じ単語として扱う
        if (lastWord && isJoint) {
          acc.set(
            acc.size - 1,
            lastWord.update({
              position: acc.size,
              timeline: {
                wordID: lastWord.id,
                begin: lastWord.begin(),
                end: tl.end,
                text: lastWord.text() + tl.text,
                hasNewLine: tl.hasNewLine === true,
                hasWhitespace,
              },
            })
          );
          return acc;
        }

        const currentWord = Array.from(this.wordByPosition.values()).find(
          (w) => w.id === tl.wordID
        );
        const position = acc.size + 1;
        acc.set(
          position,
          currentWord
            ? currentWord.update({
              position: position,
              timeline: {
                ...tl,
                hasNewLine: tl.hasNewLine === true,
                hasWhitespace,
              },
            })
            : new Word({
              lineID: this.id,
              position: position,
              timeline: {
                ...tl,
                hasNewLine: tl.hasNewLine === true,
                hasWhitespace,
              },
            })
        );
        return acc;
      },
      new Map()
    );

    return this;
  }

  public begin(): number {
    return this.wordByPosition.get(1)?.begin() || 0;
  }

  public end(): number {
    return this.wordByPosition.get(this.wordByPosition.size)?.end() || 0;
  }

  public betweenDuration(c: Line): number {
    if (this.id === c.id) {
      throw new Error('Can not compare between the same line');
    }
    return c.begin() > this.end()
      ? c.begin() - this.end()
      : this.begin() - c.end();
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
    if (this.begin() >= this.end()) {
      throw new Error('Can not calculate duration of a invalid line');
    }
    return this.end() - this.begin();
  }

  public speed(): number {
    const speeds = this.words().map(w => w.speed())
    speeds.sort((a, b) => a - b)
    const half = Math.floor(speeds.length / 2)
    return parseFloat((speeds.length % 2 ? speeds[half] : (speeds[half - 1] + speeds[half]) / 2).toFixed(2))
  }

  public text(): string {
    return this.words()
      .map(
        (word) =>
          `${word.text()}${word.timeline.hasNewLine !== true && word.timeline.hasWhitespace ? ' ' : ''}${word.timeline.hasNewLine ? '\n' : ''
          }`
      )
      .join('');
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

  public firstWord(): Word {
    return this.wordByPosition.get(1)!;
  }

  public lastWord(): Word {
    return this.wordByPosition.get(this.wordByPosition.size)!;
  }

  public currentWord(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
        offset: 0,
        equal: true,
      }
  ): Word | undefined {
    const offset = options.offset ?? 0;
    const equal = options.equal ?? true;
    return Array.from(this.wordByPosition.values())
      .sort((a, b) => b.begin() - a.begin())
      .find((word) => word.isCurrent(now, { offset, equal }));
  }

  public currentRow(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
        offset: 0,
        equal: true,
      }
  ): number | undefined {

    const offset = options.offset ?? 0;
    const equal = options.equal ?? true;
    const currentWord = Array.from(this.wordByPosition.values())
      .sort((a, b) => b.begin() - a.begin())
      .find((word) => word.isCurrent(now, { offset, equal }));
    return currentWord?.position
  }

  public currentWords(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
        offset: 0,
        equal: false,
      }
  ): Word[] {
    const offset = options.offset ?? 0;
    const equal = options.equal ?? true;
    return Array.from(this.wordByPosition.values()).filter((word) =>
      word.isCurrent(now, { offset, equal })
    );
  }

  public prevWord(
    now: number,
    options: {
      offset?: number;
    } = {
        offset: 0,
      }
  ): Word | undefined {
    const offset = options.offset ?? 0;
    return Array.from(this.wordByPosition.values())
      .sort((a, b) => b.begin() - a.begin())
      .find((word) => word.begin() < now + offset);
  }

  public rowWords(row: number): Word[] {
    const map = this.wordGridPositionByWordID();
    return Array.from(map.values())
      .filter((v) => v.row === row)
      .map((v) => v.word);
  }

  public wordsByRow(): Map<number, Word[]> {
    const map = this.wordGridPositionByWordID();
    return Array.from(map.values()).reduce<Map<number, Word[]>>(
      (acc, v) => {
        if (!acc.has(v.row)) {
          acc.set(v.row, []);
        }
        acc.get(v.row)!.push(v.word);
        return acc;
      }, new Map()
    );
  }

  public wordRowPosition(wordID: string): number | undefined {
    return this.wordGridPositionByWordID().get(wordID)?.row;
  }

  public nextWord(
    now: number,
    options: {
      offset?: number;
    } = {
        offset: 0,
      }
  ): Word | undefined {
    const offset = options.offset ?? 0;
    return Array.from(this.wordByPosition.values())
      .sort((a, b) => a.begin() - b.begin())
      .find((word) => word.begin() > now + offset);
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
        w.begin() < word.begin()
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

  public isCurrent(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
        offset: 0,
        equal: true,
      }
  ): boolean {
    const offset = options.offset ?? 0;
    const equal = options.equal ?? true;
    return equal
      ? this.begin() <= now + offset && now + offset <= this.end()
      : this.begin() < now + offset && now + offset < this.end();
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

  public textsPerSecond(): number {
    const words = this.words();
    const duration = this.duration();
    return words.reduce((acc, word) => acc + word.chars().reduce((acc, char) => acc + (char.type === CHAR_TYPES.WHITESPACE ? 0 : char.type === CHAR_TYPES.ALPHABET || char.type === CHAR_TYPES.NUMBER ? 0.5 : 1), 0), 0) / duration;
  }
}

export default Line;
