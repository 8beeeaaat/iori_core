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
const lyric = await createLyric({
  resourceID: "song-id",
  duration: 180.5,
  timelines: [[[/* word timelines */]]],
  // Optional tokenizers for customization
});
```

### Main API Methods

- **Current position**: `getCurrentParagraph(lyric, now)`, `getCurrentLine(lyric, now)`, `getCurrentWord(lyric, now)`, `getCurrentChar(lyric, now)`
- **Navigation**: `getNextLine(lyric, now)`, `getPrevWord(lyric, now)`, etc.
- **Updates**: `updateLyric(lyric, { timelines, duration, offsetSec })`
- **Analysis**: `getCurrentSummary(lyric, now)` returns comprehensive state information

All timing methods accept `now` (current playback time in seconds) and optional `offset`/`equal` parameters.

## Development Commands

- **Build**: `npm run build` (uses esbuild + TypeScript)
- **Test all**: `npm test` (Vitest)
- **Test specific file**: `npx vitest run <test-file-pattern>`
- **Test with coverage**: `npm run coverage`
- **Lint**: `npm run lint` (runs `lint:biome` and `lint:ts`)
- **Format**: `npm run format` (Biome auto-fix)
- **Type check**: `npm run lint:ts` or `tsc`
- **Development example**: `npm run dev` (builds library and runs example)

## Code Style & Standards

- **ESM-only**: Project uses pure ES modules (`"type": "module"`)
- **Immutable design**: All data structures use `readonly` modifiers and `Object.freeze()`
- **Functional approach**: Pure functions with no side effects
- **Biome configuration**: 2-space indentation, double quotes, auto-import organization
- **TypeScript strict mode**: Full type safety with comprehensive type definitions

## Testing

- Uses Vitest as the test runner
- Test files: `*.test.ts` in `src/` directory
- Watch mode: `npx vitest`
- Mock UUID generation: Tests use `vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "test-uuid-123") })`

## Architecture Patterns

### Factory Pattern
Each hierarchical level has a corresponding factory:
- `createChar()`: Character-level data with type detection
- `createWord()`: Word-level data with automatic character splitting
- `createLine()`: Line-level data with word joining logic
- `createParagraph()`: Paragraph-level data with line tokenization
- `createLyric()`: **Main factory** - async initialization of complete structure

### Utility Organization
- **`utils/current.ts`**: Position tracking (`getCurrentWord`, `getCurrentLine`, etc.)
- **`utils/navigation.ts`**: Navigation between elements (`getNextWord`, `getPrevLine`, etc.)
- **`utils/analysis.ts`**: Performance analysis, speed calculations, void period detection
- **`utils/helpers.ts`**: Basic data accessors and time range checking
- **`utils/grid.ts`**: Grid positioning for karaoke-style displays
- **`utils/update.ts`**: Immutable data updates

### Time-based Position Tracking
- Hierarchical search: Paragraph → Line → Word → Char
- Time range validation: `begin <= currentTime < end`
- Offset support for timing adjustments
- Efficient sorting and binary search patterns

## Extension Points

The library supports dependency injection for tokenizers:
- `lineTokenizer`: Custom line tokenization logic
- `paragraphTokenizer`: Custom paragraph tokenization logic
- Example plugins: `@ioris/tokenizer-kuromoji`, `@ioris/parser-ttml`

## Important Implementation Notes

- All time values are rounded to 2 decimal places
- The library handles void periods (gaps between words) automatically
- Grid positioning system for complex lyric layouts (karaoke-style display)
- Speed calculation uses weighted character types (Japanese: 1.0, English/Numbers: 0.5)
- Word joining logic: words within 0.1 seconds can be automatically joined
- UUID generation for consistent ID management across the hierarchy