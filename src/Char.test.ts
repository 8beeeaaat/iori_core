import { beforeEach, describe, expect, it } from 'vitest';
import { Char } from './Char';
import { CHAR_TYPES } from './Constants';

describe('Char', () => {
  let whitespaceChar: Char;
  let twoBytesWhitespaceChar: Char;
  let alphabetChar: Char;
  let numberChar: Char;
  let kanjiChar: Char;
  let hiraganaChar: Char;

  beforeEach(() => {
    whitespaceChar = new Char({
      wordID: '1',
      position: 1,
      text: ' ',
      begin: 0,
      end: 1,
    });
    twoBytesWhitespaceChar = new Char({
      wordID: '1',
      position: 1,
      text: '　',
      begin: 1,
      end: 2,
    });
    alphabetChar = new Char({
      wordID: '1',
      position: 1,
      text: 'A',
      begin: 0,
      end: 1,
    });
    numberChar = new Char({
      wordID: '1',
      position: 1,
      text: '1',
      begin: 2,
      end: 3,
    });
    kanjiChar = new Char({
      wordID: '1',
      position: 1,
      text: '漢',
      begin: 10,
      end: 12.5,
    });
    hiraganaChar = new Char({
      wordID: '1',
      position: 1,
      text: 'あ',
      begin: 10,
      end: 200,
    });
  });

  describe('between duration', () => {
    it('should throw error for compare to own', () => {
      expect(() => whitespaceChar.betweenDuration(whitespaceChar)).toThrow(
        'Can not compare between the same char'
      );
    });
    it('should return the duration between two characters', () => {
      expect(alphabetChar.betweenDuration(numberChar)).toBe(1);
      expect(numberChar.betweenDuration(alphabetChar)).toBe(1);
    });
  });

  describe('duration', () => {
    it('should throw error for characters with the same begin and end', () => {
      expect(() =>
        new Char({
          wordID: '1',
          position: 1,
          text: ' ',
          begin: 1,
          end: 1,
        }).duration()
      ).toThrow('Can not calculate duration of a invalid char');

      expect(() =>
        new Char({
          wordID: '1',
          position: 1,
          text: ' ',
          begin: 2,
          end: 1,
        }).duration()
      ).toThrow('Can not calculate duration of a invalid char');
    });
    it('should return the duration of the character', () => {
      expect(whitespaceChar.duration()).toBe(1);
      expect(twoBytesWhitespaceChar.duration()).toBe(1);
      expect(alphabetChar.duration()).toBe(1);
      expect(numberChar.duration()).toBe(1);
      expect(kanjiChar.duration()).toBe(2.5);
      expect(hiraganaChar.duration()).toBe(190);
    });
  });

  describe('type Whitespace', () => {
    it('should return true for whitespace characters', () => {
      expect(whitespaceChar.type).toBe(CHAR_TYPES.WHITESPACE);
      expect(twoBytesWhitespaceChar.type).toBe(CHAR_TYPES.WHITESPACE);
    });

    it('should return false for non-whitespace characters', () => {
      expect(alphabetChar.type).not.toBe(CHAR_TYPES.WHITESPACE);
      expect(numberChar.type).not.toBe(CHAR_TYPES.WHITESPACE);
      expect(kanjiChar.type).not.toBe(CHAR_TYPES.WHITESPACE);
      expect(hiraganaChar.type).not.toBe(CHAR_TYPES.WHITESPACE);
    });
  });

  describe('type Alphabet', () => {
    it('should return true for alphabet characters', () => {
      expect(alphabetChar.type).toBe(CHAR_TYPES.ALPHABET);
    });

    it('should return false for non-alphabet characters', () => {
      expect(whitespaceChar.type).not.toBe(CHAR_TYPES.ALPHABET);
      expect(twoBytesWhitespaceChar.type).not.toBe(CHAR_TYPES.ALPHABET);
      expect(numberChar.type).not.toBe(CHAR_TYPES.ALPHABET);
      expect(kanjiChar.type).not.toBe(CHAR_TYPES.ALPHABET);
      expect(hiraganaChar.type).not.toBe(CHAR_TYPES.ALPHABET);
    });
  });

  describe('type Number', () => {
    it('should return true for number characters', () => {
      expect(numberChar.type).toBe(CHAR_TYPES.NUMBER);
    });

    it('should return false for non-number characters', () => {
      expect(whitespaceChar.type).not.toBe(CHAR_TYPES.NUMBER);
      expect(twoBytesWhitespaceChar.type).not.toBe(CHAR_TYPES.NUMBER);
      expect(alphabetChar.type).not.toBe(CHAR_TYPES.NUMBER);
      expect(kanjiChar.type).not.toBe(CHAR_TYPES.NUMBER);
      expect(hiraganaChar.type).not.toBe(CHAR_TYPES.NUMBER);
    });
  });

  describe('type Kanji', () => {
    it('should return true for kanji characters', () => {
      expect(kanjiChar.type).toBe(CHAR_TYPES.KANJI);
    });

    it('should return false for non-kanji characters', () => {
      expect(whitespaceChar.type).not.toBe(CHAR_TYPES.KANJI);
      expect(twoBytesWhitespaceChar.type).not.toBe(CHAR_TYPES.KANJI);
      expect(alphabetChar.type).not.toBe(CHAR_TYPES.KANJI);
      expect(numberChar.type).not.toBe(CHAR_TYPES.KANJI);
      expect(hiraganaChar.type).not.toBe(CHAR_TYPES.KANJI);
    });
  });

  describe('type Hiragana', () => {
    it('should return true for hiragana characters', () => {
      expect(hiraganaChar.type).toBe(CHAR_TYPES.HIRAGANA);
    });

    it('should return false for non-hiragana characters', () => {
      expect(whitespaceChar.type).not.toBe(CHAR_TYPES.HIRAGANA);
      expect(twoBytesWhitespaceChar.type).not.toBe(CHAR_TYPES.HIRAGANA);
      expect(alphabetChar.type).not.toBe(CHAR_TYPES.HIRAGANA);
      expect(numberChar.type).not.toBe(CHAR_TYPES.HIRAGANA);
      expect(kanjiChar.type).not.toBe(CHAR_TYPES.HIRAGANA);
    });
  });

  describe('type Katakana', () => {
    it('should return true for katakana characters', () => {
      expect(hiraganaChar.type).toBe(CHAR_TYPES.HIRAGANA);
    });

    it('should return false for non-katakana characters', () => {
      expect(whitespaceChar.type).not.toBe(CHAR_TYPES.HIRAGANA);
      expect(twoBytesWhitespaceChar.type).not.toBe(CHAR_TYPES.HIRAGANA);
      expect(alphabetChar.type).not.toBe(CHAR_TYPES.HIRAGANA);
      expect(numberChar.type).not.toBe(CHAR_TYPES.HIRAGANA);
      expect(kanjiChar.type).not.toBe(CHAR_TYPES.HIRAGANA);
    });
  });

  describe('type Other', () => {
    it('should return true for other characters', () => {
      const otherChar = new Char({
        wordID: '1',
        position: 1,
        text: '!',
        begin: 1,
        end: 2,
      });
      expect(otherChar.type).toBe(CHAR_TYPES.OTHER);
    });
  });

  describe('is current char', () => {
    it('should return true for current char', () => {
      expect(whitespaceChar.isCurrent(0)).true;
      expect(whitespaceChar.isCurrent(1)).true;
      expect(whitespaceChar.isCurrent(2)).false;

      expect(twoBytesWhitespaceChar.isCurrent(0)).false;
      expect(twoBytesWhitespaceChar.isCurrent(1)).true;
      expect(twoBytesWhitespaceChar.isCurrent(2)).true;
    });

    it('offset option', () => {
      expect(
        whitespaceChar.isCurrent(0, {
          offset: 1,
        })
      ).true;
      expect(
        whitespaceChar.isCurrent(1, {
          offset: 1,
        })
      ).false;
      expect(
        whitespaceChar.isCurrent(2, {
          offset: 1,
        })
      ).false;

      expect(
        twoBytesWhitespaceChar.isCurrent(0, {
          offset: -1,
        })
      ).false;
      expect(
        twoBytesWhitespaceChar.isCurrent(1, {
          offset: -1,
        })
      ).false;
      expect(
        twoBytesWhitespaceChar.isCurrent(2, {
          offset: -1,
        })
      ).true;
    });

    it('equal option', () => {
      expect(
        whitespaceChar.isCurrent(0, {
          equal: false,
        })
      ).false;

      expect(
        whitespaceChar.isCurrent(0.1, {
          equal: false,
        })
      ).true;

      expect(
        whitespaceChar.isCurrent(0, {
          offset: 1,
          equal: false,
        })
      ).false;

      expect(
        whitespaceChar.isCurrent(0.1, {
          offset: 1,
          equal: false,
        })
      ).false;
    });
  });

  describe('need between whitespace', () => {
    it('should throw error for compare to own', () => {
      expect(() =>
        whitespaceChar.needBetweenWhitespace(whitespaceChar)
      ).toThrow('Can not compare between the same char');
    });
    it('should return false for whitespace characters followed by whitespace characters', () => {
      expect(whitespaceChar.needBetweenWhitespace(twoBytesWhitespaceChar)).toBe(
        false
      );
      expect(whitespaceChar.needBetweenWhitespace(alphabetChar)).toBe(false);
      expect(whitespaceChar.needBetweenWhitespace(numberChar)).toBe(false);
      expect(whitespaceChar.needBetweenWhitespace(kanjiChar)).toBe(false);
      expect(whitespaceChar.needBetweenWhitespace(hiraganaChar)).toBe(false);
      expect(twoBytesWhitespaceChar.needBetweenWhitespace(whitespaceChar)).toBe(
        false
      );
      expect(twoBytesWhitespaceChar.needBetweenWhitespace(alphabetChar)).toBe(
        false
      );
      expect(twoBytesWhitespaceChar.needBetweenWhitespace(numberChar)).toBe(
        false
      );
      expect(twoBytesWhitespaceChar.needBetweenWhitespace(kanjiChar)).toBe(
        false
      );
      expect(twoBytesWhitespaceChar.needBetweenWhitespace(hiraganaChar)).toBe(
        false
      );
    });
    it('should return false for japanese characters followed by japanese characters', () => {
      expect(kanjiChar.needBetweenWhitespace(hiraganaChar)).toBe(false);
      expect(hiraganaChar.needBetweenWhitespace(kanjiChar)).toBe(false);
    });

    it('should return true for alphabet characters followed by non-alphabet characters', () => {
      expect(alphabetChar.needBetweenWhitespace(whitespaceChar)).toBe(false);
      expect(alphabetChar.needBetweenWhitespace(twoBytesWhitespaceChar)).toBe(
        false
      );
      expect(alphabetChar.needBetweenWhitespace(numberChar)).toBe(true);
      expect(alphabetChar.needBetweenWhitespace(kanjiChar)).toBe(true);
      expect(alphabetChar.needBetweenWhitespace(hiraganaChar)).toBe(true);
    });

    it('should return true for number characters followed by non-number characters', () => {
      expect(numberChar.needBetweenWhitespace(alphabetChar)).toBe(true);
      expect(numberChar.needBetweenWhitespace(kanjiChar)).toBe(true);
      expect(numberChar.needBetweenWhitespace(hiraganaChar)).toBe(true);
    });

    it('should return true for japanese characters followed by non-japanese characters', () => {
      expect(kanjiChar.needBetweenWhitespace(alphabetChar)).toBe(true);
      expect(kanjiChar.needBetweenWhitespace(numberChar)).toBe(true);
      expect(kanjiChar.needBetweenWhitespace(hiraganaChar)).toBe(false);
      expect(hiraganaChar.needBetweenWhitespace(alphabetChar)).toBe(true);
      expect(hiraganaChar.needBetweenWhitespace(numberChar)).toBe(true);
      expect(hiraganaChar.needBetweenWhitespace(kanjiChar)).toBe(false);
    });
  });
});
