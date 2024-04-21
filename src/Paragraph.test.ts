import { beforeEach, describe, expect, it } from 'vitest';
import { Paragraph } from './Paragraph';

describe('Paragraph', () => {
  let paragraph: Paragraph;

  beforeEach(() => {
    paragraph = new Paragraph({
      lyricID: '1',
      position: 1,
      timelines: new Map([
        [
          1,
          new Map([
            [
              1,
              {
                begin: 1.1,
                end: 1.2,
                text: 'foo',
                hasWhitespace: true,
              },
            ],
            [
              2,
              {
                begin: 1.3,
                end: 1.5,
                text: 'bar',
              },
            ],
          ]),
        ],
        [
          2,
          new Map([
            [
              1,
              {
                begin: 2,
                end: 2.5,
                text: 'an',
                hasWhitespace: true,
              },
            ],
            [
              2,
              {
                begin: 2.5,
                end: 3,
                text: 'apple',
              },
            ],
          ]),
        ],
      ]),
    });
  });
  describe('between duration', () => {
    it('should throw error for compare to own', () => {
      expect(() => paragraph.betweenDuration(paragraph)).toThrow(
        'Can not compare between the same paragraph'
      );
    });
    it('should return the duration between two paragraphs', () => {
      const other = new Paragraph({
        position: 2,
        timelines: new Map([
          [
            1,
            new Map([
              [
                1,
                {
                  begin: 10,
                  end: 10.5,
                  text: 'foo',
                  hasWhitespace: true,
                },
              ],
              [
                2,
                {
                  begin: 10.5,
                  end: 11,
                  text: 'bar',
                },
              ],
            ]),
          ],
          [
            2,
            new Map([
              [
                1,
                {
                  begin: 12,
                  end: 12.5,
                  text: 'an',
                  hasWhitespace: true,
                },
              ],
              [
                2,
                {
                  begin: 12.5,
                  end: 13,
                  text: 'apple',
                },
              ],
            ]),
          ],
        ]),
      });

      expect(paragraph.betweenDuration(other)).toBe(7);

      expect(other.betweenDuration(paragraph)).toBe(7);
    });
  });

  describe('lineAt', () => {
    it('should return the Line', () => {
      expect(paragraph.lineAt(2)?.text()).toBe('an apple');
    });
  });

  describe('duration', () => {
    it('should throw error for paragraph with the same begin and end', () => {
      expect(() =>
        new Paragraph({
          lyricID: '1',
          position: 1,
          timelines: new Map(),
        }).duration()
      ).toThrow('Can not calculate duration of a invalid paragraph');
    });
    it('should return the duration of the line', () => {
      expect(paragraph.duration()).toBe(1.9);
    });
  });

  describe('voids', () => {
    it('should return between paragraphs', () => {
      expect(paragraph.voids()).toStrictEqual([
        {
          begin: 1.2,
          duration: 0.1,
          end: 1.3,
        },
        {
          begin: 1.5,
          duration: 0.5,
          end: 2,
        },
      ]);
    });
  });

  describe('isVoid', () => {
    it('is void', () => {
      expect(paragraph.isVoid(1.2)).toBe(true);
    });
    it('not void', () => {
      expect(paragraph.isVoid(1.4)).toBe(false);
    });
  });
});
