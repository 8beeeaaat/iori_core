import { beforeEach, describe, expect, it } from 'vitest';
import { Lyric } from './Lyric';

describe('Lyric', () => {
  let lyric: Lyric;

  beforeEach(async () => {
    lyric = await new Lyric({
      id: 'lyric1',
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
    }).init();
  });

  describe('constructor', () => {
    it('should create a new Lyric', () => {
      expect(lyric.id).toBe('lyric1');
      expect(lyric.duration).toBe(10);
      expect(lyric.offsetSec).toBe(0);
    });
  });

  describe('paragraphAt', () => {
    it('should return the Paragraph', () => {
      expect(lyric.paragraphAt(1)?.duration()).toBe(2.5);
    });
  });

  describe('voids', () => {
    it('should return between paragraphs', () => {
      expect(lyric.voids()).toStrictEqual([
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
      ]);
    });
  });

  describe('isVoid', () => {
    it('is void', () => {
      expect(lyric.isVoid(0.2)).toBe(true);
    });
    it('not void', () => {
      expect(lyric.isVoid(1)).toBe(false);
    });
  });

  describe('timelines', () => {
    it('should return the timelines by word', () => {
      expect(lyric.timelines()).toStrictEqual([
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
              hasWhitespace: false,
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
              hasWhitespace: false,
            },
          ],
        ],
      ]);
    });

    it('should return the timelines by line', () => {
      expect(lyric.timelinesByLine()).toStrictEqual([
        [
          {
            begin: 0.5,
            end: 1.5,
            text: 'foo bar',
            hasWhitespace: false,
            hasNewLine: false,
          },
          {
            begin: 2,
            end: 3,
            text: 'an apple',
            hasWhitespace: false,
            hasNewLine: false,
          },
        ],
      ]);
    });
  });
});
