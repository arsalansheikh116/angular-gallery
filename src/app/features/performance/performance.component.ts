// src/app/features/performance/performance.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

interface BenchmarkResult {
  primesFound: number;
  executionTime: number;
  cpuUtilization: number;
  timestamp: Date;
}

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-4">CPU Benchmark</h1>
      <p class="text-gray-600 mb-8">
        Compute all prime numbers up to 350,000 using a Web Worker
      </p>

      <!-- Controls -->
      <div class="bg-white rounded-lg shadow p-6 mb-6 flex gap-4 items-center flex-wrap">
        <button
          (click)="runBenchmark()"
          [disabled]="isRunning || !isBrowser"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold
                 hover:bg-blue-700 disabled:bg-gray-400 cursor-pointer">
          {{ isRunning ? 'Running...' : 'Run Benchmark' }}
        </button>

        <button
          (click)="clearHistory()"
          [disabled]="results.length === 0"
          class="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold
                 hover:bg-gray-700 disabled:bg-gray-400 cursor-pointer">
          Clear History
        </button>

        <div *ngIf="isRunning" class="flex items-center text-blue-600">
          <span class="animate-spin h-5 w-5 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></span>
          Processing...
        </div>
      </div>

      <!-- Latest Result -->
      <div *ngIf="latestResult"
           class="bg-green-50 border border-green-300 rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">Latest Result</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white p-4 rounded shadow">
            <p class="text-sm text-gray-600">Primes Found</p>
            <p class="text-3xl font-bold text-green-600">
              {{ latestResult.primesFound.toLocaleString() }}
            </p>
          </div>

          <div class="bg-white p-4 rounded shadow">
            <p class="text-sm text-gray-600">Execution Time</p>
            <p class="text-3xl font-bold text-blue-600">
              {{ latestResult.executionTime.toFixed(2) }} ms
            </p>
          </div>

          <div class="bg-white p-4 rounded shadow">
            <p class="text-sm text-gray-600">CPU Utilization</p>
            <p class="text-3xl font-bold text-purple-600">
              {{ latestResult.cpuUtilization.toFixed(1) }}%
            </p>
          </div>
        </div>
      </div>

      <!-- History -->
      <div *ngIf="results.length > 0"
           class="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div class="p-4 border-b">
          <h2 class="text-xl font-semibold">Benchmark History</h2>
        </div>

        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left">#</th>
              <th class="px-4 py-2 text-left">Time</th>
              <th class="px-4 py-2 text-left">Primes</th>
              <th class="px-4 py-2 text-left">ms</th>
              <th class="px-4 py-2 text-left">CPU %</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of results; let i = index"
                class="border-t hover:bg-gray-50">
              <td class="px-4 py-2">{{ results.length - i }}</td>
              <td class="px-4 py-2">{{ r.timestamp | date:'shortTime' }}</td>
              <td class="px-4 py-2">{{ r.primesFound.toLocaleString() }}</td>
              <td class="px-4 py-2">{{ r.executionTime.toFixed(2) }}</td>
              <td class="px-4 py-2">{{ r.cpuUtilization.toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- SSR Warning -->
      <div *ngIf="!isBrowser"
           class="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded">
        Web Workers only run in the browser.
      </div>
    </div>
  `
})
export class PerformanceComponent implements OnInit, OnDestroy {
  results: BenchmarkResult[] = [];
  latestResult: BenchmarkResult | null = null;

  isRunning = false;
  isBrowser: boolean;

  private worker: Worker | null = null;

  constructor(@Inject(PLATFORM_ID) platformId: Object, private cdr: ChangeDetectorRef) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.worker = new Worker(
        new URL('./prime.worker', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = ({ data }) => {
        const cpuUtilization = this.calculateCPUUtilization(
          data.executionTime
        );

        const result: BenchmarkResult = {
          primesFound: data.primesFound,
          executionTime: data.executionTime,
          cpuUtilization,
          timestamp: new Date()
        };

        this.results.unshift(result);
        this.latestResult = result;
        this.isRunning = false;
        this.cdr.markForCheck();
      };

      this.worker.onerror = (err) => {
        console.error('Worker error', err);
        this.isRunning = false;
        this.cdr.markForCheck();
      };
    }
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
  }

  runBenchmark(): void {
    if (!this.worker || this.isRunning) return;
    this.isRunning = true;
    this.worker.postMessage('start');
  }

  clearHistory(): void {
    this.results = [];
    this.latestResult = null;
  }

  /**
   * Synthetic CPU Utilization Estimate
   */
  private calculateCPUUtilization(executionTime: number): number {
    const theoreticalMinTime = 50; // ms (baseline)
    const baseUtilization = 65;

    const factor =
      Math.log(executionTime + 1) /
      Math.log(theoreticalMinTime + 1);

    return Math.min(baseUtilization * factor, 100);
  }
}
