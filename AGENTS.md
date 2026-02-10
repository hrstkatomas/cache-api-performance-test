# Agent Notes

## Project Overview

This project tests Cache API performance at scale by incrementally adding large assets (5MB each) and measuring `caches.open()` and `cache.match()` timing.

## Implementation Details

### Key Design Decisions

1. **Large Assets (5MB each)**: To reach gigabytes quickly without needing thousands of assets
   - 100 assets × 5MB = 500MB
   - 200 assets × 5MB = 1GB
   - 400 assets × 5MB = 2GB

2. **Incremental Testing (10 assets per step)**: Good balance between granularity and test speed

3. **Averaged Measurements**: Each timing measured 5 times (with 1 warm-up run) for accuracy

4. **No Bundler**: Simple TypeScript compilation with native ES modules
   - `type: "module"` in package.json
   - All imports use `.js` extension (TypeScript convention for ES modules)
   - Import map in HTML to resolve `chart.js` to CDN URL: `https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm`

### File Structure

- **asset-generator.ts**: Creates large synthetic assets (HTML/CSS/JS/JSON)
- **performance-tracker.ts**: High-resolution timing with Performance API
- **cache-tester.ts**: Core test orchestration and Cache API operations
- **chart-renderer.ts**: Chart.js integration for real-time visualization
- **main.ts**: UI coordination and event handling

### TypeScript Configuration

- Target: ES2020 (modern browser features)
- Module: ES2020 (native ES modules)
- Strict mode enabled
- Source maps for debugging

### Build Process

1. `npm install` - Install dependencies (chart.js, typescript)
2. `npm run build` - Compile TypeScript to dist/
3. `npm run serve` - Start HTTP server (or use python3)

### Common Issues Fixed

1. **TypeScript strict null checks**: Chart.js context.parsed.y can be null
   - Fixed with: `value !== null ? value.toFixed(2) : '0'`

2. **ES Module imports**: Must use `.js` extension in imports even though source files are `.ts`
   - This is TypeScript's convention for ES modules

3. **Chart.js registration**: Must call `Chart.register(...registerables)` before creating charts

4. **Module resolution in browser**: Can't resolve `chart.js` from node_modules without bundler
   - Fixed with import map: Maps `chart.js` to CDN ESM URL
   - Added `<script type="importmap">` in HTML head

5. **Server directory structure**: Server must run from project root
   - Changed from `--directory public` to root directory
   - Allows access to both `/public/` and `/dist/` paths

## Testing in Browser

### Recommended Test Sequence

1. **Small test (100MB)**: Verify basic functionality
   - Quick execution (~1-2 minutes)
   - Good for debugging

2. **Medium test (500MB-1GB)**: Observe performance patterns
   - Takes ~5-10 minutes
   - Shows degradation trends

3. **Large test (2GB+)**: Production-scale testing
   - Takes 15-30 minutes
   - May strain browser memory

### Browser DevTools Verification

- Open DevTools → Application → Cache Storage
- Should see "perf-test-cache" with many entries
- Can inspect individual cached responses
- Check Network tab (throttling is ignored for Cache API)

### Expected Performance Patterns

- **caches.open()**: Should be relatively constant (O(1) cache lookup)
- **cache.match()**: May show slight degradation (depends on browser indexing)

### Storage Quota

- Check available quota: `navigator.storage.estimate()`
- Chrome typically allows 60% of available disk space
- Test displays current usage in MB

## Future Improvements

If you extend this project, consider:

1. **Pause/Resume**: Add ability to pause and resume tests
2. **Export Results**: Save results to JSON/CSV
3. **Comparison Mode**: Compare multiple test runs
4. **Different Asset Sizes**: Test with varying asset sizes (1MB, 10MB, 50MB)
5. **Browser Comparison**: Automated testing across browsers
6. **Memory Profiling**: Track memory usage during tests
