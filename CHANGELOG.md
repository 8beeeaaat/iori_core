# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-12-11

### Added

- **Zod v4 integration**: Added Zod as a runtime dependency for schema validation
  - New `WordTimeline` schema with comprehensive validation rules
  - Automatic timeline overlap detection with O(n log n) algorithm
  - Type-safe parsing functions `parseWordTimeline()` and `parseWordTimelines()`

- **Result type pattern**: Introduced functional error handling with `ValidationResult<T>`
  - `Success<T>` and `Failure` types for type-safe error propagation
  - `success()` and `failure()` helper functions for creating results
  - `isSuccess()` and `isFailure()` type guards for result checking

- **ID Map (LyricIndex)**: Added O(1) reverse lookup capability to Lyric type
  - `wordByCharId`: Map from Char ID to parent Word
  - `lineByWordId`: Map from Word ID to parent Line
  - `paragraphByLineId`: Map from Line ID to parent Paragraph
  - `wordById`, `lineById`, `paragraphById`: Direct ID-to-element lookup
  - Internal `_index` field in Lyric for efficient hierarchical navigation

- **Editing API**: Comprehensive lyric manipulation functionality in `src/features/editing/`
  - **Shift operations**:
    - `shiftWords(lyric, wordIDs, offsetSec)`: Move multiple words in time
    - `shiftLines(lyric, lineIDs, offsetSec)`: Move multiple lines in time
    - `shiftParagraphs(lyric, paragraphIDs, offsetSec)`: Move multiple paragraphs in time
    - `shiftRange(lyric, beginTime, endTime, offsetSec)`: Move all words within time range
  - **Split operations**:
    - `splitWord(lyric, wordID, options)`: Split a word by position or time
    - `splitLine(lyric, lineID, options)`: Split a line by word or time
  - **Merge operations**:
    - `mergeWords(lyric, wordIDs)`: Merge multiple words into one (same line required)
    - `mergeLines(lyric, lineIDs)`: Merge multiple lines into one (same paragraph required)
  - All editing functions return `ValidationResult<Lyric>` for type-safe error handling
  - Automatic index rebuilding and position recalculation after edits

### Changed

- **Documentation consolidation**: Merged CLAUDE.md and AGENTS.md into single comprehensive AGENTS.md
  - CLAUDE.md now redirects to AGENTS.md
  - Updated editing API documentation with detailed examples and usage patterns

### Technical

- Added `zod` ^4.1.13 as production dependency
- New schema module at `src/schemas/` with `result.ts` and `timeline.schema.ts`
- New features module at `src/features/editing/` with shift, split, merge, and helpers
- Enhanced type definitions with `LyricIndex` for reverse lookup support
- Comprehensive test coverage for all new functionality (358 tests passing)
- All code comments translated to English for international collaboration

## [0.3.10] - 2025-12-11

### Added

- **AGENTS.md documentation**: Comprehensive guide for Claude Code agent usage patterns and strategies
  - Documents built-in agent types (Explore, General-purpose, Code Review) and their optimal use cases for the project
  - Provides project-specific subagent patterns (Immutability Validator, Time Logic Analyzer, Factory Pattern Reviewer, Test Coverage Agent)
  - Includes detailed workflow patterns for feature development, bug fixes, and refactoring using Test-Driven Development approach
  - Offers tool usage guidelines tailored to TypeScript library development with strict immutability requirements
  - Contains context management best practices for efficient agent invocations
  - Lists anti-patterns and common mistakes to avoid when working with agents on this codebase
  - Provides custom subagent definition examples for team collaboration

### Changed

- **Minor dependency updates for improved stability**
  - Updated `esbuild` from 0.27.0 to 0.27.1 for bug fixes
  - Updated `jsdom` from 27.2.0 to 27.3.0 for enhanced DOM testing capabilities
  - Maintained compatibility and stability across all development tools

### Technical

- Enhanced developer experience with comprehensive agent workflow documentation
- Improved onboarding for team members working with Claude Code on this project
- Standardized AI-assisted development patterns for consistent code quality
- Provided clear guidelines for maintaining immutability and functional programming patterns with AI assistance

## [0.3.9] - 2025-12-03

### Changed

- **Major devDependencies upgrade for improved development experience and security**
  - Upgraded `@biomejs/biome` from 2.1.2 to 2.3.8 for enhanced code formatting and linting capabilities
  - Upgraded `vitest` from 3.2.4 to 4.0.15 for improved testing performance and new features
  - Upgraded `@vitest/coverage-v8` from 3.2.4 to 4.0.15 for better code coverage reporting
  - Upgraded `esbuild` from 0.25.8 to 0.27.0 for faster build times and bug fixes
  - Upgraded `typescript` from 5.8.3 to 5.9.3 with latest type checking improvements
  - Upgraded `jsdom` from 26.1.0 to 27.2.0 for better DOM testing capabilities
  - Upgraded `globals` from 16.3.0 to 16.5.0 for updated global type definitions
  - Upgraded `tsx` from 4.20.3 to 4.21.0 for improved TypeScript execution
  - Upgraded `rimraf` from 6.0.1 to 6.1.2 for reliable cross-platform file deletion

### Technical

- Comprehensive dependency modernization across the entire development toolchain
- Enhanced security posture with latest stable versions of all build and test tools
- Improved developer experience with cutting-edge TypeScript and testing capabilities
- Optimized dependency tree for reduced installation time and smaller lock file footprint
- Maintained full backward compatibility while leveraging new tool features

## [0.3.8] - 2025-09-22

### Changed

- **Updated dependencies for enhanced security and performance**
  - Updated `brace-expansion` dependency to address security vulnerabilities
  - Upgraded `vite` from 7.0.6 to 7.1.6 in example project for improved build performance and bug fixes
  - Ensured compatibility with latest development tools and build systems

### Technical

- Dependency updates for improved security posture
- Enhanced example project build tooling with latest Vite version
- Maintained compatibility across development and production environments

## [0.3.7] - 2025-08-03

### Fixed

- **Improved error handling for invalid duration calculations**: Changed duration calculation functions to use console logging instead of throwing errors
  - Duration functions now return -1 for invalid time ranges (where begin >= end) instead of throwing exceptions
  - Applies to `getCharDuration`, `getWordDuration`, `getLineDuration`, and `getParagraphDuration` functions
  - Enhances library stability by preventing crashes when encountering malformed timeline data
  - Updated corresponding tests to verify new error handling behavior

### Technical

- Enhanced error handling resilience for duration calculation utilities
- Improved library stability when processing invalid timeline data

## [0.3.6] - 2025-07-27

### Added

- **`getCharDuration` function**: Calculate character-level duration for precise timing analysis
  - Validates timing data with proper error handling for invalid character ranges
  - Enables fine-grained timing calculations for character-based animations and displays
  - Complements existing word, line, and paragraph duration functions

### Changed

- **Improved function naming consistency**: Replaced `getChars` with `getWordChars` across all utility functions
  - Updated `analysis.ts`, `current.ts`, `grid.ts`, and `helpers.ts` for consistent API naming
  - Enhanced code readability and maintainability with clearer function naming conventions
  - All helper functions now follow consistent `get[Type][Property]` naming pattern

### Technical

- Standardized helper function naming across the codebase for better developer experience
- Enhanced character-level timing capabilities for advanced lyric synchronization use cases
- Improved code consistency and maintainability

## [0.3.5] - 2025-07-27

### Added

- **`getWordsByLineIDAndRowPosition` function**: Complete replacement for the removed `Lyric.wordsByLineIDAndRowPosition()` method
  - Returns `Map<string, Map<number, Map<number, Word>>>` structure mapping line ID → row → column → Word
  - Enables comprehensive grid-based word positioning for complex lyric layouts
  - Supports karaoke-style display and advanced text positioning use cases
  - Added comprehensive test coverage with edge cases and structure validation

### Technical

- Enhanced grid utility functions for improved lyric positioning capabilities
- Added functional alternative to previously removed class-based method
- Improved test coverage for grid positioning functionality

## [0.3.4] - 2025-07-27

### Changed

- Updated build tooling for improved performance and developer experience
  - Replaced `ts-node` with `tsx` for faster TypeScript execution
  - Updated build script to use `tsx build.ts` instead of `node build.mjs`
  - Upgraded CI workflows to use Node.js 24.4 for better performance and compatibility

### Technical

- Enhanced build performance with modern TypeScript runtime (tsx)
- Improved CI pipeline reliability with updated Node.js version
- Streamlined development workflow with faster build tooling

## [0.3.3] - 2025-07-27

### Changed

- Improved type organization and naming for Lyric factory functions
  - Moved `LyricCreateArgs` and `LyricUpdateArgs` from global types to factory-specific types
  - Renamed to `CreateLyricArgs` and `UpdateLyricArgs` for better naming consistency
  - Updated all imports and usage across tests, examples, and utility functions

### Technical

- Enhanced code organization by co-locating types with their corresponding factory functions
- Improved type discoverability and maintainability through better naming conventions
- Reduced global type namespace pollution by moving factory-specific types to appropriate modules

## [0.3.2] - 2025-07-27

### Changed

- Major TypeScript type naming refactoring for improved developer experience
  - Removed `Data` suffix from all core types for cleaner, more intuitive naming
  - `CharData` → `Char`, `WordData` → `Word`, `LineData` → `Line`, `ParagraphData` → `Paragraph`, `LyricData` → `Lyric`
  - Updated all factory functions, utilities, tests, and examples to use the new type names
  - Maintained backward compatibility through proper type exports

### Technical

- Comprehensive type system cleanup across 19 files
- Reduced code complexity with 213 deletions and 174 additions
- Enhanced code readability and maintainability with simplified type naming conventions
- Improved TypeScript IntelliSense experience with shorter, more descriptive type names

## [0.3.1] - 2025-07-27

### Changed

- Improved TypeScript type naming consistency
  - Renamed `FunctionalLyricCreateArgs` to `LyricCreateArgs` for better clarity
  - Renamed `FunctionalLyricUpdateArgs` to `LyricUpdateArgs` for better clarity
  - Updated all related tests, examples, and documentation to use the new type names

### Technical

- Code consistency improvements across 9 files with standardized type naming conventions
- Enhanced developer experience with more intuitive type names that align with the factory pattern architecture

## [0.3.0] - 2025-07-27

### Added

- Comprehensive helper functions for lyric data manipulation
  - New utility functions for extracting words, lines, paragraphs, and their respective durations and text
  - Navigation functions to find next/previous paragraphs, lines, and words based on current time
  - Update functions to handle lyric updates and extract timelines
- Enhanced documentation with CLAUDE.md for project guidance and API documentation
- Functional usage examples and documentation for improved developer experience
- Constants testing to ensure proper module behavior

### Changed

- Major architecture refactoring from class-based to factory pattern
  - Moved from class-based Char, Line, Lyric, Paragraph, Word to factory functions
  - Improved immutability and functional programming approach
  - Better type safety with enhanced TypeScript configuration
- Build system improvements
  - Migrated from build.ts to build.mjs for better ES module support
  - Enhanced Vitest configuration for coverage reporting
  - Updated biome configuration for better code quality
- Enhanced example application with modern React patterns
- Improved TypeScript configuration for module resolution

### Removed

- Class-based implementations in favor of factory pattern
  - Removed Char, Line, Lyric, Paragraph, Word classes
  - Legacy test files for removed classes

### Technical

- Update devDependencies to latest versions
  - @biomejs/biome: 1.9.4 → 2.1.2
  - @vitest/coverage-v8: ^3.1.2 → ^3.2.4
  - esbuild: ^0.25.3 → ^0.25.8
  - globals: ^16.0.0 → ^16.3.0
  - vitest: ^3.1.2 → ^3.2.4
- Comprehensive test coverage for all new utility functions
- Enhanced development tools and configuration

## [0.2.1] - 2025-05-01

### Added

- New `RowStatus` type for enhanced row state management with character-level details
- `currentRowStatusByRow()` method in Lyric class for current row status retrieval

### Changed

- Enhanced Lyric class with improved row status functionality
- Added Char type import to support character-level operations

### Technical

- Updated vitest configuration
- Updated example dependencies
- Code quality improvements with biome configuration updates

## [0.2.0] - 2025-03-18

### Changed

- Enhanced tokenizer system with separate line and paragraph tokenizers
  - Split `tokenizer` parameter into `lineTokenizer` and `paragraphTokenizer`
  - Improved flexibility for different tokenization strategies
- Updated example application with modern React patterns
- Improved Line class functionality

### Technical

- Major dependency updates in example project
- Enhanced biome configuration
- Updated build and development tools
- Improved TypeScript configuration

## [0.1.20] - 2025-03-02

### Added

- Type guard function `isParagraphCreateArgs()` for better type checking
- Enhanced parameter validation in Paragraph class

### Changed

- Improved test coverage for Line, Paragraph, and Word classes
- Enhanced Word and Paragraph classes with better type safety

### Fixed

- Improved error handling and type checking across core classes
