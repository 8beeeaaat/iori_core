# Functional API Example

The new functional API provides a cleaner, more predictable way to work with lyric data through immutable data structures and pure functions.

## Basic Usage

```typescript
import { 
  createLyric,
  getCurrentParagraph,
  getCurrentLine,
  getCurrentWord,
  getCurrentChar,
  getCurrentSummary,
  type FunctionalLyricCreateArgs,
  type WordTimeline
} from "@ioris/core";

// Define timeline data
const timelines: WordTimeline[][][] = [
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

// Create lyric data
const lyricArgs: FunctionalLyricCreateArgs = {
  resourceID: "example-song",
  duration: 10,
  timelines,
  initID: true,
};

async function example() {
  // Create immutable lyric data
  const lyric = await createLyric(lyricArgs);
  
  // Get current elements at specific time
  const currentTime = 0.5;
  
  const currentParagraph = getCurrentParagraph(lyric, currentTime);
  console.log("Current paragraph:", currentParagraph?.position); // 1
  
  const currentLine = getCurrentLine(lyric, currentTime);
  console.log("Current line:", currentLine?.position); // 1
  
  const currentWord = getCurrentWord(lyric, currentTime);
  console.log("Current word:", currentWord?.timeline.text); // "Hello,"
  
  const currentChar = getCurrentChar(lyric, currentTime);
  console.log("Current char:", currentChar?.text); // One of "H", "e", "l", etc.
  
  // Get comprehensive summary
  const summary = getCurrentSummary(lyric, currentTime);
  console.log("Summary:", {
    currentWord: summary.currentWord?.timeline.text,
    nextLine: summary.nextLine?.words[0]?.timeline.text,
    isConnected: summary.isConnected,
    speed: summary.lyricTextPerSecond
  });
}

example();
```

## Key Benefits

### 1. Immutability
All data structures are immutable (frozen), preventing unexpected mutations:

```typescript
const lyric = await createLyric(lyricArgs);

// These are all frozen objects
console.log(Object.isFrozen(lyric)); // true
console.log(Object.isFrozen(lyric.paragraphs[0])); // true
console.log(Object.isFrozen(lyric.paragraphs[0].lines[0])); // true
```

### 2. Pure Functions
All operations are pure functions that take data and return new data:

```typescript
// Instead of: lyric.currentWord(now)
const currentWord = getCurrentWord(lyric, now);

// Instead of: lyric.nextLine(now)  
const nextLine = getNextLine(lyric, now);
```

### 3. Predictable Updates
Updates return new immutable objects instead of mutating existing ones:

```typescript
import { updateLyric } from "@ioris/core";

const updatedLyric = await updateLyric(lyric, {
  resourceID: "new-song-id",
  duration: 15
});

// Original lyric is unchanged
console.log(lyric.resourceID); // "example-song"
console.log(updatedLyric.resourceID); // "new-song-id"
```

### 4. Better Performance
No internal state means better predictability and easier optimization:

```typescript
import { 
  getLyricSpeed,
  getVoidPeriods,
  isVoidTime
} from "@ioris/core";

// Pure calculations
const speed = getLyricSpeed(lyric);
const voids = getVoidPeriods(lyric);
const isVoid = isVoidTime(lyric, 2.5);
```

## Migration from Class-based API

### Before (Class-based)
```typescript
const lyric = new Lyric({ /* args */ });
await lyric.init();

const currentWord = lyric.currentWord(now);
const nextLine = lyric.nextLine(now);
const summary = lyric.currentSummary(now);

await lyric.update({ resourceID: "new-id" });
```

### After (Functional)
```typescript
const lyric = await createLyric({ /* args */ });

const currentWord = getCurrentWord(lyric, now);
const nextLine = getNextLine(lyric, now); 
const summary = getCurrentSummary(lyric, now);

const updatedLyric = await updateLyric(lyric, { resourceID: "new-id" });
```

## Advanced Usage

### Custom Tokenizers
```typescript
const lyric = await createLyric({
  resourceID: "advanced-song",
  duration: 30,
  timelines,
  lineTokenizer: async (lineArgs) => {
    // Custom line processing logic
    return new Map([[1, { ...lineArgs, jointNearWord: false }]]);
  },
  paragraphTokenizer: async (timelines) => {
    // Custom paragraph processing logic
    return timelines.map(timeline => 
      timeline.filter(word => word.text.trim().length > 0)
    );
  }
});
```

### Grid Operations
```typescript
import { 
  getWordGridPositions,
  getWordsByRow,
  getCharPositions
} from "@ioris/core";

const line = lyric.paragraphs[0].lines[0];
const gridPositions = getWordGridPositions(line);
const wordsByRow = getWordsByRow(line);
const charPositions = getCharPositions(line);
```

The functional API provides a more modern, predictable, and maintainable approach to working with lyric synchronization data.