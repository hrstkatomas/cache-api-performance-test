import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { TestResult } from './cache-tester.js';

// Register Chart.js components
Chart.register(...registerables);

export class ChartRenderer {
  private chart: Chart | null = null;

  /**
   * Initialize the chart
   */
  initialize(canvasId: string): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'caches.open() (ms)',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'cache.match() (ms)',
            data: [],
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Cache Size (MB)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Time (ms)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 12
              },
              padding: 15
            }
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value !== null ? value.toFixed(2) : '0'} ms`;
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(canvas, config);
  }

  /**
   * Update chart with new result
   */
  updateData(result: TestResult): void {
    if (!this.chart) {
      throw new Error('Chart not initialized. Call initialize() first.');
    }

    // Add label (total size in MB)
    this.chart.data.labels?.push(result.totalSizeMB.toString());

    // Add data points
    this.chart.data.datasets[0].data.push(result.openTimeMs);
    this.chart.data.datasets[1].data.push(result.matchTimeMs);

    // Update the chart
    this.chart.update('none'); // 'none' disables animation for better performance
  }

  /**
   * Clear all data from the chart
   */
  clear(): void {
    if (!this.chart) {
      return;
    }

    this.chart.data.labels = [];
    this.chart.data.datasets[0].data = [];
    this.chart.data.datasets[1].data = [];
    this.chart.update();
  }

  /**
   * Destroy the chart instance
   */
  destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
