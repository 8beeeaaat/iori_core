import { describe, expect, it } from "vitest";
import {
  createChar,
  createLine,
  createLyric,
  createParagraph,
  createWord,
  getCurrentChar,
  getCurrentLine,
  getCurrentParagraph,
  getCurrentSummary,
  getCurrentWord,
  getLyricSpeed,
  getNextLine,
  getPrevWord,
  getTimelines,
  getTimelinesByLine,
  getVoidPeriods,
  isVoidTime,
  type LyricCreateArgs,
  updateLyric,
  type WordTimeline,
} from "./index";

const sampleTimelines: WordTimeline[][][] = [
  [
    [
      {
        wordID: "word1",
        text: "Hello",
        begin: 0,
        end: 1,
        hasWhitespace: true,
      },
      {
        wordID: "word2",
        text: "World",
        begin: 1,
        end: 2,
      },
    ],
  ],
  [
    [
      {
        wordID: "word3",
        text: "Second",
        begin: 3,
        end: 4,
        hasWhitespace: true,
      },
      {
        wordID: "word4",
        text: "Paragraph",
        begin: 4,
        end: 5,
      },
    ],
  ],
];

const createArgs: LyricCreateArgs = {
  resourceID: "test-song",
  duration: 10,
  timelines: sampleTimelines,
  initID: true,
};

describe("Functional API - Factory Functions", () => {
  it("should create char correctly", () => {
    const char = createChar({
      wordID: "test-word",
      position: 1,
      text: "H",
      begin: 0,
      end: 0.2,
    });

    expect(char.id).toMatch(/^char-/);
    expect(char.wordID).toBe("test-word");
    expect(char.text).toBe("H");
    expect(char.position).toBe(1);
    expect(char.begin).toBe(0);
    expect(char.end).toBe(0.2);
    expect(char.type).toBe("alphabet");
  });

  it("should create word correctly", () => {
    const word = createWord({
      lineID: "test-line",
      position: 1,
      timeline: {
        wordID: "test-word",
        text: "Hello",
        begin: 0,
        end: 1,
      },
    });

    expect(word.id).toBe("test-word");
    expect(word.lineID).toBe("test-line");
    expect(word.position).toBe(1);
    expect(word.chars).toHaveLength(5);
    expect(word.chars[0].text).toBe("H");
    expect(word.chars[4].text).toBe("o");
  });

  it("should create line correctly", () => {
    const line = createLine({
      position: 1,
      timelines: [
        {
          wordID: "word1",
          text: "Hello",
          begin: 0,
          end: 1,
          hasWhitespace: true,
        },
        {
          wordID: "word2",
          text: "World",
          begin: 1,
          end: 2,
        },
      ],
    });

    expect(line.id).toMatch(/^line-/);
    expect(line.position).toBe(1);
    expect(line.words).toHaveLength(2);
    expect(line.words[0].timeline.text).toBe("Hello");
    expect(line.words[1].timeline.text).toBe("World");
  });

  it("should create paragraph correctly", async () => {
    const paragraph = await createParagraph({
      position: 1,
      timelines: sampleTimelines[0],
    });

    expect(paragraph.id).toMatch(/^paragraph-/);
    expect(paragraph.position).toBe(1);
    expect(paragraph.lines).toHaveLength(1);
    expect(paragraph.lines[0].words).toHaveLength(2);
  });

  it("should create lyric correctly", async () => {
    const lyric = await createLyric(createArgs);

    expect(lyric.id).toMatch(/^lyric-/);
    expect(lyric.resourceID).toBe("test-song");
    expect(lyric.duration).toBe(10);
    expect(lyric.paragraphs).toHaveLength(2);
    expect(lyric.paragraphs[0].lines[0].words).toHaveLength(2);
  });
});

describe("Functional API - Current Detection", () => {
  it("should find current elements at specific time", async () => {
    const lyric = await createLyric(createArgs);

    const currentParagraph = getCurrentParagraph(lyric, 0.5);
    expect(currentParagraph?.position).toBe(1);

    const currentLine = getCurrentLine(lyric, 0.5);
    expect(currentLine?.position).toBe(1);

    const currentWord = getCurrentWord(lyric, 0.5);
    expect(currentWord?.timeline.text).toBe("Hello");

    const currentChar = getCurrentChar(lyric, 0.5);
    expect(currentChar).toBeDefined();
    expect(["H", "e", "l", "l", "o"]).toContain(currentChar?.text);
  });

  it("should find current elements in second paragraph", async () => {
    const lyric = await createLyric(createArgs);

    const currentParagraph = getCurrentParagraph(lyric, 3.5);
    expect(currentParagraph?.position).toBe(2);

    const currentWord = getCurrentWord(lyric, 3.5);
    expect(currentWord?.timeline.text).toBe("Second");
  });
});

describe("Functional API - Navigation", () => {
  it("should navigate to next/prev elements", async () => {
    const lyric = await createLyric(createArgs);

    const nextLine = getNextLine(lyric, 0.5);
    expect(nextLine?.words[0].timeline.text).toBe("Second");

    const prevWord = getPrevWord(lyric, 4.5);
    expect(prevWord?.timeline.text).toBe("Second");
  });
});

describe("Functional API - Analysis", () => {
  it("should calculate lyric speed", async () => {
    const lyric = await createLyric(createArgs);
    const speed = getLyricSpeed(lyric);
    expect(typeof speed).toBe("number");
    expect(speed).toBeGreaterThan(0);
  });

  it("should find void periods", async () => {
    const lyric = await createLyric(createArgs);
    const voids = getVoidPeriods(lyric);
    expect(voids).toHaveLength(2); // Gap between paragraphs and end
    expect(voids[0].begin).toBe(2);
    expect(voids[0].end).toBe(3);
  });

  it("should detect void time", async () => {
    const lyric = await createLyric(createArgs);
    expect(isVoidTime(lyric, 2.5)).toBe(true);
    expect(isVoidTime(lyric, 0.5)).toBe(false);
  });

  it("should provide comprehensive current summary", async () => {
    const lyric = await createLyric(createArgs);
    const summary = getCurrentSummary(lyric, 0.5);

    expect(summary.currentParagraph?.position).toBe(1);
    expect(summary.currentLine?.position).toBe(1);
    expect(summary.currentWord?.timeline.text).toBe("Hello");
    expect(summary.nextLine?.words[0].timeline.text).toBe("Second");
    expect(typeof summary.lyricTextPerSecond).toBe("number");
  });
});

describe("Functional API - Updates", () => {
  it("should update lyric properties", async () => {
    const lyric = await createLyric(createArgs);
    const updatedLyric = await updateLyric(lyric, {
      resourceID: "updated-song",
      duration: 15,
    });

    expect(updatedLyric.resourceID).toBe("updated-song");
    expect(updatedLyric.duration).toBe(15);
    expect(updatedLyric.id).toBe(lyric.id); // ID should remain same
  });

  it("should get timelines from lyric", async () => {
    const lyric = await createLyric(createArgs);
    const timelines = getTimelines(lyric);

    expect(timelines).toHaveLength(2);
    expect(timelines[0]).toHaveLength(1);
    expect(timelines[0][0]).toHaveLength(2);
    expect(timelines[0][0][0].text).toBe("Hello");
  });

  it("should get timelines by line", async () => {
    const lyric = await createLyric(createArgs);
    const lineTimelines = getTimelinesByLine(lyric);

    expect(lineTimelines).toHaveLength(2);
    expect(lineTimelines[0].text).toBe("HelloWorld");
    expect(lineTimelines[1].text).toBe("SecondParagraph");
  });
});

describe("Functional API - Immutability", () => {
  it("should return immutable data structures", async () => {
    const lyric = await createLyric(createArgs);

    // Test that individual data structures are frozen
    expect(Object.isFrozen(lyric)).toBe(true);
    expect(Object.isFrozen(lyric.paragraphs[0])).toBe(true);
    expect(Object.isFrozen(lyric.paragraphs[0].lines[0])).toBe(true);
    expect(Object.isFrozen(lyric.paragraphs[0].lines[0].words[0])).toBe(true);
    expect(
      Object.isFrozen(lyric.paragraphs[0].lines[0].words[0].chars[0]),
    ).toBe(true);
  });
});
