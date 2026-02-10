# Cache API Performance Test

A TypeScript-based performance testing tool to measure Cache API behavior under heavy load (gigabytes of data).

## Demo

![Cache API Performance Test Demo](public/assets/demo.gif)

Watch the tool in action: incrementally adding assets to the cache and measuring performance in real-time.

## What It Does

This tool helps you understand how `caches.open()` and `cache.match()` performance degrades as the cache grows to production-scale sizes. It:

- Incrementally adds large assets (5MB each) to the Cache API
- Measures `caches.open()` and `cache.match()` timing after each increment
- Scales to gigabytes of cached data
- Displays results in a real-time updating chart
- Provides detailed performance analysis

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Start the Server

```bash
npm run serve
```

Or use any other static file server:

```bash
python3 -m http.server 8000
```

**Note:** The server must run from the project root (not the public directory) so both `/public/` and `/dist/` are accessible.

### 4. Open in Browser

Navigate to: http://localhost:8000/public/

### 5. Run a Test

1. Enter your target cache size (e.g., 1 for 1GB)
2. Click "Start Test"
3. Watch the real-time chart updates
4. Review the summary when complete
