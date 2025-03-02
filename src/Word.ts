import { Char } from "./Char";
import { CHAR_TYPES, type WordTimeline } from "./Constants";

export type WordCreateArgs = {
  lineID: string;
  position: number;
  timeline: WordTimeline | Omit<WordTimeline, "wordID">;
};

export type WordUpdateArgs = {
  position: number;
  timeline: WordTimeline;
};

export function isWordCreateArgs(
  args: WordCreateArgs | WordUpdateArgs,
): args is WordCreateArgs {
  return (args as WordCreateArgs).lineID !== undefined;
}

export function isWordTimeline(
  args: WordTimeline | Omit<WordTimeline, "wordID">,
): args is WordTimeline {
  return (args as WordTimeline).wordID !== undefined;
}

export class Word {
  id: string;
  lineID: string;
  charByPosition: Map<number, Char>;
  position: number;
  timeline: WordTimeline;

  constructor(props: WordCreateArgs) {
    this.id = "";
    this.timeline = {
      ...props.timeline,
      wordID: "",
    };
    this.lineID = props.lineID;
    this.position = props.position;
    this.charByPosition = new Map();

    this.init(props);
  }

  private init(props: WordCreateArgs) {
    this.id = isWordTimeline(props.timeline)
      ? props.timeline.wordID
      : `word-${crypto.randomUUID()}`;
    this.timeline = {
      ...props.timeline,
      hasNewLine: props.timeline.hasNewLine ?? false,
      hasWhitespace: props.timeline.hasWhitespace ?? false,
      wordID: this.id,
    };

    const charTexts = props.timeline.text.split("");
    const durationByChar = this.duration() / charTexts.length;
    this.charByPosition = charTexts.reduce<Map<number, Char>>(
      (acc, char, index) => {
        const position = index + 1;
        acc.set(
          position,
          new Char({
            wordID: this.id,
            position,
            text: char,
            begin: this.begin() + index * durationByChar,
            end: this.begin() + position * durationByChar,
          }),
        );
        return acc;
      },
      this.charByPosition,
    );
  }

  public update(props: WordUpdateArgs) {
    this.timeline = props.timeline;
    this.position = props.position;
    const charTexts = this.timeline.text.split("");
    const durationByChar = this.duration() / charTexts.length;
    this.charByPosition = charTexts.reduce<Map<number, Char>>(
      (acc, char, index) => {
        const position = index + 1;
        acc.set(
          position,
          new Char({
            wordID: this.id,
            position,
            text: char,
            begin: this.begin() + index * durationByChar,
            end: this.begin() + position * durationByChar,
          }),
        );
        return acc;
      },
      new Map(),
    );
    return this;
  }

  public betweenDuration(c: Word): number {
    if (this.id === c.id) {
      throw new Error(`Can not compare between the same word: ${this.id}`);
    }
    return c.begin() > this.end()
      ? c.begin() - this.end()
      : this.begin() - c.end();
  }

  public charAt(position: number): Char | undefined {
    return this.charByPosition.get(position);
  }

  public chars() {
    return Array.from(this.charByPosition.values());
  }

  public duration(): number {
    if (this.begin() >= this.end()) {
      throw new Error(
        `Can not calculate duration of a invalid word: ${
          this.id
        } ${this.begin()}-${this.end()}`,
      );
    }
    return this.end() - this.begin();
  }

  public speed(): number {
    const duration = this.duration();
    return (
      this.chars().reduce(
        (acc, char) =>
          acc +
          (char.type === CHAR_TYPES.WHITESPACE
            ? 0
            : char.type === CHAR_TYPES.ALPHABET ||
                char.type === CHAR_TYPES.NUMBER
              ? 0.5
              : 1),
        0,
      ) / duration
    );
  }

  public durationByChar(): number {
    return this.duration() / this.charByPosition.size;
  }

  public text(): string {
    return Array.from(this.charByPosition.values())
      .map((char) => char.text)
      .join("");
  }

  public begin(): number {
    return this.timeline.begin;
  }

  public end(): number {
    return this.timeline.end;
  }

  public currentChar(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
      offset: 0,
      equal: true,
    },
  ): Char | undefined {
    const offset = options.offset ?? 0;
    const equal = options.equal ?? true;
    return Array.from(this.charByPosition.values())
      .sort((a, b) => b.begin - a.begin)
      .find((char) => char.isCurrent(now, { offset, equal }));
  }

  public currentChars(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
      offset: 0,
      equal: true,
    },
  ): Char[] {
    const offset = options.offset ?? 0;
    const equal = options.equal ?? true;
    return Array.from(this.charByPosition.values()).filter((char) =>
      char.isCurrent(now, { offset, equal }),
    );
  }

  public isCurrent(
    now: number,
    options: {
      offset?: number;
      equal?: boolean;
    } = {
      offset: 0,
      equal: true,
    },
  ): boolean {
    const offset = options.offset ?? 0;
    const equal = options.equal ?? true;
    return equal
      ? this.begin() <= now + offset && now + offset <= this.end()
      : this.begin() < now + offset && now + offset < this.end();
  }
}

export default Word;
