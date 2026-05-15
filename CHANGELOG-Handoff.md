# HuntWindow handoff changes

## Branding/icon updates
- Added `public/app-icon.png` for favicon, Apple touch icon, and installable web app identity.
- Added `public/huntwindow-emblem.png` for the in-app HuntWindow emblem.
- Added `public/manifest.webmanifest`.
- Updated `index.html` to reference the favicon, Apple touch icon, and manifest.
- Updated `src/App.jsx` so the app uses the new emblem in headers/tabs and the full app badge on onboarding.

## Quality/stability fixes
- Replaced UTC-based `todayStr()` / date math with local-date-safe helpers to avoid one-day-off bugs caused by `toISOString()`.
- Changed missing county weather coordinates so the app no longer silently falls back to Washington, D.C. weather for counties that do not yet have coordinates.
- Weather now displays a clear unavailable message when a selected county has no coordinate data.

## Verified
- Ran `npm run build` successfully after changes.

## Recommended next pass
- Add coordinates for all remaining counties, especially Virginia counties.
- Split `src/App.jsx` into data/components/utils files.
- Move regulations into structured JSON so yearly updates are easier.


## Data Reliability Pass #1 - Icon hardening, coordinates, and data status
- Added base-path-safe icon links in `index.html` using Vite `%BASE_URL%` so icons work better on GitHub Pages/subpath deployments.
- Added dedicated `apple-touch-icon.png`, 32px favicon, 192px/512px PWA icons, and maskable icon.
- Updated in-app image asset paths to respect `import.meta.env.BASE_URL`.
- Added coordinate coverage for all currently listed Virginia counties so Open-Meteo weather no longer fails for most VA counties.
- Added a Settings > Regulation Data Status section that clearly states the app uses stored local regulation data.
- Added a manual source-check button that opens official DNR/DWR sources and records the local check timestamp.
- Note: This pass does not implement live automatic regulation parsing. That should be done through a curated JSON update workflow or backend scraper/parser, not blind browser-side scraping.
