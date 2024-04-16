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
            text: 'an',
            hasWhitespace: true,
          },
        ],
        [
          2,
          {
            begin: 0.65,
            end: 1,
            text: 'red',
            hasWhitespace: true,
          },
        ],
        [
          3,
          {
            begin: 1.5,
            end: 2,
            text: 'apple',
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

      expect(line.betweenDuration(other)).toBe(1);

      expect(other.betweenDuration(line)).toBe(1);
    });
  });

  describe('wordAt', () => {
    it('should return the Word of "red"', () => {
      expect(line.wordAt(2)?.text()).toBe('red');
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
      expect(line.duration()).toBe(1.8);
    });
  });

  describe('text', () => {
    it('should return the text of the line', () => {
      expect(line.text()).toBe('an red apple');
    });
  });

  describe('voids', () => {
    it('should return between paragraphs', () => {
      expect(line.voids()).toStrictEqual([
        {
          begin: 0.5,
          duration: 0.15,
          end: 0.65,
        },
        {
          begin: 1,
          duration: 0.5,
          end: 1.5,
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
});
