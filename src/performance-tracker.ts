export class PerformanceTracker {
  /**
   * Measure a single async operation
   */
  async measureOperation(fn: () => Promise<any>): Promise<number> {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  }

  /**
   * Measure an operation multiple times and return the average
   * First run is discarded as warm-up
   */
  async measureRepeated(
    fn: () => Promise<any>,
    iterations: number = 5,
  ): Promise<number> {
    if (iterations < 1) {
      throw new Error("Iterations must be at least 1");
    }

    // Actual measurements
    const timings: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const timing = await this.measureOperation(fn);
      timings.push(timing);
    }

    // Calculate average
    const sum = timings.reduce((acc, val) => acc + val, 0);
    const average = sum / timings.length;

    return Math.round(average * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get statistics for a set of timings
   */
  getStats(timings: number[]): {
    min: number;
    max: number;
    avg: number;
    median: number;
  } {
    if (timings.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0 };
    }

    const sorted = [...timings].sort((a, b) => a - b);
    const sum = timings.reduce((acc, val) => acc + val, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / timings.length,
      median: sorted[Math.floor(sorted.length / 2)],
    };
  }
}
