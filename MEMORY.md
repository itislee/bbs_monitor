# Long-term Memory

## Telegram Connection Issue (Jan 31, 2026)
- Problem: OpenClaw with Node.js 25.5.0 had "fetch failed" errors with Telegram channel
- Root cause: Compatibility issue between Node.js 24+ undici fetch implementation and OpenClaw's network requests
- Solution: Use NODE_OPTIONS="--no-experimental-fetch" when starting OpenClaw
- Configuration changes: Set channels.telegram.network.autoSelectFamily to false to disable IPv6 priority

## BBS Monitor Chrome Extension (Jan 31, 2026)
- Successfully developed complete Chrome extension for monitoring BBS forums
- Features: keyword detection, duplicate prevention, configurable intervals, notification system
- Fixed character encoding issues by adding UTF-8 meta tags to HTML files
- Enhanced popup interface with detailed status information (last check time, notification count, monitored URL count, check interval)
- Added direct options page access from popup
- All code pushed to GitHub repository: itislee/bbs_monitor

## System Configuration
- Gateway port: 18789
- Telegram bot token configured
- Network settings adjusted for better compatibility with newer Node.js versions