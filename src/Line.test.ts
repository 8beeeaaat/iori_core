import { beforeEach, describe, expect, it } from 'vitest';
import { Line } from './Line';

describe('Line', () => {
  let line: Line;

  beforeEach(() => {
    line = new Line({
      position: 1,
      timelines: new Map([
        [
          1,
          {
            begin: 0.2,
            end: 0.5,
            text: '開か',
          },
        ],
        [
          2,
          {
            begin: 0.65,
            end: 1,
            text: 'ない',
            hasNewLine: true,
          },
        ],
        [
          3,
          {
            begin: 1.5,
            end: 2,
            text: 'カーテン',
            hasNewLine: true,
          },
        ],
        [
          4,
          {
            begin: 2.5,
            end: 3,
            text: '割れ',
          },
        ],
        [
          5,
          {
            begin: 3,
            end: 3.2,
            text: 'た',
            hasNewLine: true,
          },
        ],
        [
          6,
          {
            begin: 3.2,
            end: 3.5,
            text: 'カップ',
          },
        ],
      ]),
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
        timelines: new Map([
          [
            1,
            {
              begin: 3,
              end: 4,
              text: 'foo',
            },
          ],
          [
            2,
            {
              begin: 4,
              end: 5,
              text: 'bar',
            },
          ],
        ]),
      });

      expect(line.betweenDuration(other)).toBe(-4.8);

      expect(other.betweenDuration(line)).toBe(-0.5);
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
          timelines: new Map([
            [
              1,
              {
                begin: 1,
                end: 1.5,
                text: 'foo',
              },
            ],
            [
              2,
              {
                begin: 0,
                end: 0.5,
                text: 'bar',
              },
            ],
          ]),
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
