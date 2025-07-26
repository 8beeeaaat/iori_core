# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Technical
- Update devDependencies to latest versions
  - @biomejs/biome: 1.9.4 → 2.1.2
  - @vitest/coverage-v8: ^3.1.2 → ^3.2.4
  - esbuild: ^0.25.3 → ^0.25.8
  - globals: ^16.0.0 → ^16.3.0
  - vitest: ^3.1.2 → ^3.2.4

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