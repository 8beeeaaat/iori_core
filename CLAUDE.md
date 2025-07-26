# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@ioris/core` is a TypeScript library for managing music lyrics with time synchronization. It provides the core functionality for the [@ioris](https://www.npmjs.com/search?q=%40ioris) ecosystem, allowing developers to synchronize lyrics display with music playback by tracking current paragraph, line, word, and character positions based on playback time.

## Core Architecture

The library uses a hierarchical data structure:
- **Lyric** (top-level): Contains multiple paragraphs and manages duration/offset
- **Paragraph**: Contains multiple lines  
- **Line**: Contains multiple words
- **Word**: Contains multiple characters and timeline data
- **Char**: Individual character with timing information

### Key Data Types

- `WordTimeline`: Core timing data with `wordID`, `text`, `begin`, `end`, `hasWhitespace`, `hasNewLine`
- Timeline data is passed as nested arrays: `timelines: WordTimeline[][][]` (paragraphs → lines → words)

### Initialization Pattern

The `Lyric` class requires async initialization:
```typescript
const lyric = new Lyric({
  resourceID: "song-id",
  duration: 180.5,
  timelines: [[[/* word timelines */]]],
  // Optional tokenizers for customization
});
await lyric.init(); // Required async initialization
```

### Main API Methods

- **Current position**: `currentParagraph(now)`, `currentLine(now)`, `currentWord(now)`, `currentChar(now)`
- **Navigation**: `nextLine(now)`, `prevWord(now)`, etc.
- **Updates**: `lyric.update({ timelines, duration, offsetSec })`
- **Analysis**: `currentSummary(now)` returns comprehensive state information

All timing methods accept `now` (current playback time in seconds) and optional `offset`/`equal` parameters.

## Development Commands

- **Build**: `npm run build` (uses esbuild + TypeScript)
- **Test**: `npm test` (Vitest)
- **Test with coverage**: `npm run coverage`
- **Lint**: `npm run lint` (runs `lint:biome` and `lint:ts`)
- **Format**: `npm run format` (Biome auto-fix)
- **Type check**: `npm run lint:ts` or `tsc`
- **Development example**: `npm run dev` (builds library and runs example)

## Code Style (Biome Configuration)

- **Indentation**: 2 spaces
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Import organization**: Enabled automatically
- All code should pass `biome check` before committing

## Testing

- Uses Vitest as the test runner
- Test files: `*.test.ts` in `src/` directory
- Run single test: `npx vitest run <test-file-pattern>`
- Watch mode: `npx vitest`

## Extension Points

The library supports dependency injection for tokenizers:
- `lineTokenizer`: Custom line tokenization logic
- `paragraphTokenizer`: Custom paragraph tokenization logic
- Example plugins: `@ioris/tokenizer-kuromoji`, `@ioris/parser-ttml`

## Important Implementation Notes

- All time values are rounded to 2 decimal places
- The library handles void periods (gaps between words) automatically
- Grid positioning system for complex lyric layouts (karaoke-style display)
- Offset management for timing adjustments
- Speed calculation for text-per-second metrics