import { beforeEach, describe, expect, it } from 'vitest';
import { LineArgs } from './Line';
import { Lyric } from './Lyric';

describe('Lyric', () => {
  let lyric: Lyric;
  let lyricUsedTokenizer: Lyric;

  beforeEach(async () => {
    const args = {
      duration: 10,
      timelines: [
        [
          [
            {
              begin: 0.5,
              end: 1,
              text: 'foo',
              hasWhitespace: true,
            },
            {
              begin: 1,
              end: 1.5,
              text: 'bar',
            },
          ],
          [
            {
              begin: 2,
              end: 2.5,
              text: 'an',
              hasWhitespace: true,
            },
            {
              begin: 2.5,
              end: 3,
              text: 'apple',
            },
          ],
        ],
      ],
      resourceID: 'lyric1',
    };
    lyric = await new Lyric(args).init();
    lyricUsedTokenizer = await new Lyric({
      ...args,
      tokenizer: function (args: LineArgs): Promise<Map<number, LineArgs>> {
        return new Promise((resolve) => {
          resolve(
            new Map([
              [
                args.position,
                {
                  position: args.position,
                  timelines: args.timelines,
                },
              ],
            ])
          );
        });
      },
    }).init();
  });

  describe('paragraphAt', () => {
    it('should return the Paragraph', () => {
      expect(lyric.paragraphAt(1)?.duration()).toBe(2.5);
      expect(lyricUsedTokenizer.paragraphAt(1)?.duration()).toBe(2.5);
    });
  });

  describe('voids', () => {
    it('should return between paragraphs', () => {
      const expects = [
        {
          begin: 0,
          duration: 0.5,
          end: 0.5,
        },
        {
          begin: 1.5,
          duration: 0.5,
          end: 2,
        },
        {
          begin: 3,
          duration: 7,
          end: 10,
        },
      ];
      expect(lyric.voids()).toStrictEqual(expects);
      expect(lyricUsedTokenizer.voids()).toStrictEqual(expects);
    });
  });

  describe('isVoid', () => {
    it('is void', () => {
      expect(lyric.isVoid(0.2)).toBe(true);
      expect(lyricUsedTokenizer.isVoid(0.2)).toBe(true);
    });
    it('not void', () => {
      expect(lyric.isVoid(1)).toBe(false);
      expect(lyricUsedTokenizer.isVoid(1)).toBe(false);
    });
  });
});
