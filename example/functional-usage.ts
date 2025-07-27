/**
 * Simple functional API usage example
 *
 * This example demonstrates the basic usage of the new functional API
 * after migrating from the class-based implementation.
 */
import {
  type CreateLyricArgs,
  createLyric,
  getCurrentLine,
  getCurrentParagraph,
  getCurrentSummary,
  getCurrentWord,
  type WordTimeline,
} from "@ioris/core";

// Sample timeline data
const sampleTimelines: WordTimeline[][][] = [
  [
    [
      {
        wordID: "word1",
        text: "Hello,",
        begin: 0,
        end: 1,
        hasWhitespace: true,
      },
      {
        wordID: "word2",
        text: "world!",
        begin: 1,
        end: 2,
      },
    ],
  ],
  [
    [
      {
        wordID: "word3",
        text: "This",
        begin: 3,
        end: 4,
        hasWhitespace: true,
      },
      {
        wordID: "word4",
        text: "is",
        begin: 4,
        end: 5,
        hasWhitespace: true,
      },
      {
        wordID: "word5",
        text: "functional!",
        begin: 5,
        end: 6.5,
      },
    ],
  ],
];

async function functionalExample() {
  // Create lyric data using functional API
  const lyricArgs: CreateLyricArgs = {
    resourceID: "example-song",
    duration: 10,
    timelines: sampleTimelines,
    initID: true,
  };

  // Create immutable lyric data
  const lyric = await createLyric(lyricArgs);
  console.log("Created lyric with ID:", lyric.id);

  // Simulate different playback times
  const times = [0.5, 1.5, 3.5, 4.5, 5.8];

  for (const currentTime of times) {
    console.log(`\n--- At time ${currentTime}s ---`);

    // Get current elements
    const currentParagraph = getCurrentParagraph(lyric, currentTime);
    const currentLine = getCurrentLine(lyric, currentTime);
    const currentWord = getCurrentWord(lyric, currentTime);

    console.log("Current paragraph:", currentParagraph?.position);
    console.log("Current line:", currentLine?.position);
    console.log("Current word:", currentWord?.timeline.text);

    // Get comprehensive summary
    const summary = getCurrentSummary(lyric, currentTime);
    console.log("Next line text:", summary.nextLine?.words[0]?.timeline.text);
    console.log("Speed (chars/sec):", summary.lyricTextPerSecond?.toFixed(2));
  }
}

// Run the example
functionalExample().catch(console.error);
