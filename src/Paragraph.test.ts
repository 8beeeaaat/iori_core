import { beforeEach, describe, expect, it } from "vitest";
import {
  Paragraph,
  type ParagraphCreateArgs,
  type ParagraphUpdateArgs,
  isParagraphCreateArgs,
} from "./Paragraph";

describe("Paragraph", () => {
  let paragraph: Paragraph;

  beforeEach(async () => {
    paragraph = await new Paragraph({
      lyricID: "1",
      position: 1,
      timelines: [
        [
          {
            begin: 1.1,
            end: 1.2,
            text: "foo",
            hasWhitespace: true,
          },
          {
            begin: 1.3,
            end: 1.5,
            text: "bar",
          },
        ],
        [
          {
            begin: 2,
            end: 2.5,
            text: "an",
            hasWhitespace: true,
          },
          {
            begin: 2.5,
            end: 3,
            text: "apple",
          },
        ],
        [
          {
            begin: 5,
            end: 5.5,
            text: "青春大戦争",
          },
        ],
        [
          {
            begin: 5.3,
            end: 6,
            text: "ご縁がない",
          },
        ],
        [
          {
            begin: 32.45,
            end: 34.201,
            text: "ぐるぐるぐるぐるぐるぐるぐるぐる",
          },
        ],
        [
          {
            begin: 34.201,
            end: 34.681,
            text: "頭",
          },
        ],
        [
          {
            begin: 34.681,
            end: 35.185,
            text: "の中",
          },
        ],
        [
          {
            begin: 35.185,
            end: 36,
            text: "意味不明で",
          },
        ],
      ],
    }).init();
  });

  describe("update", () => {
    it("before update", () => {
      expect(
        paragraph.lineByPosition.get(1)?.wordByPosition.get(1)?.timeline,
      ).toStrictEqual({
        wordID: paragraph.lineByPosition.get(1)?.wordByPosition.get(1)?.id,
        begin: 1.1,
        end: 1.2,
        text: "foo",
        hasNewLine: false,
        hasWhitespace: true,
      });
    });

    it("should return the updated line", async () => {
      const updatedJointNearWordLine = await paragraph.update({
        position: 1,
        timelines: [
          [
            {
              wordID:
                paragraph.lineByPosition.get(1)?.wordByPosition.get(1)?.id ||
                "word-1",
              begin: 0.3,
              end: 0.5,
              text: "開か",
            },
            {
              wordID:
                paragraph.lineByPosition.get(1)?.wordByPosition.get(2)?.id ||
                "word-2",
              begin: 0.65,
              end: 1,
              text: "ない",
              hasNewLine: true,
            },
          ],
        ],
      });
      expect(
        updatedJointNearWordLine.lineByPosition.get(1)?.wordByPosition.get(1)
          ?.id,
      ).toStrictEqual(
        paragraph.lineByPosition.get(1)?.wordByPosition.get(1)?.id,
      );
      expect(
        updatedJointNearWordLine.lineByPosition.get(1)?.wordByPosition.get(1)
          ?.timeline,
      ).toStrictEqual({
        wordID: paragraph.lineByPosition.get(1)?.wordByPosition.get(1)?.id,
        begin: 0.3,
        end: 1,
        text: "開かない",
        hasNewLine: true,
        hasWhitespace: false,
      });
    });
  });

  describe("between duration", () => {
    it("should throw error for compare to own", () => {
      expect(() => paragraph.betweenDuration(paragraph)).toThrow(
        "Can not compare between the same paragraph",
      );
    });
    it("should return the duration between two paragraphs", async () => {
      const other = await new Paragraph({
        lyricID: "1",
        position: 2,
        timelines: [
          [
            {
              begin: 41,
              end: 41.5,
              text: "foo",
              hasWhitespace: true,
            },
            {
              begin: 41.5,
              end: 42,
              text: "bar",
            },
          ],
          [
            {
              begin: 42,
              end: 42.5,
              text: "an",
              hasWhitespace: true,
            },
            {
              begin: 42.5,
              end: 43,
              text: "apple",
            },
          ],
        ],
      }).init();

      expect(paragraph.betweenDuration(other)).toBe(5);

      expect(other.betweenDuration(paragraph)).toBe(5);
    });
  });

  describe("currentLine", () => {
    it('should return the Line of "foo bar"', () => {
      const line = paragraph.currentLine(1.3);
      expect(line?.text()).toBe("foo bar");
    });

    it("should return undefined, because not found", () => {
      const line = paragraph.currentLine(1);
      expect(line).toBeUndefined();
    });

    it("should return undefined, because not equal", () => {
      const line = paragraph.currentLine(1.1, {
        equal: false,
      });
      expect(line).toBeUndefined();
    });

    it('should return the Line of "foo bar"', () => {
      let line = paragraph.currentLine(1.1, { offset: 0.01 });
      expect(line?.text()).toBe("foo bar");

      line = paragraph.currentLine(1.1, { equal: true });
      expect(line?.text()).toBe("foo bar");
    });

    it('should return the Line of "青春大戦争 ご縁がない"', () => {
      const line = paragraph.currentLine(5.3);
      expect(line?.text()).toBe("青春大戦争 ご縁がない");
    });

    it('should return the Line of "ぐるぐるぐるぐるぐるぐるぐるぐる"', () => {
      const line = paragraph.currentLine(33);
      expect(line?.text()).toBe("ぐるぐるぐるぐるぐるぐるぐるぐる");
    });
  });

  describe("currentLines", () => {
    it('should return the Line of "foo bar"', () => {
      const lines = paragraph.currentLines(1.3);
      expect(lines.length).toBe(1);
      expect(lines[0].text()).toBe("foo bar");
    });

    it("should return undefined, because not found", () => {
      const lines = paragraph.currentLines(1);
      expect(lines.length).toBe(0);
    });

    it("should return undefined, because not equal", () => {
      const lines = paragraph.currentLines(1.1, {
        equal: false,
      });
      expect(lines.length).toBe(0);
    });

    it('should return the Line of "foo bar"', () => {
      let lines = paragraph.currentLines(1.1, { offset: 0.01 });
      expect(lines.length).toBe(1);
      expect(lines[0].text()).toBe("foo bar");

      lines = paragraph.currentLines(1.1, { equal: true });
      expect(lines.length).toBe(1);
      expect(lines[0].text()).toBe("foo bar");
    });
  });

  describe("lineAt", () => {
    it("should return the Line", () => {
      expect(paragraph.lineAt(2)?.text()).toBe("an apple");
    });
  });

  describe("duration", async () => {
    const other = await new Paragraph({
      lyricID: "1",
      position: 1,
      timelines: [],
    }).init();
    it("should throw error for paragraph with the same begin and end", () => {
      expect(() => other.duration()).toThrow(
        "Can not calculate duration of a invalid paragraph",
      );
    });
    it("should return the duration of the line", () => {
      expect(paragraph.duration()).toBe(34.9);
    });
  });

  describe("speed", async () => {
    it("should return the speed of the line", () => {
      expect(paragraph.speed()).toBe(9.14);
    });
  });

  describe("voids", () => {
    it("should return between paragraphs", () => {
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
        {
          begin: 3,
          duration: 2,
          end: 5,
        },
        {
          begin: 6,
          duration: 26.45,
          end: 32.45,
        },
      ]);
    });
  });

  describe("isVoid", () => {
    it("is void", () => {
      expect(paragraph.isVoid(1.2)).toBe(true);
    });
    it("not void", () => {
      expect(paragraph.isVoid(1.4)).toBe(false);
    });

    describe("isParagraphCreateArgs", () => {
      it("should return true when object has lyricID", () => {
        const createArgs: ParagraphCreateArgs = {
          lyricID: "test-id",
          position: 1,
          timelines: [],
        };
        expect(isParagraphCreateArgs(createArgs)).toBe(true);
      });

      it("should return false when object does not have lyricID", () => {
        const updateArgs: ParagraphUpdateArgs = {
          position: 1,
          timelines: [],
        };
        expect(isParagraphCreateArgs(updateArgs)).toBe(false);
      });

      it("should return true when lyricID is an empty string", () => {
        const createArgs = {
          lyricID: "",
          position: 1,
          timelines: [],
        };
        expect(isParagraphCreateArgs(createArgs)).toBe(true);
      });
    });
  });
});
