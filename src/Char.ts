import { CharType } from './Constants';

export type CharArgs = {
  wordID: string;
  position: number;
  text: string;
  begin: number;
  end: number;
};

export class Char {
  id: string;
  wordID: string;
  text: string;
  type: CharType;
  position: number;
  begin: number;
  end: number;

  constructor(props: CharArgs) {
    this.id = '';
    this.wordID = props.wordID;
    this.position = props.position;
    this.text = props.text;
    this.begin = props.begin;
    this.end = props.end;
    this.type = 'other';

    this.init();
  }

  private init() {
    this.id = `char-${crypto.randomUUID()}`;
    this.type = this.getType();
  }

  public betweenDuration(c: Char): number {
    if (this.id === c.id) {
      throw new Error('Can not compare between the same char');
    }
    return c.begin > this.end ? c.begin - this.end : this.begin - c.end;
  }

  public duration(): number {
    if (this.begin >= this.end) {
      throw new Error('Can not calculate duration of a invalid char');
    }
    return this.end - this.begin;
  }

  private getType(): CharType {
    if (this.isWhitespace()) {
      return 'whitespace';
    }
    if (this.isAlphabet()) {
      return 'alphabet';
    }
    if (this.isNumber()) {
      return 'number';
    }
    if (this.isKanji()) {
      return 'kanji';
    }
    if (this.isHiragana()) {
      return 'hiragana';
    }
    if (this.isKatakana()) {
      return 'katakana';
    }
    return 'other';
  }

  public isWhitespace(): boolean {
    return /^\s+$/.test(this.text);
  }

  public isAlphabet(): boolean {
    return /^[a-zA-Z]+$/.test(this.text);
  }

  public isNumber(): boolean {
    return /^[0-9]+$/.test(this.text);
  }

  public isKanji(): boolean {
    return /^[\u4E00-\u9FFF]+$/.test(this.text);
  }

  public isHiragana(): boolean {
    return /^[\u3040-\u309F]+$/.test(this.text);
  }

  public isKatakana(): boolean {
    return /^[\u30A0-\u30FF]+$/.test(this.text);
  }

  public isJapanese(): boolean {
    return this.isKanji() || this.isHiragana() || this.isKatakana();
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
      ? this.begin <= now + offset && now + offset <= this.end
      : this.begin < now + offset && now + offset < this.end;
  }

  public needBetweenWhitespace(c: Char): boolean {
    if (this.id === c.id) {
      throw new Error('Can not compare between the same char');
    }
    if (this.isWhitespace() || c.isWhitespace()) {
      return false;
    }
    if (this.isJapanese() && c.isJapanese()) {
      return false;
    }
    return this.type !== c.type;
  }
}

export default Char;
