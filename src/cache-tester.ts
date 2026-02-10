import { AssetGenerator } from "./asset-generator.js";
import { PerformanceTracker } from "./performance-tracker.js";

export interface TestResult {
  assetCount: number;
  totalSizeMB: number;
  openTimeMs: number;
  matchTimeMs: number;
  timestamp: number;
}

export interface TestProgress {
  current: number;
  total: number;
  percentComplete: number;
  currentPhase: string;
}

export type ProgressCallback = (progress: TestProgress) => void;
export type ResultCallback = (result: TestResult) => void;

export class CacheTester {
  private cacheName = "perf-test-cache";
  private tracker = new PerformanceTracker();
  private generator: AssetGenerator;
  private cachedUrls: string[] = [];

  constructor(avgAssetSizeMB: number = 5) {
    this.generator = new AssetGenerator(avgAssetSizeMB);
  }

  /**
   * Run the complete performance test
   */
  async runTest(
    targetSizeGB: number,
    stepSize: number = 10,
    onProgress?: ProgressCallback,
    onResult?: ResultCallback,
  ): Promise<TestResult[]> {
    // Clear existing cache
    await this.clearCache();
    this.cachedUrls = [];

    // Calculate total assets needed
    const avgAssetSizeMB = 0.01;
    const assetsNeeded = Math.ceil((targetSizeGB * 1024) / avgAssetSizeMB);

    console.log(
      `Starting test: target ${targetSizeGB}GB, ~${assetsNeeded} assets, step size: ${stepSize}`,
    );

    const results: TestResult[] = [];
    let currentAssetCount = 0;

    // Incremental test loop
    for (let i = stepSize; i <= assetsNeeded; i += stepSize) {
      // Report progress
      if (onProgress) {
        onProgress({
          current: i,
          total: assetsNeeded,
          percentComplete: (i / assetsNeeded) * 100,
          currentPhase: `Adding assets ${currentAssetCount + 1}-${i}`,
        });
      }

      // Add batch of assets
      const batch = this.generator.generateAssets(stepSize);
      // console.log(batch.map((asset) => asset.url));
      await this.addBatchToCache(batch);
      currentAssetCount = i;

      // Measure caches.open()
      if (onProgress) {
        onProgress({
          current: i,
          total: assetsNeeded,
          percentComplete: (i / assetsNeeded) * 100,
          currentPhase: `Measuring caches.open() [${i} assets]`,
        });
      }
      const openTime = await this.measureCacheOpen();

      // Measure cache.match()
      if (onProgress) {
        onProgress({
          current: i,
          total: assetsNeeded,
          percentComplete: (i / assetsNeeded) * 100,
          currentPhase: `Measuring cache.match() [${i} assets]`,
        });
      }
      const matchTime = await this.measureCacheMatch();

      // Record result
      const result: TestResult = {
        assetCount: i,
        totalSizeMB: Math.round(i * avgAssetSizeMB * 100) / 100,
        openTimeMs: openTime,
        matchTimeMs: matchTime,
        timestamp: Date.now(),
      };

      results.push(result);

      // Report result
      if (onResult) {
        onResult(result);
      }

      console.log(
        `Progress: ${i}/${assetsNeeded} assets, ${result.totalSizeMB}MB, open: ${openTime}ms, match: ${matchTime}ms`,
      );
    }

    if (onProgress) {
      onProgress({
        current: assetsNeeded,
        total: assetsNeeded,
        percentComplete: 100,
        currentPhase: "Complete",
      });
    }

    return results;
  }

  /**
   * Clear the performance test cache
   */
  private async clearCache(): Promise<void> {
    await caches.delete(this.cacheName);
    console.log("Cache cleared");
  }

  /**
   * Add a batch of assets to the cache
   */
  private async addBatchToCache(
    assets: ReturnType<AssetGenerator["generateAssets"]>,
  ): Promise<void> {
    const cache = await caches.open(this.cacheName);

    for (const asset of assets) {
      await cache.put(asset.url, asset.content.clone());
      this.cachedUrls.push(asset.url);
    }
  }

  /**
   * Measure caches.open() performance
   */
  private async measureCacheOpen(): Promise<number> {
    return this.tracker.measureRepeated(async () => {
      await caches.open(this.cacheName);
    }, 5);
  }

  /**
   * Measure cache.match() performance
   */
  private async measureCacheMatch(): Promise<number> {
    if (this.cachedUrls.length === 0) {
      return 0;
    }

    // Pick a random cached URL
    const url = this.getRandomCachedUrl();

    return this.tracker.measureRepeated(async () => {
      const cache = await caches.open(this.cacheName);
      await cache.match(url);
    }, 5);
  }

  /**
   * Get a random URL from the cached URLs
   */
  private getRandomCachedUrl(): string {
    const index = Math.floor(Math.random() * this.cachedUrls.length);
    return this.cachedUrls[index];
  }

  /**
   * Get storage estimate
   */
  async getStorageEstimate(): Promise<{
    usage: number;
    quota: number;
    usagePercent: number;
  }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      return {
        usage,
        quota,
        usagePercent: quota > 0 ? (usage / quota) * 100 : 0,
      };
    }
    return { usage: 0, quota: 0, usagePercent: 0 };
  }
}
