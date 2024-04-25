import Line, { LineArgs } from './Line';
import { Paragraph, ParagraphArgs } from './Paragraph';
import { Word } from './Word';

export type LyricArgs = {
  initID?: boolean;
  resourceID: string;
  duration: number;
  timelines: Map<number, ParagraphArgs['timelines']>;
  tokenizer?: (lineArgs: LineArgs) => Map<number, LineArgs>;
  offsetSec?: number;
};

export class Lyric {
  id: string;
  resourceID: string;
  paragraphByPosition: Map<number, Paragraph>;
  duration: number;
  offsetSec: number;

  constructor(props: LyricArgs) {
    this.id = props.initID ? `lyric-${crypto.randomUUID()}` : '';
    this.resourceID = props.resourceID;
    this.duration = Number(props.duration.toFixed(2));
    this.paragraphByPosition = new Map();
    this.offsetSec = props.offsetSec ?? 0;
    this.init(props);
  }

  private init(props: LyricArgs) {
    this.paragraphByPosition = Array.from(props.timelines).reduce<
      Map<number, Paragraph>
    >((acc, [position, timelines]) => {
      acc.set(
        position,
        new Paragraph({
          lyricID: this.id,
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

  public currentParagraph(now: number) {
    return this.paragraphs().find((paragraph) => {
      return (
        paragraph.begin <= now + this.offsetSec &&
        now + this.offsetSec <= paragraph.end
      );
    });
  }

  public currentLine(now: number) {
    return this.lines().find((line) => {
      return (
        line.begin <= now + this.offsetSec && now + this.offsetSec <= line.end
      );
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

  public currentWord(now: number) {
    return this.currentLine(now)?.currentWord(now, this.offsetSec);
  }

  public nextWord(now: number) {
    return (
      this.currentLine(now)?.nextWord(now, this.offsetSec) ||
      this.nextLine(now)?.firstWord()
    );
  }

  public prevWord(now: number) {
    return (
      this.currentLine(now)?.prevWord(now, this.offsetSec) ||
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
        const prevWord = words[index - 1];
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
