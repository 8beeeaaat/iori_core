import { beforeEach, describe, expect, it } from 'vitest';
import { Word } from './Word';

describe('Word', () => {
  let word: Word;

  beforeEach(() => {
    word = new Word({
      position: 1,
      timeline: {
        begin: 0,
        end: 1,
        text: 'abcd',
      },
    });
  });
  describe('between duration', () => {
    it('should throw error for compare to own', () => {
      expect(() => word.betweenDuration(word)).toThrow(
        'Can not compare between the same word'
      );
    });
    it('should return the duration between two words', () => {
      const other = new Word({
        position: 1,
        timeline: {
          begin: 2,
          end: 3,
          text: '123',
        },
      });
      expect(word.betweenDuration(other)).toBe(1);
      expect(other.betweenDuration(word)).toBe(1);
    });
  });

  describe('charAt', () => {
    it('should return the Char of "b"', () => {
      expect(word.charAt(2)?.text).toBe('b');
    });
  });

  describe('duration', () => {
    it('should throw error for word with the same begin and end', () => {
      expect(() =>
        new Word({
          position: 1,
          timeline: {
            begin: 1,
            end: 1,
            text: '',
          },
        }).duration()
      ).toThrow('Can not calculate duration of a invalid word');

      expect(() =>
        new Word({
          position: 1,
          timeline: {
            begin: 2,
            end: 1,
            text: '',
          },
        }).duration()
      ).toThrow('Can not calculate duration of a invalid word');
    });
    it('should return the duration of the word', () => {
      expect(word.duration()).toBe(1);
    });
  });

  describe('durationByChar', () => {
    it('should return the duration of each character in the word', () => {
      expect(word.durationByChar()).toBe(0.25);
    });
  });

  describe('text', () => {
    it('should return the text of the word', () => {
      expect(word.text()).toBe('abcd');
    });
  });
});
