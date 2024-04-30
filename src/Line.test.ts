import { beforeEach, describe, expect, it } from 'vitest';
import { Line } from './Line';

describe('Line', () => {
  let line: Line;

  beforeEach(() => {
    line = new Line({
      position: 1,
      timelines: [
        {
          begin: 0.2,
          end: 0.5,
          text: '開か',
        },
        {
          begin: 0.65,
          end: 1,
          text: 'ない',
          hasNewLine: true,
        },
        {
          begin: 1.5,
          end: 2,
          text: 'カーテン',
          hasNewLine: true,
        },
        {
          begin: 2.5,
          end: 3,
          text: '割れ',
        },
        {
          begin: 3,
          end: 3.2,
          text: 'た',
          hasNewLine: true,
        },
        {
          begin: 3.2,
          end: 3.5,
          text: 'カップ',
        },
      ],
    });
  });
  describe('between duration', () => {
    it('should throw error for compare to own', () => {
      expect(() => line.betweenDuration(line)).toThrow(
        'Can not compare between the same line'
      );
    });
    it('should return the duration between two lines', () => {
      const other = new Line({
        position: 2,
        timelines: [
          {
            begin: 3,
            end: 4,
            text: 'foo',
          },
          {
            begin: 4,
            end: 5,
            text: 'bar',
          },
        ],
      });

      expect(line.betweenDuration(other)).toBe(-4.8);

      expect(other.betweenDuration(line)).toBe(-0.5);
    });
  });

  describe('currentWord', () => {
    it('should return the Word of "開かない"', () => {
      const word = line.currentWord(0.3);
      expect(word?.text()).toBe('開かない');
    });

    it('should return undefined, because not found', () => {
      const word = line.currentWord(1.2);
      expect(word).toBeUndefined();
    });

    it('should return undefined, because not equal', () => {
      const word = line.currentWord(2.5);
      expect(word).toBeUndefined();
    });

    it('should return the Word of "割れた"', () => {
      let word = line.currentWord(2.5, { offset: 0.01 });
      expect(word?.text()).toBe('割れた');

      word = line.currentWord(2.5, { equal: true });
      expect(word?.text()).toBe('割れた');
    });
  });

  describe('currentWords', () => {
    it('should return the Word of "開かない"', () => {
      const words = line.currentWords(0.3);
      expect(words.length).toBe(1);
      expect(words[0].text()).toBe('開かない');
    });

    it('should return undefined, because not found', () => {
      const words = line.currentWords(1.2);
      expect(words.length).toBe(0);
    });

    it('should return undefined, because not equal', () => {
      const words = line.currentWords(2.5);
      expect(words.length).toBe(0);
    });

    it('should return the Word of "割れた"', () => {
      let words = line.currentWords(2.5, { offset: 0.01 });
      expect(words.length).toBe(1);
      expect(words[0].text()).toBe('割れた');

      words = line.currentWords(2.5, { equal: true });
      expect(words.length).toBe(1);
      expect(words[0].text()).toBe('割れた');
    });
  });

  describe('wordAt', () => {
    it('should return the Word of "割れた", because space removed', () => {
      expect(line.wordAt(3)?.text()).toBe('割れた');
    });
  });

  describe('duration', () => {
    it('should throw error for line with the invalid begin and end', () => {
      expect(() =>
        new Line({
          position: 1,
          timelines: [
            {
              begin: 1,
              end: 1.5,
              text: 'foo',
            },
            {
              begin: 0,
              end: 0.5,
              text: 'bar',
            },
          ],
        }).duration()
      ).toThrow('Can not calculate duration of a invalid line');
    });
    it('should return the duration of the line', () => {
      expect(line.duration()).toBe(3.3);
    });
  });

  describe('text', () => {
    it('should return the text of the line', () => {
      expect(line.text()).toBe(`開かない\nカーテン\n割れた\nカップ`);
    });
  });

  describe('voids', () => {
    it('should return between paragraphs', () => {
      expect(line.voids()).toStrictEqual([
        {
          begin: 1,
          duration: 0.5,
          end: 1.5,
        },
        {
          begin: 2,
          duration: 0.5,
          end: 2.5,
        },
      ]);
    });
  });

  describe('isVoid', () => {
    it('is void', () => {
      expect(line.isVoid(1.2)).toBe(true);
    });
    it('not void', () => {
      expect(line.isVoid(1.6)).toBe(false);
    });
  });

  describe('wordGridPositionByWordID', () => {
    it('is void', () => {
      const map = line.wordGridPositionByWordID();
      expect(map.size).toBe(4);
      // 開か ない
      // カーテン
      // 割れ た
      // カップ

      const targetWord1 = line.wordByPosition.get(1);
      expect(targetWord1?.text()).toBe('開かない');

      const targetWord4 = line.wordByPosition.get(4);
      expect(targetWord4?.text()).toBe('カップ');

      expect(map.get(targetWord1?.id || '')).toStrictEqual({
        row: 1,
        column: 1,
        word: targetWord1,
      });
      expect(map.get(targetWord4?.id || '')).toStrictEqual({
        row: 4,
        column: 1,
        word: targetWord4,
      });
    });
  });
});
