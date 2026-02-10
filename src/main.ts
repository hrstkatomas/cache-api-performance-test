import { CacheTester } from "./cache-tester.js";
import { ChartRenderer } from "./chart-renderer.js";

// Global state
let tester: CacheTester | null = null;
let renderer: ChartRenderer | null = null;
let isTestRunning = false;

/**
 * Initialize the application
 */
function init(): void {
  console.log("Cache API Performance Test initialized");

  // Initialize chart
  renderer = new ChartRenderer();
  renderer.initialize("performance-chart");

  // Hook up event listeners
  const startButton = document.getElementById(
    "start-test",
  ) as HTMLButtonElement;
  const stopButton = document.getElementById("stop-test") as HTMLButtonElement;

  startButton.addEventListener("click", handleStartTest);
  stopButton.addEventListener("click", handleStopTest);

  // Display initial storage info
  updateStorageInfo();
}

/**
 * Handle start test button click
 */
async function handleStartTest(): Promise<void> {
  if (isTestRunning) {
    console.warn("Test already running");
    return;
  }

  // Get user inputs
  const targetSizeInput = document.getElementById(
    "target-size",
  ) as HTMLInputElement;
  const targetSizeGB = parseFloat(targetSizeInput.value);

  if (isNaN(targetSizeGB) || targetSizeGB <= 0) {
    alert("Please enter a valid target size (greater than 0)");
    return;
  }

  // Confirm for large tests
  if (targetSizeGB > 2) {
    const confirmed = confirm(
      `You're about to test ${targetSizeGB}GB of cache data. This may take a long time and use significant memory. Continue?`,
    );
    if (!confirmed) {
      return;
    }
  }

  // Update UI
  isTestRunning = true;
  updateUIState();

  // Clear previous results
  if (renderer) {
    renderer.clear();
  }
  hideSummary();

  // Create tester instance
  tester = new CacheTester(0.01); // 5MB average asset size

  const startTime = Date.now();

  try {
    // Run test
    const results = await tester.runTest(
      targetSizeGB,
      10, // step size
      (progress) => {
        updateProgress(progress);
      },
      (result) => {
        if (renderer) {
          renderer.updateData(result);
        }
        updateStorageInfo();
      },
    );

    // Test complete
    const duration = Date.now() - startTime;
    console.log(`Test completed in ${(duration / 1000).toFixed(1)}s`);

    displaySummary(results, duration);
    updateProgressText("Test complete!");
  } catch (error) {
    console.error("Test failed:", error);
    alert(
      `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    updateProgressText("Test failed");
  } finally {
    isTestRunning = false;
    updateUIState();
  }
}

/**
 * Handle stop test button click
 */
function handleStopTest(): void {
  if (!isTestRunning) {
    return;
  }

  // Note: This is a placeholder. Actual cancellation would require
  // implementing cancellation tokens in the tester
  console.warn(
    "Stop functionality not fully implemented. Reload page to stop.",
  );
  alert("To stop the test, please reload the page.");
}

/**
 * Update progress bar and text
 */
function updateProgress(progress: {
  current: number;
  total: number;
  percentComplete: number;
  currentPhase: string;
}): void {
  const progressBar = document.getElementById(
    "progress-bar",
  ) as HTMLProgressElement;
  const progressText = document.getElementById(
    "progress-text",
  ) as HTMLSpanElement;

  progressBar.value = progress.percentComplete;
  progressText.textContent = `${progress.percentComplete.toFixed(1)}% - ${progress.currentPhase}`;
}

/**
 * Update progress text only
 */
function updateProgressText(text: string): void {
  const progressText = document.getElementById(
    "progress-text",
  ) as HTMLSpanElement;
  progressText.textContent = text;
}

/**
 * Update UI state based on test running status
 */
function updateUIState(): void {
  const startButton = document.getElementById(
    "start-test",
  ) as HTMLButtonElement;
  const stopButton = document.getElementById("stop-test") as HTMLButtonElement;
  const targetSizeInput = document.getElementById(
    "target-size",
  ) as HTMLInputElement;

  startButton.disabled = isTestRunning;
  stopButton.disabled = !isTestRunning;
  targetSizeInput.disabled = isTestRunning;
}

/**
 * Display test summary
 */
function displaySummary(
  results: Array<{
    assetCount: number;
    totalSizeMB: number;
    openTimeMs: number;
    matchTimeMs: number;
    timestamp: number;
  }>,
  durationMs: number,
): void {
  const summaryDiv = document.getElementById("summary") as HTMLDivElement;
  const summaryContent = document.getElementById(
    "summary-content",
  ) as HTMLDivElement;

  if (results.length === 0) {
    summaryContent.innerHTML = "<p>No results to display</p>";
    summaryDiv.style.display = "block";
    return;
  }

  const lastResult = results[results.length - 1];
  const openTimes = results.map((r) => r.openTimeMs);
  const matchTimes = results.map((r) => r.matchTimeMs);

  const avgOpen = openTimes.reduce((a, b) => a + b, 0) / openTimes.length;
  const avgMatch = matchTimes.reduce((a, b) => a + b, 0) / matchTimes.length;
  const maxOpen = Math.max(...openTimes);
  const maxMatch = Math.max(...matchTimes);

  summaryContent.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
      <div>
        <h3>Test Parameters</h3>
        <p><strong>Total Assets:</strong> ${lastResult.assetCount}</p>
        <p><strong>Total Size:</strong> ${lastResult.totalSizeMB.toFixed(2)} MB</p>
        <p><strong>Test Duration:</strong> ${(durationMs / 1000).toFixed(1)} seconds</p>
        <p><strong>Measurements:</strong> ${results.length}</p>
      </div>

      <div>
        <h3>caches.open() Performance</h3>
        <p><strong>Average:</strong> ${avgOpen.toFixed(2)} ms</p>
        <p><strong>Maximum:</strong> ${maxOpen.toFixed(2)} ms</p>
        <p><strong>First:</strong> ${results[0].openTimeMs.toFixed(2)} ms</p>
        <p><strong>Last:</strong> ${lastResult.openTimeMs.toFixed(2)} ms</p>
      </div>

      <div>
        <h3>cache.match() Performance</h3>
        <p><strong>Average:</strong> ${avgMatch.toFixed(2)} ms</p>
        <p><strong>Maximum:</strong> ${maxMatch.toFixed(2)} ms</p>
        <p><strong>First:</strong> ${results[0].matchTimeMs.toFixed(2)} ms</p>
        <p><strong>Last:</strong> ${lastResult.matchTimeMs.toFixed(2)} ms</p>
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3>Analysis</h3>
      <p>${getPerformanceAnalysis(results)}</p>
    </div>
  `;

  summaryDiv.style.display = "block";
}

/**
 * Generate performance analysis text
 */
function getPerformanceAnalysis(
  results: Array<{
    assetCount: number;
    totalSizeMB: number;
    openTimeMs: number;
    matchTimeMs: number;
  }>,
): string {
  if (results.length < 2) {
    return "Not enough data points for analysis.";
  }

  const first = results[0];
  const last = results[results.length - 1];

  const openIncrease =
    ((last.openTimeMs - first.openTimeMs) / first.openTimeMs) * 100;
  const matchIncrease =
    ((last.matchTimeMs - first.matchTimeMs) / first.matchTimeMs) * 100;

  let analysis = "";

  if (openIncrease < 10) {
    analysis +=
      "<strong>caches.open()</strong> shows excellent scalability with minimal degradation. ";
  } else if (openIncrease < 50) {
    analysis +=
      "<strong>caches.open()</strong> shows moderate degradation as cache size increases. ";
  } else {
    analysis +=
      "<strong>caches.open()</strong> shows significant performance degradation at scale. ";
  }

  if (matchIncrease < 10) {
    analysis +=
      "<strong>cache.match()</strong> maintains consistent performance across cache sizes.";
  } else if (matchIncrease < 50) {
    analysis +=
      "<strong>cache.match()</strong> shows moderate slowdown with larger cache sizes.";
  } else {
    analysis +=
      "<strong>cache.match()</strong> experiences notable performance degradation at scale.";
  }

  return analysis;
}

/**
 * Hide summary section
 */
function hideSummary(): void {
  const summaryDiv = document.getElementById("summary") as HTMLDivElement;
  summaryDiv.style.display = "none";
}

/**
 * Update storage information display
 */
async function updateStorageInfo(): Promise<void> {
  if (!("storage" in navigator) || !("estimate" in navigator.storage)) {
    return;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;

    const storageInfo = document.getElementById(
      "storage-info",
    ) as HTMLDivElement;
    storageInfo.innerHTML = `
      Storage: ${(usage / (1024 * 1024)).toFixed(2)} MB / ${(quota / (1024 * 1024)).toFixed(2)} MB
      (${usagePercent.toFixed(1)}% used)
    `;
  } catch (error) {
    console.error("Failed to get storage estimate:", error);
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
