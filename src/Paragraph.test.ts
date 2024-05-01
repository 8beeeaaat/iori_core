import { beforeEach, describe, expect, it } from 'vitest';
import { Paragraph } from './Paragraph';

describe('Paragraph', () => {
  let paragraph: Paragraph;

  beforeEach(async () => {
    paragraph = await new Paragraph({
      lyricID: '1',
      position: 1,
      timelines: [
        [
          {
            begin: 1.1,
            end: 1.2,
            text: 'foo',
            hasWhitespace: true,
          },
          {
            begin: 1.3,
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
    }).init();
  });
  describe('between duration', () => {
    it('should throw error for compare to own', () => {
      expect(() => paragraph.betweenDuration(paragraph)).toThrow(
        'Can not compare between the same paragraph'
      );
    });
    it('should return the duration between two paragraphs', async () => {
      const other = await new Paragraph({
        lyricID: '1',
        position: 2,
        timelines: [
          [
            {
              begin: 10,
              end: 10.5,
              text: 'foo',
              hasWhitespace: true,
            },
            {
              begin: 10.5,
              end: 11,
              text: 'bar',
            },
          ],
          [
            {
              begin: 12,
              end: 12.5,
              text: 'an',
              hasWhitespace: true,
            },
            {
              begin: 12.5,
              end: 13,
              text: 'apple',
            },
          ],
        ],
      }).init();

      expect(paragraph.betweenDuration(other)).toBe(7);

      expect(other.betweenDuration(paragraph)).toBe(7);
    });
  });

  describe('currentLine', () => {
    it('should return the Line of "foo bar"', () => {
      const line = paragraph.currentLine(1.3);
      expect(line?.text()).toBe('foo bar');
    });

    it('should return undefined, because not found', () => {
      const line = paragraph.currentLine(1);
      expect(line).toBeUndefined();
    });

    it('should return undefined, because not equal', () => {
      const line = paragraph.currentLine(1.1);
      expect(line).toBeUndefined();
    });

    it('should return the Line of "foo bar"', () => {
      let line = paragraph.currentLine(1.1, { offset: 0.01 });
      expect(line?.text()).toBe('foo bar');

      line = paragraph.currentLine(1.1, { equal: true });
      expect(line?.text()).toBe('foo bar');
    });
  });

  describe('currentLines', () => {
    it('should return the Line of "foo bar"', () => {
      const lines = paragraph.currentLines(1.3);
      expect(lines.length).toBe(1);
      expect(lines[0].text()).toBe('foo bar');
    });

    it('should return undefined, because not found', () => {
      const lines = paragraph.currentLines(1);
      expect(lines.length).toBe(0);
    });

    it('should return undefined, because not equal', () => {
      const lines = paragraph.currentLines(1.1);
      expect(lines.length).toBe(0);
    });

    it('should return the Line of "foo bar"', () => {
      let lines = paragraph.currentLines(1.1, { offset: 0.01 });
      expect(lines.length).toBe(1);
      expect(lines[0].text()).toBe('foo bar');

      lines = paragraph.currentLines(1.1, { equal: true });
      expect(lines.length).toBe(1);
      expect(lines[0].text()).toBe('foo bar');
    });
  });

  describe('lineAt', () => {
    it('should return the Line', () => {
      expect(paragraph.lineAt(2)?.text()).toBe('an apple');
    });
  });

  describe('duration', () => {
    it('should throw error for paragraph with the same begin and end', async () => {
      const paragraph = await new Paragraph({
        lyricID: '1',
        position: 1,
        timelines: [],
      }).init();
      expect(() => paragraph.duration()).toThrow(
        'Can not calculate duration of a invalid paragraph'
      );
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
