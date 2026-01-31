# Web Monitor Chrome Extension

A Chrome extension to monitor web pages for keyword changes and updates.

## Features

- Monitors specified URLs for new content containing specified keywords
- Detects keywords in page content using regular expressions
- Displays notification badge with match count
- Shows detailed match results in a dedicated page
- Configurable check intervals
- Stores historical match data

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension folder

## Configuration

1. Click the extension icon in the toolbar
2. Click "Options Settings" to configure:
   - URLs to monitor (one per line)
   - Keywords to detect (comma-separated)
   - Check interval (in seconds)

## Usage

- The badge on the extension icon shows the number of matches found
- Click "View Match Results" to see all detected matches with context
- Click any match to visit the corresponding URL
- Use "Manual Check Now" to trigger an immediate scan

## Technical Details

- Uses Chrome Alarms API for scheduled checks
- Stores data using Chrome Storage API
- Performs content analysis client-side for privacy
- Supports multiple URLs and keywords simultaneously

## Privacy

All content analysis happens locally in your browser. No data is transmitted to external servers.

## Requirements

- Chrome browser version 88 or higher
- Access to the websites being monitored (may require login for private sites)