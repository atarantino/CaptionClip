# CaptionClip

A browser extension that extracts transcripts from YouTube videos with a single click.

## Installation

### Chrome

1. **Build the extension**
   ```bash
   node build.js
   ```

2. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `dist/chrome` folder
   - The extension icon should appear in your toolbar

### Firefox

1. **Build the extension**
   ```bash
   node build.js
   ```

2. **Load the extension in Firefox**
   - Open Firefox and navigate to `about:debugging`
   - Click "This Firefox" in the left sidebar
   - Click "Load Temporary Add-on"
   - Navigate to the `dist/firefox` folder
   - Select the `manifest.json` file
   - The extension will be loaded temporarily (until Firefox restarts)

## Usage

1. Navigate to any YouTube video that has closed captions/transcripts available
2. Click the CaptionClip extension icon in your browser toolbar
3. Click "Extract Transcript" in the popup
4. Wait for the transcript to load (usually takes a few seconds)
5. Click "Copy to Clipboard" to copy the entire transcript

## Troubleshooting

- **No transcript found**: Make sure the video has closed captions available. Look for the "CC" button in the YouTube player.
- **Extension not working**: Try refreshing the YouTube page after installing the extension.
- **Firefox users**: The extension needs to be reloaded after each browser restart when using the temporary installation method.

## Development

To work on the extension locally:

1. Make your changes to the source files
2. Run `node build.js` to rebuild the distribution files
3. Reload the extension in your browser:
   - **Chrome**: Go to `chrome://extensions/` and click the refresh icon on the CaptionClip extension
   - **Firefox**: Go to `about:debugging`, click "Reload" next to the extension