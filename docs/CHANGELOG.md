# Changelog

## [1.3.0] - 2025-01-07

### Changed
- **Optimized transcript extraction**: Removed ineffective transcript opening methods based on performance testing
- **Improved reliability**: Simplified transcript panel opening logic to use only the most successful method (100% success rate)
- **Reduced code complexity**: Removed 79 lines of dead code for better maintainability

### Technical Details
- Removed `tryOpenViaMoreActions()` and `tryOpenViaThreeDots()` methods (0% success rate in testing)
- Streamlined `tryOpenTranscriptPanel()` to use only `tryOpenViaShowTranscriptButton()` method
- Added automated testing infrastructure to validate transcript opening methods

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