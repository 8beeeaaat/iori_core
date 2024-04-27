import { Char } from './Char';
import { WordTimeline } from './Constants';

export type WordArgs = {
  lineID: string;
  position: number;
  timeline: WordTimeline;
};

export class Word {
  id: string;
  lineID: string;
  charByPosition: Map<number, Char>;
  position: number;
  timeline: WordTimeline;

  constructor(props: WordArgs) {
    this.id = '';
    this.lineID = props.lineID;
    this.position = props.position;
    this.timeline = props.timeline;
    this.charByPosition = new Map();

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
            wordID: this.id,
            position,
            text: char,
            begin: this.timeline.begin + index * durationByChar,
            end: this.timeline.begin + position * durationByChar,
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
    return c.timeline.begin > this.timeline.end
      ? c.timeline.begin - this.timeline.end
      : this.timeline.begin - c.timeline.end;
  }

  public charAt(position: number): Char | undefined {
    return this.charByPosition.get(position);
  }

  public chars() {
    return Array.from(this.charByPosition.values());
  }

  public duration(): number {
    if (this.timeline.begin >= this.timeline.end) {
      throw new Error('Can not calculate duration of a invalid word');
    }
    return this.timeline.end - this.timeline.begin;
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

export default Word;
