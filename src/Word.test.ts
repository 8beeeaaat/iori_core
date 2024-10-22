import { beforeEach, describe, expect, it } from "vitest";
import { Word } from "./Word";

describe("Word", () => {
  let word: Word;

  beforeEach(() => {
    word = new Word({
      lineID: "1",
      position: 1,
      timeline: {
        begin: 0,
        end: 1,
        text: "abcd",
      },
    });
  });

  describe("update", () => {
    it("should return the updated word", () => {
      const updated = word.update({
        position: 2,
        timeline: {
          wordID: "1",
          begin: 1,
          end: 2,
          text: "123",
        },
      });
      expect(updated.id).toStrictEqual(word.id);
      expect(updated.timeline).toStrictEqual({
        wordID: "1",
        begin: 1,
        end: 2,
        text: "123",
      });
    });
  });

  describe("between duration", () => {
    it("should throw error for compare to own", () => {
      expect(() => word.betweenDuration(word)).toThrow(
        "Can not compare between the same word",
      );
    });
    it("should return the duration between two words", () => {
      const other = new Word({
        lineID: "1",
        position: 1,
        timeline: {
          begin: 2,
          end: 3,
          text: "123",
        },
      });
      expect(word.betweenDuration(other)).toBe(1);
      expect(other.betweenDuration(word)).toBe(1);
    });
  });

  describe("charAt", () => {
    it('should return the Char of "b"', () => {
      expect(word.charAt(2)?.text).toBe("b");
    });
  });

  describe("duration", () => {
    it("should throw error for word with the same begin and end", () => {
      expect(() =>
        new Word({
          lineID: "1",
          position: 1,
          timeline: {
            begin: 1,
            end: 1,
            text: "",
          },
        }).duration(),
      ).toThrow("Can not calculate duration of a invalid word");

      expect(() =>
        new Word({
          lineID: "1",
          position: 1,
          timeline: {
            begin: 2,
            end: 1,
            text: "",
          },
        }).duration(),
      ).toThrow("Can not calculate duration of a invalid word");
    });
    it("should return the duration of the word", () => {
      expect(word.duration()).toBe(1);
    });
  });

  describe("durationByChar", () => {
    it("should return the duration of each character in the word", () => {
      expect(word.durationByChar()).toBe(0.25);
    });
  });

  describe("text", () => {
    it("should return the text of the word", () => {
      expect(word.text()).toBe("abcd");
    });
  });

  describe("speed", () => {
    it("should return word text per seconds", () => {
      expect(word.speed()).toBe(2);
      expect(
        new Word({
          lineID: "1",
          position: 1,
          timeline: {
            begin: 0,
            end: 10,
            text: "123 ４５６ abc あいう アイウ 亜意宇",
          },
        }).speed(),
      ).toBe(1.5);
    });
  });

  describe("currentChar", () => {
    it('should return the Word of "a"', () => {
      expect(word.currentChar(0.2)?.text).toBe("a");
    });

    it("should return last matched current word", () => {
      expect(word.currentChar(0.3)?.text).toBe("b");
    });

    it("should return undefined, because not found", () => {
      expect(word.currentChar(1.1)).toBeUndefined();
    });

    it("should return undefined, because not equal", () => {
      expect(word.currentChar(1, { equal: false })).toBeUndefined();
    });

    it('should return the Word of "b"', () => {
      expect(word.currentChar(0.3, { offset: 0.01 })?.text).toBe("b");
      expect(word.currentChar(0.3, { equal: true })?.text).toBe("b");
    });
  });

  describe("currentChars", () => {
    it('should return the Word of "a"', () => {
      const chars = word.currentChars(0.2);
      expect(chars.length).toBe(1);
      expect(chars[0].text).toBe("a");
    });

    it("should return undefined, because not found", () => {
      const chars = word.currentChars(1.2);
      expect(chars.length).toBe(0);
    });

    it("should return undefined, because not equal", () => {
      const chars = word.currentChars(1, {
        equal: false,
      });
      expect(chars.length).toBe(0);
    });

    it('should return the Word of "b"', () => {
      let chars = word.currentChars(0.3, { offset: 0.01 });
      expect(chars.length).toBe(1);
      expect(chars[0].text).toBe("b");

      chars = word.currentChars(0.3, { equal: true });
      expect(chars.length).toBe(1);
      expect(chars[0].text).toBe("b");
    });
  });

  describe("is current word", () => {
    const otherWord = new Word({
      lineID: "1",
      position: 1,
      timeline: {
        begin: 1,
        end: 2,
        text: "",
      },
    });

    it("should return true for current word", () => {
      expect(word.isCurrent(0)).toBe(true);
      expect(word.isCurrent(1)).toBe(true);
      expect(word.isCurrent(2)).toBe(false);

      expect(otherWord.isCurrent(0)).toBe(false);
      expect(otherWord.isCurrent(1)).toBe(true);
      expect(otherWord.isCurrent(2)).toBe(true);
    });

    it("offset option", () => {
      expect(
        word.isCurrent(0, {
          offset: 1,
        }),
      ).toBe(true);
      expect(
        word.isCurrent(1, {
          offset: 1,
        }),
      ).toBe(false);
      expect(
        word.isCurrent(2, {
          offset: 1,
        }),
      ).toBe(false);

      expect(
        otherWord.isCurrent(0, {
          offset: -1,
        }),
      ).toBe(false);
      expect(
        otherWord.isCurrent(1, {
          offset: -1,
        }),
      ).toBe(false);
      expect(
        otherWord.isCurrent(2, {
          offset: -1,
        }),
      ).toBe(true);
    });

    it("equal option", () => {
      expect(
        word.isCurrent(0, {
          equal: false,
        }),
      ).toBe(false);

      expect(
        word.isCurrent(0.1, {
          equal: false,
        }),
      ).toBe(true);

      expect(
        word.isCurrent(0, {
          offset: 1,
          equal: false,
        }),
      ).toBe(false);

      expect(
        word.isCurrent(0.1, {
          offset: 1,
          equal: false,
        }),
      ).toBe(false);
    });
  });
});
