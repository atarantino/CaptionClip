# Changelog

## [1.9.0] - 2026-05-30

### Fixed
- Fixed Firefox clipboard extraction for YouTube's current transcript panel so copied text includes the full transcript instead of only the language label.

## [1.8.0] - 2026-05-30

### Fixed
- Restored transcript extraction after YouTube transcript panel updates by reading caption tracks directly from YouTube player metadata before falling back to DOM extraction.

## [1.7.0] - 2026-05-25

### Fixed
- Improved CaptionClip top-bar button contrast in YouTube light mode with an explicit border and shadow.

## [1.6.0] - 2026-05-25

### Fixed
- Restored button injection on YouTube pages that enforce Trusted Types by replacing SVG `innerHTML` insertion with DOM-created SVG nodes.
- Restored transcript extraction for YouTube's current transcript panel (`PAmodern_transcript_view`) while keeping the older transcript renderer fallback.

### Changed
- Expanded Chrome and Firefox tests to verify that CaptionClip copies real transcript text, not just that the button appears.

## [1.3.0] - 2025-01-07

### Changed
- **Optimized transcript extraction**: Removed ineffective transcript opening methods based on performance testing
- **Improved reliability**: Simplified transcript panel opening logic to use only the most successful method (100% success rate)
- **Reduced code complexity**: Removed 79 lines of dead code for better maintainability
- **Reorganized project structure**: Created organized directory structure with docs/, src/, tests/, scripts/ for better maintainability

### Technical Details
- Removed `tryOpenViaMoreActions()` and `tryOpenViaThreeDots()` methods (0% success rate in testing)
- Streamlined `tryOpenTranscriptPanel()` to use only `tryOpenViaShowTranscriptButton()` method
- Added automated testing infrastructure to validate transcript opening methods
- Moved all files to appropriate directories following standard conventions
- Updated all path references and build scripts for new structure

## [1.2.0] - 2025-01-07

### Added
- Pre-commit hook with automated Chrome and Firefox testing
- Comprehensive test suite for both browser extensions

### Fixed
- Improved Firefox theme detection for proper light/dark mode styling
- Enhanced theme detection with multiple fallback checks for YouTube theatre mode

### Removed
- Background script functionality (simplified to embedded button only)
- All console logs and debug comments for cleaner code
