# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CaptionClip is a cross-browser extension that extracts transcripts from YouTube videos. It supports both Chrome (Manifest V3) and Firefox (Manifest V2) with a single codebase.

## Key Commands

```bash
# Build for both browsers (creates dist/chrome and dist/firefox)
npm run build

# Run tests for both browsers
npm test

# Run Chrome-specific tests
npm run test:chrome

# Run Firefox-specific tests
npm run test:firefox
```

## Architecture

The extension uses a simple, dependency-free architecture:

- **Single content script** (`src/content.js`) that injects a "Transcript" button into YouTube's interface
- **No background scripts or service workers** - all functionality is contained in the content script
- **Pure vanilla JavaScript** - no frameworks or external dependencies
- **Cross-browser compatibility** through separate manifest files in `src/manifests/`

### Core Components

1. **src/content.js**: Main extension logic
   - Injects "Transcript" button next to YouTube's voice search button
   - Detects YouTube's theme (light/dark) for proper styling
   - Extracts transcript using YouTube's built-in transcript panel
   - Handles clipboard operations and user feedback via toast notifications

2. **scripts/build.js**: Build system
   - Creates browser-specific distributions in `dist/` directory
   - Copies appropriate manifest for each browser
   - Generates ZIP files for distribution

3. **tests/**: Playwright integration tests
   - Validates button injection and visibility
   - Tests both Chrome and Firefox extensions
   - Uses real YouTube videos for testing

## Development Workflow

1. Make changes to source files in `src/`
2. Run `npm run build` to update distributions
3. Test changes with `npm test`
4. Reload extension in browser for manual testing

## Important Considerations

- **YouTube DOM dependency**: The extension relies on YouTube's DOM structure and class names. Changes to YouTube's interface may require selector updates.
- **Theme detection**: Uses multiple fallback methods to detect YouTube's current theme (dark/light)
- **Transcript extraction method**: Uses the most reliable method (`tryOpenViaShowTranscriptButton()`) which has a 100% success rate based on testing
- **No bundling needed**: The extension uses pure JavaScript and doesn't require compilation or bundling

## Testing Approach

Tests use Playwright to:
- Load the extension in headless browsers
- Navigate to YouTube videos
- Verify button injection and styling
- Run separate test suites for Chrome and Firefox compatibility