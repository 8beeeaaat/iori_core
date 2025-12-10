# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository, including project overview, conventions, and agent strategies.

---

## Project Overview

\`@ioris/core\` is a TypeScript library for managing music lyrics with time synchronization. It provides the core functionality for the [@ioris](https://www.npmjs.com/search?q=%40ioris) ecosystem, allowing developers to synchronize lyrics display with music playback by tracking current paragraph, line, word, and character positions based on playback time.

---

## Core Architecture

The library uses a hierarchical data structure:

- **Lyric** (top-level): Contains multiple paragraphs and manages duration/offset
- **Paragraph**: Contains multiple lines
- **Line**: Contains multiple words
- **Word**: Contains multiple characters and timeline data
- **Char**: Individual character with timing information

### Key Data Types

- \`WordTimeline\`: Core timing data with \`wordID\`, \`text\`, \`begin\`, \`end\`, \`hasWhitespace\`, \`hasNewLine\`
- Timeline data is passed as nested arrays: \`timelines: WordTimeline[][][]\` (paragraphs → lines → words)

### Initialization Pattern

The \`Lyric\` class requires async initialization:

\`\`\`typescript
const lyric = await createLyric({
  resourceID: "song-id",
  duration: 180.5,
  timelines: [[[/* word timelines */]]],
  // Optional tokenizers for customization
});
\`\`\`

### Main API Methods

- **Current position**: \`getCurrentParagraph(lyric, now)\`, \`getCurrentLine(lyric, now)\`, \`getCurrentWord(lyric, now)\`, \`getCurrentChar(lyric, now)\`
- **Navigation**: \`getNextLine(lyric, now)\`, \`getPrevWord(lyric, now)\`, etc.
- **Updates**: \`updateLyric(lyric, { timelines, duration, offsetSec })\`
- **Analysis**: \`getCurrentSummary(lyric, now)\` returns comprehensive state information
- **Editing**: Lyric structure manipulation (see Editing API section below)

All timing methods accept \`now\` (current playback time in seconds) and optional \`offset\`/\`equal\` parameters.

### Editing API

The library provides functions to manipulate lyric structure:

**Shift operations**:

- \`shiftWords(lyric, wordIDs, offsetSec)\`: Move multiple words in time
- \`shiftLines(lyric, lineIDs, offsetSec)\`: Move multiple lines in time
- \`shiftParagraphs(lyric, paragraphIDs, offsetSec)\`: Move multiple paragraphs in time
- \`shiftRange(lyric, beginTime, endTime, offsetSec)\`: Move all words within time range

**Merge operations**:

- \`mergeWords(lyric, wordIDs)\`: Merge multiple words into one
  - Words must be in the same line
  - Returns \`ValidationResult<Lyric>\`
- \`mergeLines(lyric, lineIDs)\`: Merge multiple lines into one
  - Lines must be in the same paragraph
  - Returns \`ValidationResult<Lyric>\`

**Split operations**:

- \`splitWord(lyric, wordID, options)\`: Split a word into two
  - \`options.type: "position"\` - Split by character index
  - \`options.type: "time"\` - Split by time point
  - Returns \`ValidationResult<Lyric>\`
- \`splitLine(lyric, lineID, options)\`: Split a line into two
  - \`options.type: "word"\` - Split at specified word
  - \`options.type: "time"\` - Split by time point
  - Returns \`ValidationResult<Lyric>\`

All editing functions:

- Return \`ValidationResult<T>\` for type-safe error handling
- Preserve immutability (original lyric unchanged)
- Automatically rebuild internal index (\`_index\`)
- Recalculate \`position\` values (1-based)

---

## Development Commands

| Command | Description |
|---------|-------------|
| \`npm run build\` | Build with esbuild + TypeScript |
| \`npm test\` | Run all tests (Vitest) |
| \`npx vitest run <pattern>\` | Run specific test file |
| \`npm run coverage\` | Test with coverage |
| \`npm run lint\` | Run lint:biome and lint:ts |
| \`npm run format\` | Biome auto-fix |
| \`npm run lint:ts\` | Type check |
| \`npm run dev\` | Build library and run example |

---

## Code Style & Standards

- **ESM-only**: Project uses pure ES modules (\`"type": "module"\`)
- **Immutable design**: All data structures use \`readonly\` modifiers and \`Object.freeze()\`
- **Functional approach**: Pure functions with no side effects
- **Biome configuration**: 2-space indentation, double quotes, auto-import organization
- **TypeScript strict mode**: Full type safety with comprehensive type definitions

---

## Testing

- Uses Vitest as the test runner
- Test files: \`*.test.ts\` in \`src/\` directory
- Watch mode: \`npx vitest\`
- Mock UUID generation: Tests use \`vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "test-uuid-123") })\`

---

## Architecture Patterns

### Factory Pattern

Each hierarchical level has a corresponding factory:

- \`createChar()\`: Character-level data with type detection
- \`createWord()\`: Word-level data with automatic character splitting
- \`createLine()\`: Line-level data with word joining logic
- \`createParagraph()\`: Paragraph-level data with line tokenization
- \`createLyric()\`: **Main factory** - async initialization of complete structure

### Utility Organization

| File | Purpose |
|------|---------|
| \`utils/current.ts\` | Position tracking (\`getCurrentWord\`, \`getCurrentLine\`, etc.) |
| \`utils/navigation.ts\` | Navigation between elements (\`getNextWord\`, \`getPrevLine\`, etc.) |
| \`utils/analysis.ts\` | Performance analysis, speed calculations, void period detection |
| \`utils/helpers.ts\` | Basic data accessors and time range checking |
| \`utils/grid.ts\` | Grid positioning for karaoke-style displays |
| \`utils/update.ts\` | Immutable data updates |

### Editing Module Organization

| File | Purpose |
|------|---------|
| \`editing/shift.ts\` | Batch timing shift operations |
| \`editing/split.ts\` | Split Word/Line into multiple parts |
| \`editing/merge.ts\` | Merge multiple Word/Line into one |
| \`editing/helpers.ts\` | Shared utilities (rebuildIndex, checkOverlaps, reindexPositions) |

### Time-based Position Tracking

- Hierarchical search: Paragraph → Line → Word → Char
- Time range validation: \`begin <= currentTime < end\`
- Offset support for timing adjustments
- Efficient sorting and binary search patterns

---

## Extension Points

The library supports dependency injection for tokenizers:

- \`lineTokenizer\`: Custom line tokenization logic
- \`paragraphTokenizer\`: Custom paragraph tokenization logic
- Example plugins: \`@ioris/tokenizer-kuromoji\`, \`@ioris/parser-ttml\`

---

## Important Implementation Notes

- All time values are rounded to 2 decimal places
- The library handles void periods (gaps between words) automatically
- Grid positioning system for complex lyric layouts (karaoke-style display)
- Speed calculation uses weighted character types (Japanese: 1.0, English/Numbers: 0.5)
- Word joining logic: words within 0.1 seconds can be automatically joined
- UUID generation for consistent ID management across the hierarchy

---

## Agent Strategy

Claude Code supports specialized AI subagents designed to handle specific tasks more effectively. This section outlines recommended agent workflows for developing and maintaining this TypeScript library.

### When to Use Agents

Given the nature of \`@ioris/core\` as a TypeScript library with strict immutability requirements and comprehensive test coverage, agents should be used for:

1. **Complex Refactoring**: Multi-file changes that maintain immutability patterns
2. **Test-Driven Development**: Creating comprehensive test suites for new features
3. **Type System Analysis**: Reviewing and improving TypeScript type definitions
4. **Performance Optimization**: Analyzing time-based position tracking algorithms
5. **Code Review**: Ensuring adherence to functional programming patterns

### Built-in Agents for This Project

#### 1. Explore Agent (Recommended for Codebase Analysis)

**Use when:**

- Understanding hierarchical data structures (Lyric → Paragraph → Line → Word → Char)
- Tracing time-based position tracking logic
- Finding factory pattern implementations
- Analyzing utility function organization

**Example:**

\`\`\`bash
# Understanding how current position tracking works
"Explore how getCurrentWord and getCurrentChar implement hierarchical time-based search"
\`\`\`

**Why it's effective:**

- Fast exploration of interconnected modules
- Excellent for understanding data flow in utils/current.ts and utils/navigation.ts
- Maintains context across factory patterns

#### 2. General-Purpose Agent

**Use when:**

- Implementing new timeline manipulation features
- Adding new utility functions with complex logic
- Multi-step refactoring across factories

**Tools:** All tools available (Read, Write, Edit, Bash, etc.)

#### 3. Code Review Agents (via plugins)

**Recommended for:**

- Ensuring immutability (all \`readonly\` modifiers)
- Verifying functional approach (no side effects)
- Checking ESM-only compatibility
- Validating TypeScript strict mode compliance

---

## Project-Specific Subagent Patterns

### 1. Immutability Validator

**Purpose:** Ensure all data structures maintain immutability

**Key checks:**

- All type properties use \`readonly\` modifier
- Factory functions use \`Object.freeze()\`
- No direct mutations in update functions
- Array operations use non-mutating methods (\`.map()\`, \`.filter()\`, etc.)

**Trigger phrases:**

- "Review for immutability violations"
- "Check if this maintains readonly constraints"

### 2. Time Logic Analyzer

**Purpose:** Validate time-based calculations and range checking

**Focus areas:**

- Time rounding to 2 decimal places
- Range validation: \`begin <= currentTime < end\`
- Offset handling in position tracking
- Void period calculations

**Trigger phrases:**

- "Analyze timing logic"
- "Verify time range calculations"

### 3. Factory Pattern Reviewer

**Purpose:** Ensure consistent factory pattern implementation

**Checks:**

- Async initialization pattern (createLyric)
- UUID generation consistency
- Hierarchical ID linking (wordID → lineID, etc.)
- Dependency injection for tokenizers

**Trigger phrases:**

- "Review factory implementation"
- "Check factory pattern consistency"

### 4. Test Coverage Agent

**Purpose:** Ensure comprehensive test coverage for new features

**Requirements:**

- Vitest test structure
- UUID mocking: \`vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "test-uuid-123") })\`
- Edge case coverage
- Time boundary testing

**Trigger phrases:**

- "Create comprehensive tests"
- "Add test coverage for edge cases"

---

## Workflow Patterns

### Pattern 1: Feature Development (TDD Approach)

\`\`\`bash
# Step 1: Explore existing patterns
Use Explore agent: "Find similar implementations of position tracking utilities"

# Step 2: Plan implementation
Use general-purpose agent with plan mode

# Step 3: Test-first development
Use test coverage agent: "Create tests for new feature X following existing patterns"

# Step 4: Implementation
Implement feature maintaining immutability and functional patterns

# Step 5: Review
Use code review agent: "Review for immutability, type safety, and test coverage"
\`\`\`

### Pattern 2: Bug Fix

\`\`\`bash
# Step 1: Reproduce and understand
"Debug timing calculation issue in getCurrentWord" with Explore agent

# Step 2: Analyze root cause
Use general-purpose agent to trace execution flow

# Step 3: Fix with tests
Add regression test first, then fix implementation

# Step 4: Validate
Run coverage: npm run coverage
\`\`\`

### Pattern 3: Refactoring

\`\`\`bash
# Step 1: Understand current structure
Use Explore agent: "Analyze current implementation of X"

# Step 2: Plan refactoring
Use Plan subagent in plan mode

# Step 3: Incremental changes
Make small, testable changes maintaining all tests passing

# Step 4: Verify no behavioral changes
Use test agent to ensure all tests pass with coverage
\`\`\`

---

## Tool Usage Guidelines

### Preferred Tools by Task

| Task | Recommended Tools | Avoid |
|------|-------------------|-------|
| Type exploration | Read, Grep (type files) | Direct file editing |
| Test creation | Read (existing tests), Write | Manual test running |
| Factory changes | Read, Edit (maintain patterns) | Complete rewrites |
| Utility functions | Read (utils/), Edit | Mutable patterns |
| Performance analysis | Bash (npm run coverage) | Premature optimization |

### Command Patterns

\`\`\`bash
# Always run tests after changes
npm test

# Specific test file
npx vitest run src/utils/current.test.ts

# Coverage check
npm run coverage

# Type checking
npm run lint:ts

# Format (Biome)
npm run format
\`\`\`

---

## Context Management

### What to Include in Agent Context

When invoking agents for \`@ioris/core\` tasks, provide:

1. **Type definitions** from [src/types.ts](src/types.ts)
2. **Relevant factory** from [src/factories/](src/factories/)
3. **Related utility** from [src/utils/](src/utils/)
4. **Existing tests** for pattern reference

### Context Optimization

- **For utility functions:** Include related utilities in same category
- **For factories:** Include entire factory chain (Char → Word → Line → Paragraph → Lyric)
- **For timeline logic:** Include Constants.ts and WordTimeline type
- **For tests:** Include similar test patterns for consistency

---

## Anti-Patterns to Avoid

### ❌ Don't Use Agents For

1. **Simple type additions** - Direct edit is faster
2. **Trivial bug fixes** - Single-line changes don't need delegation
3. **Documentation updates** - Straightforward content changes
4. **Dependency updates** - Use npm directly

### ❌ Common Mistakes

1. **Forgetting immutability** - Always use \`readonly\` and \`Object.freeze()\`
2. **Mutating arrays** - Use \`.map()\`, \`.filter()\`, never \`.push()\`, \`.splice()\`
3. **Skipping tests** - Every feature needs comprehensive tests
4. **Ignoring ESM** - Project is ESM-only, no CommonJS patterns
5. **Using \`any\` or \`unknown\`** - Maintain full type safety

---

## Integration with Development Workflow

### Pre-Commit Agent Usage

Before committing changes, use agents to verify:

\`\`\`bash
# 1. Code review
"Review this change for immutability and type safety"

# 2. Test coverage
"Verify test coverage for modified functions"

# 3. Type checking
npm run lint:ts

# 4. Format
npm run format
\`\`\`

### PR Review Agent Strategy

When reviewing PRs:

1. **Explore agent**: Understand impact across codebase
2. **Code review agent**: Check adherence to patterns
3. **Test agent**: Verify comprehensive coverage
4. **Type analyzer**: Ensure no \`any\` or type weakening

---

## Advanced Agent Patterns

### Pattern: Multi-Level Factory Changes

When modifying hierarchical factories:

\`\`\`bash
# 1. Map dependency chain
Explore agent: "Show all factories that depend on Word factory"

# 2. Plan changes bottom-up
Start with Char, then Word, then Line, etc.

# 3. Update tests incrementally
Test each level before moving up hierarchy

# 4. Verify integration
Test complete Lyric creation with all changes
\`\`\`

### Pattern: Performance Optimization

\`\`\`bash
# 1. Baseline measurement
npm run coverage  # Note performance metrics

# 2. Analyze hotspots
Explore agent: "Find time-critical functions in position tracking"

# 3. Optimize with proofs
Maintain functional purity while improving algorithms

# 4. Verify no regression
Ensure all tests pass and performance improves
\`\`\`

---

## Custom Subagent Definitions

For team members who want to create project-specific subagents, place them in \`.claude/agents/\`. Example configurations:

### Immutability Checker

\`\`\`yaml
# .claude/agents/immutability-checker.md
description: Reviews code changes for immutability violations in @ioris/core
tools: [Read, Grep]
trigger: "check immutability", "verify readonly"
focus:
  - readonly modifiers on all type properties
  - Object.freeze() in factories
  - No array mutations
  - No direct property assignments
\`\`\`

### Timeline Logic Validator

\`\`\`yaml
# .claude/agents/timeline-validator.md
description: Validates time-based calculations and range checking
tools: [Read, Grep, Bash]
trigger: "validate timing", "check time logic"
focus:
  - Time value rounding to 2 decimals
  - Range checks: begin <= current < end
  - Offset calculations
  - Void period detection
\`\`\`

---

## Best Practices Summary

1. **Use Explore agent first** for understanding before making changes
2. **Always run tests** after agent-assisted changes
3. **Maintain immutability** - agents should respect readonly patterns
4. **Type safety first** - no \`any\` or \`unknown\` types
5. **Test coverage** - comprehensive tests for all features
6. **Incremental changes** - small, verifiable steps
7. **Context awareness** - provide relevant code in agent prompts
8. **Pattern consistency** - follow existing factory and utility patterns

---

## Related Documentation

- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents) - Official documentation
- [Package.json](package.json) - Available scripts and commands

---

**Last Updated:** 2025-12-11
**Maintainer:** Project team
**Version:** 1.0.0
