import { beforeEach, describe, expect, it } from 'vitest';
import { Line } from './Line';

const timelines = [
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
    hasWhitespace: true,
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
];

describe('Line', () => {
  let jointNearWordLine: Line;
  let notJointNearWordLine: Line;

  beforeEach(() => {
    jointNearWordLine = new Line({
      jointNearWord: true,
      position: 1,
      timelines,
    });
    notJointNearWordLine = new Line({
      jointNearWord: false,
      position: 1,
      timelines,
    });
  });

  describe('update', () => {
    it('before update', () => {
      expect(jointNearWordLine.wordByPosition.get(1)!.timeline).toStrictEqual({
        wordID: jointNearWordLine.wordByPosition.get(1)!.id,
        begin: 0.2,
        end: 1,
        text: '開かない',
        hasNewLine: true,
        hasWhitespace: false,
      });

      expect(
        notJointNearWordLine.wordByPosition.get(1)!.timeline
      ).toStrictEqual({
        wordID: notJointNearWordLine.wordByPosition.get(1)!.id,
        begin: 0.2,
        end: 0.5,
        text: '開か',
        hasNewLine: false,
        hasWhitespace: false,
      });
    });

    it('should return the updated line', () => {
      const beforeJointNearWordID = jointNearWordLine.wordByPosition.get(1)!.id;

      const updatedJointNearWordLine = jointNearWordLine.update({
        position: 1,
        timelines: [
          {
            wordID: jointNearWordLine.wordByPosition.get(1)!.id,
            begin: 0.3,
            end: 0.5,
            text: '開か',
          },
          {
            wordID: jointNearWordLine.wordByPosition.get(2)!.id,
            begin: 0.65,
            end: 1,
            text: 'ない',
            hasNewLine: true,
          },
        ],
        jointNearWord: true,
      });

      expect(updatedJointNearWordLine.wordByPosition.get(1)!.id).toStrictEqual(
        beforeJointNearWordID
      );
      expect(
        updatedJointNearWordLine.wordByPosition.get(1)!.timeline
      ).toStrictEqual({
        wordID: beforeJointNearWordID,
        begin: 0.3,
        end: 1,
        text: '開かない',
        hasNewLine: true,
        hasWhitespace: false,
      });

      const beforeNotJointNearWordID =
        notJointNearWordLine.wordByPosition.get(1)!.id;

      const updatedNotJointNearWordLine = notJointNearWordLine.update({
        position: 1,
        timelines: [
          {
            wordID: notJointNearWordLine.wordByPosition.get(1)!.id,
            begin: 0.3,
            end: 0.5,
            text: '開か',
          },
          {
            wordID: notJointNearWordLine.wordByPosition.get(2)!.id,
            begin: 0.65,
            end: 1,
            text: 'ない',
            hasNewLine: true,
          },
        ],
        jointNearWord: false,
      });
      expect(
        updatedNotJointNearWordLine.wordByPosition.get(1)!.id
      ).toStrictEqual(beforeNotJointNearWordID);
      expect(
        updatedNotJointNearWordLine.wordByPosition.get(1)!.timeline
      ).toStrictEqual({
        wordID: beforeNotJointNearWordID,
        begin: 0.3,
        end: 0.5,
        text: '開か',
        hasNewLine: false,
        hasWhitespace: false,
      });
    });
  });

  describe('between duration', () => {
    it('should throw error for compare to own', () => {
      expect(() =>
        jointNearWordLine.betweenDuration(jointNearWordLine)
      ).toThrow('Can not compare between the same line');
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

      expect(jointNearWordLine.betweenDuration(other)).toBe(-4.8);

      expect(other.betweenDuration(jointNearWordLine)).toBe(-0.5);
    });
  });

  describe('currentRow', () => {
    it('should return the Word of "開かない"', () => {
      const row = jointNearWordLine.currentRow(0.3);
      expect(row).toBe(1);
    });

    it('should return last matched current row', () => {
      const row = jointNearWordLine.currentRow(3.2);
      expect(row).toBe(4);
    });

    it('should return undefined, because not found', () => {
      const row = jointNearWordLine.currentRow(1.2);
      expect(row).toBeUndefined();
    });

    it('should return undefined, because not equal', () => {
      expect(
        jointNearWordLine.currentRow(2.5, { equal: false })
      ).toBeUndefined();
    });

    it('should return the Word of "割れた"', () => {
      let row = jointNearWordLine.currentRow(2.5, { offset: 0.01 });
      expect(row).toBe(3);

      row = jointNearWordLine.currentRow(2.5, { equal: true });
      expect(row).toBe(3);
    });
  });

  describe('currentWord', () => {
    it('should return the Word of "開かない"', () => {
      const word = jointNearWordLine.currentWord(0.3);
      expect(word?.text()).toBe('開かない');
    });

    it('should return last matched current word', () => {
      const word = jointNearWordLine.currentWord(3.2);
      expect(word?.text()).toBe('カップ');
    });

    it('should return undefined, because not found', () => {
      const word = jointNearWordLine.currentWord(1.2);
      expect(word).toBeUndefined();
    });

    it('should return undefined, because not equal', () => {
      expect(
        jointNearWordLine.currentWord(2.5, { equal: false })
      ).toBeUndefined();
    });

    it('should return the Word of "割れた"', () => {
      let word = jointNearWordLine.currentWord(2.5, { offset: 0.01 });
      expect(word?.text()).toBe('割れた');

      word = jointNearWordLine.currentWord(2.5, { equal: true });
      expect(word?.text()).toBe('割れた');
    });
  });

  describe('currentWords', () => {
    it('should return the Word of "開かない"', () => {
      const words = jointNearWordLine.currentWords(0.3);
      expect(words.length).toBe(1);
      expect(words[0].text()).toBe('開かない');
    });

    it('should return undefined, because not found', () => {
      const words = jointNearWordLine.currentWords(1.2);
      expect(words.length).toBe(0);
    });

    it('should return undefined, because not equal', () => {
      const words = jointNearWordLine.currentWords(2.5);
      expect(words.length).toBe(0);
    });

    it('should return the Word of "割れた"', () => {
      let words = jointNearWordLine.currentWords(2.5, { offset: 0.01 });
      expect(words.length).toBe(1);
      expect(words[0].text()).toBe('割れた');

      words = jointNearWordLine.currentWords(2.5, { equal: true });
      expect(words.length).toBe(1);
      expect(words[0].text()).toBe('割れた');
    });
  });

  describe('wordAt', () => {
    it('should return the Word of "割れた", because space removed', () => {
      expect(jointNearWordLine.wordAt(3)?.text()).toBe('割れた');
    });
  });

  describe('duration', () => {
    it('should return the duration of the line', () => {
      expect(jointNearWordLine.duration()).toBe(3.3);
    });
  });

  describe('text', () => {
    it('should return the text of the line', () => {
      expect(jointNearWordLine.text()).toBe(
        '開かない\nカーテン\n割れた\nカップ'
      );
    });
  });

  describe('voids', () => {
    it('should return between paragraphs', () => {
      expect(jointNearWordLine.voids()).toStrictEqual([
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
      expect(jointNearWordLine.isVoid(1.2)).toBe(true);
    });
    it('not void', () => {
      expect(jointNearWordLine.isVoid(1.6)).toBe(false);
    });
  });

  describe('wordGridPositionByWordID', () => {
    it('is void', () => {
      const map = jointNearWordLine.wordGridPositionByWordID();
      expect(map.size).toBe(4);
      expect(Array.from(map.values()).reduce<Array<{
        column: number;
        row: number;
        text: string;
      }>>((sum, p) => {
        sum.push({
          column: p.column,
          row: p.row,
          text: p.word.text()
        })
        return sum
      }, [])).toStrictEqual(
        [
          {
            'row': 1,
            'column': 1,
            'text': '開かない',
          },
          {
            'row': 2,
            'column': 1,
            'text': 'カーテン',
          },
          {
            'row': 3,
            'column': 1,
            'text': '割れた',
          },
          {
            'row': 4,
            'column': 1,
            'text': 'カップ',
          },
        ]
      );

      const targetWord1 = jointNearWordLine.wordByPosition.get(1);
      expect(targetWord1?.text()).toBe('開かない');

      const targetWord4 = jointNearWordLine.wordByPosition.get(4);
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

  describe('rowWords', () => {
    it('is void', () => {
      const map = jointNearWordLine.rowWords(1);
      expect(map.length).toBe(1);
      expect(map[0].text()).toBe('開かない');
    });
  });

  describe('wordsByRow', () => {
    it('is void', () => {
      const map = jointNearWordLine.wordsByRow();
      expect(map.size).toBe(4);
      expect(Array.from(map.values()).reduce<Array<string>>((sum, words) => {
        sum.push(words.map(w => w.text()).join(' '));
        return sum;
      }, [])).toStrictEqual(
        [
          '開かない',
          'カーテン',
          '割れた',
          'カップ',
        ]);
    });
  });

  describe('wordRowPosition', () => {
    it('is void', () => {
      const targetWord1 = jointNearWordLine.wordByPosition.get(1);
      expect(targetWord1?.text()).toBe('開かない');

      const row = jointNearWordLine.wordRowPosition(targetWord1!.id);
      expect(row).toBe(1);
    });
  });

  describe('is current line', () => {
    const line = new Line({
      position: 1,
      timelines: [
        {
          begin: 0.5,
          end: 1,
          text: 'foo',
        },
        {
          begin: 0,
          end: 0.5,
          text: 'bar',
        },
      ],
    });

    const otherLine = new Line({
      position: 2,
      timelines: [
        {
          begin: 1,
          end: 1.5,
          text: 'hoge',
        },
        {
          begin: 1.5,
          end: 2,
          text: 'fuga',
        },
      ],
    });

    it('should return true for current line', () => {
      expect(line.isCurrent(0)).toBe(true);
      expect(line.isCurrent(1)).toBe(true);
      expect(line.isCurrent(2)).toBe(false);

      expect(otherLine.isCurrent(0)).toBe(false);
      expect(otherLine.isCurrent(1)).toBe(true);
      expect(otherLine.isCurrent(2)).toBe(true);
    });

    it('offset option', () => {
      expect(
        line.isCurrent(0, {
          offset: 1,
        })
      ).toBe(true);
      expect(
        line.isCurrent(1, {
          offset: 1,
        })
      ).toBe(false);
      expect(
        line.isCurrent(2, {
          offset: 1,
        })
      ).toBe(false);

      expect(
        otherLine.isCurrent(0, {
          offset: -1,
        })
      ).toBe(false);
      expect(
        otherLine.isCurrent(1, {
          offset: -1,
        })
      ).toBe(false);
      expect(
        otherLine.isCurrent(2, {
          offset: -1,
        })
      ).toBe(true);
    });

    it('equal option', () => {
      expect(
        line.isCurrent(0, {
          equal: false,
        })
      ).toBe(false);

      expect(
        line.isCurrent(0.1, {
          equal: false,
        })
      ).toBe(true);

      expect(
        line.isCurrent(0, {
          offset: 1,
          equal: false,
        })
      ).toBe(false);

      expect(
        line.isCurrent(0.1, {
          offset: 1,
          equal: false,
        })
      ).toBe(false);
    });
  });
});
