import type Char from "./Char";
import type { WordTimeline } from "./Constants";
import type Line from "./Line";
import {
  Paragraph,
  type ParagraphCreateArgs,
  type ParagraphUpdateArgs,
} from "./Paragraph";
import type { Word } from "./Word";

export type RowStatus = {
  wordIDs: Word["id"][];
  isCurrentRow: boolean;
  isPrevRow: boolean;
  isNextRow: boolean;
  chars: Char[];
};

export type LyricCreateArgs = {
  initID?: boolean;
  id?: string;
  resourceID: string;
  duration: number;
  timelines: ParagraphCreateArgs["timelines"][];
  lineTokenizer?: ParagraphCreateArgs["lineTokenizer"];
  paragraphTokenizer?: ParagraphCreateArgs["paragraphTokenizer"];
  offsetSec?: number;
};

export type LyricUpdateArgs = {
  resourceID?: string;
  duration?: number;
  timelines?: ParagraphUpdateArgs["timelines"][];
  offsetSec?: number;
};

export class Lyric {
  id: string;
  resourceID: string;
  paragraphByPosition: Map<number, Paragraph>;
  duration: number;
  offsetSec: number;
  _args: LyricCreateArgs;

  constructor(props: LyricCreateArgs) {
    this.id = props.id
      ? props.id
      : props.initID
        ? `lyric-${crypto.randomUUID()}`
        : "";
    this.resourceID = props.resourceID;
    this.duration = Number(props.duration.toFixed(2));
    this.paragraphByPosition = new Map();
    this.offsetSec = props.offsetSec ?? 0;
    this._args = props;
  }

  public async init() {
    const paragraphByPosition = this._args.timelines.reduce<
      Map<number, Paragraph>
    >((acc, timelines, index) => {
      const position = index + 1;
      acc.set(
        position,
        new Paragraph({
          lyricID: this.id,
          position,
          timelines,
          lineTokenizer: this._args.lineTokenizer,
          paragraphTokenizer: this._args.paragraphTokenizer,
        }),
      );
      return acc;
    }, new Map());

    const paragraphs = await Promise.all(
      Array.from(paragraphByPosition.values()).map((paragraph) => {
        return paragraph.init();
      }),
    );
    this.paragraphByPosition = paragraphs.reduce((acc, paragraph) => {
      acc.set(paragraph.position, paragraph);
      return acc;
    }, new Map());

    return this;
  }

  public async update(props: LyricUpdateArgs): Promise<Lyric> {
    this.resourceID = props.resourceID || this.resourceID;
    this.duration = props.duration
      ? Number(props.duration.toFixed(2))
      : this.duration;
    this.offsetSec =
      (props.offsetSec || 0) !== this.offsetSec
        ? props.offsetSec || 0
        : this.offsetSec;

    if (props.timelines === undefined) {
      return this;
    }

    await Promise.all(
      Array.from(this.paragraphByPosition.values()).map(async (paragraph) => {
        const updatedParagraph = await paragraph.update({
          position: paragraph.position,
          timelines: props.timelines?.[paragraph.position - 1] || [[]],
        });
        this.paragraphByPosition.set(paragraph.position, updatedParagraph);
      }),
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
      [],
    );
  }

  public lineParagraph(line: Line) {
    return this.paragraphs().find(
      (paragraph) =>
        paragraph.lineByPosition.get(line.position)?.id === line.id,
    );
  }

  public linePositionInLyric(line: Line) {
    return Array.from(this.lines()).findIndex((l) => l.id === line.id) + 1;
  }

  public linePositionInParagraph(line: Line) {
    const positions = this.lineParagraph(line)?.lineByPosition;
    if (!positions) {
      return;
    }
    return (
      Array.from(positions.values()).findIndex((l) => l.id === line.id) + 1
    );
  }

  public paragraphs(): Paragraph[] {
    return Array.from(this.paragraphByPosition.values()).sort(
      (a, b) => a.begin() - b.begin(),
    );
  }

  public lines(): Line[] {
    return this.paragraphs()
      .flatMap((paragraph) => Array.from(paragraph.lineByPosition.values()))
      .sort((a, b) => a.begin() - b.begin());
  }

  public speed(): number {
    const speeds = this.paragraphs().map((w) => w.speed());
    speeds.sort((a, b) => a - b);
    const half = Math.floor(speeds.length / 2);
    return Number.parseFloat(
      (speeds.length % 2
        ? speeds[half]
        : (speeds[half - 1] + speeds[half]) / 2
      ).toFixed(2),
    );
  }

  public currentParagraph(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
      offset: this.offsetSec,
      equal: true,
    },
  ) {
    const offset = options.offset ?? this.offsetSec;
    const equal = options.equal ?? true;

    return this.paragraphs().find((paragraph) => {
      return equal
        ? paragraph.begin() <= now + offset && now + offset <= paragraph.end()
        : paragraph.begin() < now + offset && now + offset < paragraph.end();
    });
  }

  public currentLine(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
      offset: this.offsetSec,
      equal: true,
    },
  ) {
    const offset = options.offset ?? this.offsetSec;
    const equal = options.equal ?? true;
    return this.currentParagraph(now, {
      offset,
      equal,
    })?.currentLine(now, {
      offset,
      equal,
    });
  }

  public currentWord(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
      offset: this.offsetSec,
      equal: true,
    },
  ) {
    const offset = options.offset ?? this.offsetSec;
    const equal = options.equal ?? true;

    return this.currentLine(now, {
      offset,
      equal,
    })?.currentWord(now, {
      equal,
      offset,
    });
  }

  public currentChar(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
      offset: this.offsetSec,
      equal: true,
    },
  ) {
    const offset = options.offset ?? this.offsetSec;
    const equal = options.equal ?? true;

    return this.currentLine(now, {
      offset,
      equal,
    })
      ?.currentWord(now, {
        equal,
        offset,
      })
      ?.currentChar(now, {
        equal,
        offset,
      });
  }

  public nextParagraph(
    now: number,
    options: {
      offset?: number;
    } = {
      offset: this.offsetSec,
    },
  ) {
    const offset = options.offset ?? 0;
    return this.paragraphs().find((p) => p.begin() > now + offset);
  }

  public nextLine(
    now: number,
    options: {
      offset?: number;
    } = {
      offset: this.offsetSec,
    },
  ) {
    const offset = options.offset ?? 0;
    return this.lines().find((p) => p.begin() > now + offset);
  }

  public nextWord(
    now: number,
    options: {
      offset?: number;
    } = {
      offset: this.offsetSec,
    },
  ) {
    const offset = options.offset ?? 0;
    return (
      this.currentLine(now)?.nextWord(now, { offset }) ||
      this.nextLine(now)?.firstWord()
    );
  }

  public prevParagraph(
    now: number,
    options: {
      offset?: number;
    } = {
      offset: this.offsetSec,
    },
  ) {
    const offset = options.offset ?? 0;
    return this.paragraphs()
      .reverse()
      .find((p) => p.end() < now + offset);
  }

  public prevLine(
    now: number,
    options: {
      offset?: number;
    } = {
      offset: this.offsetSec,
    },
  ) {
    const offset = options.offset ?? 0;
    return this.lines()
      .reverse()
      .find((p) => p.end() < now + offset);
  }

  public prevWord(
    now: number,
    options: {
      offset?: number;
    } = {
      offset: this.offsetSec,
    },
  ) {
    const offset = options.offset ?? 0;
    return (
      this.currentLine(now)?.prevWord(now, { offset }) ||
      this.prevLine(now)?.lastWord()
    );
  }

  public currentRowStatusByRow(
    now: number,
    options: {
      offset?: number;
    } = {
      offset: this.offsetSec,
    },
  ): Map<number, RowStatus> | null {
    const offset = options.offset ?? 0;
    const { currentLine, currentWord, nextLine, prevLine } =
      this.currentSummary(now, { offset });
    if (!currentLine) return null;

    const lineID = currentLine.id;

    const wordsByLineIDAndRowPosition = this.wordsByLineIDAndRowPosition();
    const wordsByRowPosition = wordsByLineIDAndRowPosition.get(lineID);
    if (!wordsByRowPosition) return null;

    const currentWordGridPositionByWordID =
      currentLine.wordGridPositionByWordID();
    const currentWordGridPosition = currentWordGridPositionByWordID.get(
      currentWord?.id ?? "",
    );
    const isPrevLine = prevLine?.id === currentLine.id;
    const isNextLine = nextLine?.id === currentLine.id;
    const isCurrentLine = currentLine?.id === currentLine.id;

    const result = Array.from(wordsByRowPosition).reduce<
      Map<number, RowStatus>
    >((sum, [row, words]) => {
      return sum.set(
        Number(row),
        Array.from(words).reduce<RowStatus>(
          (acc, [_, word]) => {
            const wordChars = word.chars();
            const wordGridPosition = currentWordGridPositionByWordID.get(
              word?.id ?? "",
            );
            const isCurrentRow =
              wordGridPosition?.row === currentWordGridPosition?.row;

            const isPrevRow = isPrevLine
              ? true
              : currentWord
                ? word.begin() < currentWord.begin() &&
                  (wordGridPosition?.row || 0) <
                    (currentWordGridPosition?.row || 0)
                : !isCurrentLine;

            const isNextRow = isPrevLine
              ? false
              : isNextLine
                ? Number(row) === 1
                : currentWord
                  ? word.begin() > currentWord.begin() &&
                    (wordGridPosition?.row || 0) ===
                      (currentWordGridPosition?.row || 0) + 1
                  : true;

            return {
              wordIDs: acc.wordIDs.concat(word.id),
              isCurrentRow,
              isPrevRow,
              isNextRow,
              chars: acc.chars.concat(wordChars),
            };
          },
          {
            wordIDs: [],
            isCurrentRow: false,
            isPrevRow: false,
            isNextRow: false,
            chars: [],
          },
        ),
      );
    }, new Map());
    return result;
  }

  public currentSummary(
    now: number,
    options: {
      offset?: number;
    } = {
      offset: this.offsetSec,
    },
  ): {
    currentChar?: Char;
    currentLine?: Line;
    currentParagraph?: Paragraph;
    currentWord?: Word;
    isConnected: boolean;
    isParagraphFinishMotion: boolean;
    lastLineIndex?: number;
    lastLineIndexInParagraph?: number;
    nextLine?: Line;
    nextWord?: Word;
    nextParagraph?: Paragraph;
    nextWaitingTime?: number;
    prevLine?: Line;
    prevParagraph?: Paragraph;
    prevWord?: Word;
    lyricTextPerSecond?: number;
    paragraphTextPerSecond?: number;
    lineTextPerSecond?: number;
  } {
    const currentParagraph = this.currentParagraph(now, options);
    const nextParagraph = this.nextParagraph(now, options);
    const prevParagraph = this.prevParagraph(now, options);
    const allLine = this.lines();
    const currentLine = this.currentLine(now, options);
    const lastLineIndexInParagraph = currentParagraph
      ? Array.from(currentParagraph.lineByPosition.keys()).length - 1
      : undefined;

    const nextLine = this.nextLine(now, options);
    const nextWord = this.nextWord(now, options);

    const prevLine = this.prevLine(now, options);
    const prevWord = this.prevWord(now, options);
    const currentWord = this.currentWord(now, options);
    const currentChar = this.currentChar(now, options);

    const beforeCurrentTimeDiff =
      currentLine && prevLine
        ? currentLine.begin() - prevLine.end()
        : undefined;
    const isCurrentParagraphAverageTimeDiff = currentParagraph
      ? currentParagraph.averageLineDuration() < 1.5
      : undefined;

    const isConnected =
      isCurrentParagraphAverageTimeDiff === true &&
      beforeCurrentTimeDiff !== undefined &&
      beforeCurrentTimeDiff < 0.1;

    const isParagraphFinishMotion = currentParagraph
      ? currentParagraph && currentParagraph.end() < now
      : true;

    const nextWaitingTime = nextLine ? nextLine.begin() - now : undefined;

    const lastLineIndex = allLine.length - 1;

    const lyricTextPerSecond = this.speed();
    const paragraphTextPerSecond = currentParagraph
      ? currentParagraph.speed()
      : undefined;
    const lineTextPerSecond = currentLine ? currentLine.speed() : undefined;

    return {
      currentChar,
      currentLine,
      currentParagraph,
      currentWord,
      isConnected,
      isParagraphFinishMotion,
      lastLineIndex,
      lastLineIndexInParagraph,
      nextLine,
      nextWord,
      nextParagraph,
      nextWaitingTime,
      prevLine,
      prevWord,
      prevParagraph,
      lyricTextPerSecond,
      paragraphTextPerSecond,
      lineTextPerSecond,
    };
  }

  private _wordsByLineIDAndRowPosition(
    acc: Map<string, Map<number, Map<number, Word>>>,
    line: Line,
    wordPositionMap: ReturnType<Line["wordGridPositionByWordID"]>,
  ): ReturnType<Lyric["wordsByLineIDAndRowPosition"]> {
    for (const { row, column, word } of wordPositionMap.values()) {
      if (!acc.get(line.id)) {
        acc.set(line.id, new Map());
      }
      if (!acc.get(line.id)?.get(row)) {
        acc.get(line.id)?.set(row, new Map());
      }
      acc.get(line.id)?.get(row)?.set(column, word);
    }

    return acc;
  }

  /**
   * @param reducer A reducer function to customize the result.
   * @returns A map of words by line ID and row position.
   */
  public wordsByLineIDAndRowPosition(
    reducer = this._wordsByLineIDAndRowPosition,
  ): Map<string, Map<number, Map<number, Word>>> {
    return this.lines().reduce((acc, line) => {
      const wordPositionMap = line.wordGridPositionByWordID();

      return reducer(acc, line, wordPositionMap);
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
              (word.timeline.begin - prevWord.timeline.end).toFixed(2),
            ),
          });
        }

        return acc;
      },
      [],
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
          return word.timeline;
        });
      });
    });
  }

  public timelinesByLine(): WordTimeline[][] {
    return Array.from(this.paragraphByPosition.values()).map((paragraph) => {
      return Array.from(paragraph.lineByPosition.values()).map((line) => {
        const firstWord = line.wordByPosition.get(1);
        if (!firstWord) {
          throw new Error("firstWord is undefined");
        }
        const lastWord = line.wordByPosition.get(line.wordByPosition.size);
        if (!lastWord) {
          throw new Error("lastWord is undefined");
        }
        return {
          wordID: firstWord.id,
          begin: firstWord.timeline.begin,
          end: lastWord.timeline.end,
          text: line.text(),
          hasNewLine: lastWord.timeline.hasNewLine,
          hasWhitespace: lastWord.timeline.hasWhitespace,
        };
      });
    });
  }
}

export default Lyric;
