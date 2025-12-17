// src/app/components/debug/debug.component.ts
import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

interface MemorySnapshot {
  route: string;
  timestamp: Date;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  delta: number;
}

interface HydrationLog {
  timestamp: Date;
  serverChecksum: string;
  clientChecksum: string;
  match: boolean;
  element: string;
}

@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-4 text-gray-900">Debug Console</h1>
      <p class="text-gray-600 mb-8">Hydration consistency and memory monitoring tools</p>

      <!-- Environment Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 class="text-xl font-semibold text-blue-900 mb-3">Environment</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-blue-700">Platform</p>
            <p class="font-semibold text-blue-900">{{ isBrowser ? 'Browser' : 'Server' }}</p>
          </div>
          <div>
            <p class="text-sm text-blue-700">SSR</p>
            <p class="font-semibold text-blue-900">{{ isBrowser ? 'Hydrated' : 'Rendering' }}</p>
          </div>
          <div>
            <p class="text-sm text-blue-700">User Agent</p>
            <p class="font-semibold text-blue-900 text-xs truncate">{{ userAgent }}</p>
          </div>
          <div>
            <p class="text-sm text-blue-700">Memory API</p>
            <p class="font-semibold text-blue-900">{{ memoryApiAvailable ? 'Available' : 'Unavailable' }}</p>
          </div>
        </div>
      </div>

      <!-- Hydration Logs -->
      <div class="bg-white rounded-lg shadow-lg mb-8">
        <div class="p-6 border-b flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-gray-900">Hydration Logs</h2>
            <p class="text-gray-600 mt-1">{{ hydrationLogs.length }} log(s)</p>
          </div>
          <button 
            (click)="testHydration()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Test Hydration
          </button>
        </div>

        <div class="p-6">
          <div *ngIf="hydrationLogs.length === 0" class="text-center py-8 text-gray-500">
            <p>No hydration logs yet. Click "Test Hydration" to generate logs.</p>
          </div>

          <div *ngFor="let log of hydrationLogs" 
               class="border rounded-lg p-4 mb-4"
               [ngClass]="log.match ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-semibold"
                      [ngClass]="log.match ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'">
                  {{ log.match ? 'MATCH' : 'MISMATCH' }}
                </span>
                <span class="text-sm text-gray-600">{{ log.timestamp | date:'medium' }}</span>
              </div>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex items-start">
                <span class="text-gray-600 w-32 font-medium">Element:</span>
                <span class="text-gray-900 font-mono">{{ log.element }}</span>
              </div>
              <div class="flex items-start">
                <span class="text-gray-600 w-32 font-medium">Server Checksum:</span>
                <span class="text-gray-900 font-mono">{{ log.serverChecksum }}</span>
              </div>
              <div class="flex items-start">
                <span class="text-gray-600 w-32 font-medium">Client Checksum:</span>
                <span class="text-gray-900 font-mono">{{ log.clientChecksum }}</span>
              </div>
            </div>

            <div *ngIf="!log.match" class="mt-3 pt-3 border-t border-red-200">
              <p class="text-red-700 text-sm font-semibold">⚠️ Hydration mismatch detected!</p>
              <p class="text-red-600 text-xs mt-1">Server and client rendered different content.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Memory Snapshots -->
      <div class="bg-white rounded-lg shadow-lg">
        <div class="p-6 border-b flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-gray-900">Memory Snapshots</h2>
            <p class="text-gray-600 mt-1">{{ memorySnapshots.length }} snapshot(s)</p>
          </div>
          <button 
            (click)="takeSnapshot()"
            [disabled]="!isBrowser || !memoryApiAvailable"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors">
            Take Snapshot
          </button>
        </div>

        <div class="p-6">
          <div *ngIf="!memoryApiAvailable && isBrowser" 
               class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
            <p class="font-semibold">Memory API Not Available</p>
            <p class="text-sm">Use Chrome with --enable-precise-memory-info flag or check console for performance.memory</p>
          </div>

          <div *ngIf="memorySnapshots.length === 0" class="text-center py-8 text-gray-500">
            <p>No memory snapshots yet. Navigate between routes or click "Take Snapshot".</p>
          </div>

          <div class="overflow-x-auto">
            <table *ngIf="memorySnapshots.length > 0" class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used Heap (MB)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Heap (MB)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delta (MB)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr *ngFor="let snapshot of memorySnapshots" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-600">{{ snapshot.timestamp | date:'short' }}</td>
                  <td class="px-4 py-3 text-sm font-mono text-gray-900">{{ snapshot.route }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ formatBytes(snapshot.usedJSHeapSize) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ formatBytes(snapshot.totalJSHeapSize) }}</td>
                  <td class="px-4 py-3 text-sm font-semibold"
                      [ngClass]="{
                        'text-green-600': snapshot.delta < 0,
                        'text-gray-900': snapshot.delta >= 0 && snapshot.delta < memoryThreshold,
                        'text-red-600': snapshot.delta >= memoryThreshold
                      }">
                    {{ snapshot.delta > 0 ? '+' : '' }}{{ formatBytes(snapshot.delta) }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold"
                          [ngClass]="{
                            'bg-green-100 text-green-800': snapshot.delta < memoryThreshold,
                            'bg-red-100 text-red-800': snapshot.delta >= memoryThreshold
                          }">
                      {{ snapshot.delta >= memoryThreshold ? 'WARNING' : 'OK' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Memory Warning -->
          <div *ngIf="hasMemoryWarning()" 
               class="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p class="font-semibold">⚠️ Memory Leak Warning</p>
            <p class="text-sm">Memory delta exceeded {{ formatBytes(memoryThreshold) }} threshold. Possible memory leak detected.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DebugComponent implements OnInit, OnDestroy {
  isBrowser: boolean;
  userAgent: string = 'N/A';
  memoryApiAvailable = false;
  memoryThreshold = 10 * 1024 * 1024; // 10 MB threshold

  hydrationLogs: HydrationLog[] = [];
  memorySnapshots: MemorySnapshot[] = [];
  
  private previousMemory: number = 0;
  private routerSubscription?: Subscription;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.userAgent = navigator.userAgent;
      this.memoryApiAvailable = !!(performance as any).memory;
      
      // Take initial snapshot
      setTimeout(() => this.takeSnapshot(), 1000);

      // Monitor route changes
      this.routerSubscription = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          setTimeout(() => this.takeSnapshot(), 500);
        });

      // Simulate hydration check on load
      setTimeout(() => this.testHydration(), 2000);
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  /**
   * Test hydration consistency by comparing checksums
   */
  testHydration(): void {
    if (!this.isBrowser) return;

    const element = 'body';
    const serverChecksum = this.generateChecksum(document.body.innerHTML, 'server');
    const clientChecksum = this.generateChecksum(document.body.innerHTML, 'client');

    const log: HydrationLog = {
      timestamp: new Date(),
      serverChecksum,
      clientChecksum,
      match: serverChecksum === clientChecksum,
      element
    };

    this.hydrationLogs.unshift(log);

    if (!log.match) {
      console.warn('Hydration mismatch detected!', log);
    }
  }

  /**
   * Generate a simple checksum for comparison
   */
  private generateChecksum(content: string, source: string): string {
    let hash = 0;
    const str = content + source;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): void {
    if (!this.isBrowser || !this.memoryApiAvailable) return;

    const memory = (performance as any).memory;
    const currentMemory = memory.usedJSHeapSize;
    const delta = this.previousMemory ? currentMemory - this.previousMemory : 0;

    const snapshot: MemorySnapshot = {
      route: this.router.url,
      timestamp: new Date(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      delta
    };

    this.memorySnapshots.unshift(snapshot);
    this.previousMemory = currentMemory;

    // Warn if delta exceeds threshold
    if (delta > this.memoryThreshold) {
      console.warn(`Memory delta exceeded threshold: ${this.formatBytes(delta)}`, snapshot);
    }

    // Keep only last 20 snapshots
    if (this.memorySnapshots.length > 20) {
      this.memorySnapshots = this.memorySnapshots.slice(0, 20);
    }
  }

  /**
   * Format bytes to MB
   */
  formatBytes(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  /**
   * Check if any snapshot has memory warning
   */
  hasMemoryWarning(): boolean {
    return this.memorySnapshots.some(s => s.delta >= this.memoryThreshold);
  }
}