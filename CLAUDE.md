# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CaptionClip is a browser extension that extracts transcripts from YouTube videos. It works by programmatically opening YouTube's transcript panel and extracting the text content.

## Build Commands

```bash
# Build for both Chrome and Firefox
node build.js
```

This creates browser-specific distributions in:
- `dist/chrome/` - Chrome extension (Manifest V3)
- `dist/firefox/` - Firefox extension (Manifest V2)

## Architecture

### Extension Components

1. **Content Script (`content.js`)**: Injected into YouTube video pages. Handles the transcript extraction logic by:
   - Attempting multiple methods to open the transcript panel
   - Waiting for transcript elements to load
   - Extracting and concatenating all transcript segments

2. **Popup Interface (`popup.html` / `popup.js`)**: User interface that:
   - Sends messages to the content script to trigger extraction
   - Displays extracted transcript in a textarea
   - Provides copy-to-clipboard functionality

3. **Browser-Specific Manifests**:
   - `src/manifest.chrome.json` - Chrome Manifest V3 format
   - `src/manifest.firefox.json` - Firefox Manifest V2 format
   - Development uses `manifest.json` (Chrome V3 format)

### Message Flow

1. User clicks "Extract Transcript" in popup
2. Popup sends `extract_transcript` message to content script
3. Content script attempts to open transcript panel using multiple strategies
4. Content script extracts text from `#segments-container` elements
5. Content script sends transcript back to popup
6. Popup displays transcript and enables copy button

### Transcript Extraction Strategies

The content script tries three methods to open the transcript panel (in order):
1. `tryOpenViaShowTranscriptButton()` - Direct "Show transcript" button in video description area
   - Primary selector: `ytd-video-description-transcript-section-renderer button[aria-label="Show transcript"]`
   - Fallback: Searches all buttons for transcript-related text or aria-labels
2. `tryOpenViaMoreActions()` - Player's "..." menu button
3. `tryOpenViaThreeDots()` - Three dots menu below video

## Key Implementation Details

- Uses Chrome Extension APIs (compatible with both Chrome and Firefox)
- No external dependencies or npm packages
- Handles async operations with Promises
- Implements retry logic with multiple selectors for UI elements
- Times out after 10 seconds if transcript cannot be loaded