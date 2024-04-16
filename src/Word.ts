import { Char } from './Char';
import { WordTimeline } from './Constants';

export type WordArgs = {
  position: number;
  timeline: WordTimeline;
};

export class Word {
  id: string;
  charByPosition: Map<number, Char>;
  position: number;
  begin: number;
  end: number;
  hasWhitespace: boolean;

  constructor(props: WordArgs) {
    this.id = '';
    this.position = props.position;
    this.begin = props.timeline.begin;
    this.end = props.timeline.end;
    this.charByPosition = new Map();
    this.hasWhitespace = props.timeline.hasWhitespace || false;

    this.init(props);
  }

  private init(props: WordArgs) {
    this.id = `word-${crypto.randomUUID()}`;

    const charTexts = props.timeline.text.split('');
    const durationByChar = this.duration() / charTexts.length;
    this.charByPosition = charTexts.reduce<Map<number, Char>>(
      (acc, char, index) => {
        const position = index + 1;
        acc.set(
          position,
          new Char({
            position,
            text: char,
            begin: this.begin + index * durationByChar,
            end: this.begin + position * durationByChar,
          })
        );
        return acc;
      },
      this.charByPosition
    );
  }

  public betweenDuration(c: Word): number {
    if (this.id === c.id) {
      throw new Error('Can not compare between the same word');
    }
    return c.begin > this.end ? c.begin - this.end : this.begin - c.end;
  }

  public charAt(position: number): Char | undefined {
    return this.charByPosition.get(position);
  }

  public duration(): number {
    if (this.begin >= this.end) {
      throw new Error('Can not calculate duration of a invalid word');
    }
    return this.end - this.begin;
  }

  public durationByChar(): number {
    return this.duration() / this.charByPosition.size;
  }

  public text(): string {
    return Array.from(this.charByPosition.values())
      .map((char) => char.text)
      .join('');
  }
}
