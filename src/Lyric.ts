import { WordTimeline } from './Constants';
import Line from './Line';
import { Paragraph, ParagraphArgs } from './Paragraph';
import { Word } from './Word';

export type LyricArgs = {
  initID?: boolean;
  resourceID: string;
  duration: number;
  timelines: ParagraphArgs['timelines'][];
  tokenizer?: ParagraphArgs['tokenizer'];
  offsetSec?: number;
};

export class Lyric {
  id: string;
  resourceID: string;
  paragraphByPosition: Map<number, Paragraph>;
  duration: number;
  offsetSec: number;
  _args: LyricArgs;

  constructor(props: LyricArgs) {
    this.id = props.initID ? `lyric-${crypto.randomUUID()}` : '';
    this.resourceID = props.resourceID;
    this.duration = Number(props.duration.toFixed(2));
    this.paragraphByPosition = new Map();
    this.offsetSec = props.offsetSec ?? 0;
    this._args = props;
  }

  public async init(): Promise<Lyric> {
    const res = this._args.timelines.reduce<Array<Promise<Paragraph>>>(
      (acc, timelines, index) => {
        const position = index + 1;
        const paragraph = new Paragraph({
          lyricID: this.id,
          position,
          timelines,
          tokenizer: this._args.tokenizer,
        }).init();
        acc.push(paragraph);
        return acc;
      },
      []
    );

    const paragraphs = await Promise.all(res);
    this.paragraphByPosition = paragraphs.reduce<Map<number, Paragraph>>(
      (acc, paragraph) => {
        acc.set(paragraph.position, paragraph);
        return acc;
      },
      this.paragraphByPosition
    );

    return this;
  }

  public paragraphAt(position: number): Paragraph | undefined {
    return this.paragraphByPosition.get(position);
  }

  public words(): Word[] {
    return Array.from(this.paragraphByPosition.values()).reduce<Word[]>(
      (acc, paragraph) => {
        acc.push(...paragraph.words());
        return acc;
      },
      []
    );
  }

  public lineParagraph(line: Line) {
    return this.paragraphs().find(
      (paragraph) => paragraph.lineByPosition.get(line.position)?.id === line.id
    );
  }

  public linePositionInLyric(line: Line) {
    return Array.from(this.lines()).findIndex((l) => l.id === line.id) + 1;
  }

  public linePositionInParagraph(line: Line) {
    return (
      Array.from(this.lineParagraph(line)!.lineByPosition.values()).findIndex(
        (l) => l.id === line.id
      ) + 1
    );
  }

  public paragraphs(): Paragraph[] {
    return Array.from(this.paragraphByPosition.values()).sort(
      (a, b) => a.begin - b.begin
    );
  }

  public lines(): Line[] {
    return this.paragraphs()
      .flatMap((paragraph) => Array.from(paragraph.lineByPosition.values()))
      .sort((a, b) => a.begin - b.begin);
  }

  public currentParagraph(now: number, equal = false) {
    return this.paragraphs().find((paragraph) => {
      return equal
        ? paragraph.begin <= now + this.offsetSec &&
            now + this.offsetSec <= paragraph.end
        : paragraph.begin < now + this.offsetSec &&
            now + this.offsetSec < paragraph.end;
    });
  }

  public currentLine(now: number, equal = false) {
    return this.currentParagraph(now, equal)?.currentLine(now, {
      offset: this.offsetSec,
      equal,
    });
  }

  public nextParagraph(now: number) {
    return this.paragraphs().find((p) => p.begin > now + this.offsetSec);
  }

  public nextLine(now: number) {
    return this.lines().find((p) => p.begin > now + this.offsetSec);
  }

  public prevParagraph(now: number) {
    return this.paragraphs()
      .reverse()
      .find((p) => p.end < now + this.offsetSec);
  }

  public prevLine(now: number) {
    return this.lines()
      .reverse()
      .find((p) => p.end < now + this.offsetSec);
  }

  public currentWord(now: number, equal = false) {
    return this.currentLine(now, equal)?.currentWord(now, {
      equal,
      offset: this.offsetSec,
    });
  }

  public nextWord(now: number) {
    return (
      this.currentLine(now)?.nextWord(now, { offset: this.offsetSec }) ||
      this.nextLine(now)?.firstWord()
    );
  }

  public prevWord(now: number) {
    return (
      this.currentLine(now)?.prevWord(now, { offset: this.offsetSec }) ||
      this.prevLine(now)?.lastWord()
    );
  }

  public wordsByLineIDAndRowPosition(): Map<
    string,
    Map<number, Map<number, Word>>
  > {
    return this.lines().reduce((acc, line) => {
      const wordPositionMap = line.wordGridPositionByWordID();
      wordPositionMap.forEach(({ row, column, word }) => {
        if (!acc.get(line.id)) {
          acc.set(line.id, new Map());
        }
        if (!acc.get(line.id)?.get(row)) {
          acc.get(line.id)?.set(row, new Map());
        }
        acc.get(line.id)?.get(row)?.set(column, word);
      });

      return acc;
    }, new Map<string, Map<number, Map<number, Word>>>());
  }

  public voids(): { begin: number; end: number; duration: number }[] {
    const words = this.words();

    return words.reduce<{ begin: number; end: number; duration: number }[]>(
      (acc, word, index) => {
        const isFirstWord = index === 0;
        const isLastWord = index === words.length - 1;

        if (isFirstWord && word.timeline.begin > 0) {
          acc.push({
            begin: 0,
            end: word.timeline.begin,
            duration: Number(word.timeline.begin.toFixed(2)),
          });
        }
        if (isLastWord && this.duration - word.timeline.end > 0) {
          acc.push({
            begin: word.timeline.end,
            end: this.duration,
            duration: Number((this.duration - word.timeline.end).toFixed(2)),
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

  public timelines(): WordTimeline[][][] {
    return Array.from(this.paragraphByPosition.values()).map((paragraph) => {
      return Array.from(paragraph.lineByPosition.values()).map((line) => {
        return Array.from(line.wordByPosition.values()).map((word) => {
          return {
            ...word.timeline,
          };
        });
      });
    });
  }
}

export default Lyric;
