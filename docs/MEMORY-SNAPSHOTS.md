# Memory Snapshot Examples and Analysis

## Overview

This document provides examples and analysis of memory snapshots captured by the Debug Console feature in the Angular SSR Photo Gallery application.

---

## Table of Contents

1. [Memory Monitoring Setup](#memory-monitoring-setup)
2. [How Memory Snapshots Work](#how-memory-snapshots-work)
3. [Example Snapshots](#example-snapshots)
4. [Memory Leak Detection](#memory-leak-detection)
5. [Performance Impact](#performance-impact)
6. [Best Practices](#best-practices)

---

## Memory Monitoring Setup

### Browser Requirements

The memory monitoring feature uses the **Performance Memory API**, which is available in:
- Chrome/Chromium (with flag)
- Edge (Chromium-based)
- Firefox (not available)
- Safari (not available)

### Enabling Memory API in Chrome

1. Close all Chrome instances
2. Launch Chrome with flag:
```bash
   # Windows
   chrome.exe --enable-precise-memory-info

   # macOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --enable-precise-memory-info

   # Linux
   google-chrome --enable-precise-memory-info
```
3. Navigate to the application
4. Memory API will be available

---

## How Memory Snapshots Work

### Implementation
```typescript
interface MemorySnapshot {
  route: string;              // Current route
  timestamp: Date;            // When snapshot was taken
  usedJSHeapSize: number;     // Memory in use (bytes)
  totalJSHeapSize: number;    // Total allocated heap (bytes)
  jsHeapSizeLimit: number;    // Maximum heap size (bytes)
  delta: number;              // Change from previous snapshot (bytes)
}
```

### Automatic Snapshot Triggers

1. **On Route Change:** Snapshot taken 500ms after navigation
2. **On Page Load:** Initial snapshot after 1000ms
3. **Manual:** User clicks "Take Snapshot" button

### Memory Threshold

- **Warning Threshold:** 10 MB (10,485,760 bytes)
- **Alert Triggered:** When delta exceeds threshold
- **Indication:** Possible memory leak

---

## Example Snapshots

### Example 1: Normal Navigation (Healthy)
```
Snapshot #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route:           /
Timestamp:       Dec 18, 2025 3:45:23 PM
Used Heap:       15.32 MB
Total Heap:      28.50 MB
Delta:           +0.00 MB (Initial)
Status:          OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Snapshot #2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route:           /clusters
Timestamp:       Dec 18, 2025 3:45:28 PM
Used Heap:       18.47 MB
Total Heap:      28.50 MB
Delta:           +3.15 MB
Status:          OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Snapshot #3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route:           /performance
Timestamp:       Dec 18, 2025 3:45:35 PM
Used Heap:       19.82 MB
Total Heap:      28.50 MB
Delta:           +1.35 MB
Status:          OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Snapshot #4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route:           /
Timestamp:       Dec 18, 2025 3:45:42 PM
Used Heap:       17.23 MB
Total Heap:      28.50 MB
Delta:           -2.59 MB (Garbage Collection)
Status:          OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Analysis:**
- Memory increases when loading new components (expected)
- Memory decreases when garbage collection runs
- All deltas under 10 MB threshold
- No memory leaks detected

---

### Example 2: Memory Leak Detected (Warning)
```
Snapshot #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route:           /
Timestamp:       Dec 18, 2025 4:12:15 PM
Used Heap:       14.89 MB
Total Heap:      28.50 MB
Delta:           +0.00 MB (Initial)
Status:          OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Snapshot #2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route:           /clusters
Timestamp:       Dec 18, 2025 4:12:20 PM
Used Heap:       27.34 MB
Total Heap:      40.00 MB
Delta:           +12.45 MB
Status:          WARNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Memory Leak Warning
Memory delta exceeded 10.00 MB threshold.
Possible memory leak detected.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Snapshot #3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route:           /performance
Timestamp:       Dec 18, 2025 4:12:25 PM
Used Heap:       35.67 MB
Total Heap:      50.00 MB
Delta:           +8.33 MB
Status:          OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Snapshot #4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route:           /
Timestamp:       Dec 18, 2025 4:12:30 PM
Used Heap:       42.89 MB
Total Heap:      60.00 MB
Delta:           +7.22 MB
Status:          OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Analysis:**
- Snapshot #2 shows 12.45 MB increase (exceeds 10 MB threshold)
- Subsequent snapshots show continued memory growth
- Possible causes:
  - Event listeners not cleaned up
  - Observables not unsubscribed
  - DOM references retained
  - Timer/interval not cleared

---

### Example 3: After Running CPU Benchmark
```
Snapshot #1 (Before Benchmark)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route:           /performance
Timestamp:       Dec 18, 2025 5:20:10 PM
Used Heap:       16.45 MB
Total Heap:      28.50 MB
Delta:           +0.00 MB (Initial)
Status:          OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Snapshot #2 (During Benchmark)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route:           /performance
Timestamp:       Dec 18, 2025 5:20:15 PM
Used Heap:       24.78 MB
Total Heap:      40.00 MB
Delta:           +8.33 MB
Status:          OK
Note:            Web Worker running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Snapshot #3 (After Benchmark)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route:           /performance
Timestamp:       Dec 18, 2025 5:20:20 PM
Used Heap:       18.92 MB
Total Heap:      40.00 MB
Delta:           -5.86 MB (Cleanup)
Status:          OK
Note:            Worker terminated, GC ran
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Analysis:**
- Memory increases during computation (expected)
- Memory decreases after worker termination
- Proper cleanup demonstrated
- No memory retained after operation

---

## Memory Leak Detection

### Common Causes of Memory Leaks

1. **Unsubscribed Observables**
```typescript
   // BAD: Memory Leak
   ngOnInit() {
     this.service.getData().subscribe(data => {
       this.data = data;
     });
   }

   // GOOD: Proper Cleanup
   subscription!: Subscription;
   
   ngOnInit() {
     this.subscription = this.service.getData().subscribe(data => {
       this.data = data;
     });
   }
   
   ngOnDestroy() {
     this.subscription.unsubscribe();
   }
```

2. **Event Listeners Not Removed**
```typescript
   // BAD: Memory Leak
   ngOnInit() {
     window.addEventListener('scroll', this.onScroll);
   }

   // GOOD: Proper Cleanup
   ngOnInit() {
     window.addEventListener('scroll', this.onScroll);
   }
   
   ngOnDestroy() {
     window.removeEventListener('scroll', this.onScroll);
   }
```

3. **Timers Not Cleared**
```typescript
   // BAD: Memory Leak
   ngOnInit() {
     setInterval(() => {
       this.updateData();
     }, 1000);
   }

   // GOOD: Proper Cleanup
   intervalId!: number;
   
   ngOnInit() {
     this.intervalId = setInterval(() => {
       this.updateData();
     }, 1000);
   }
   
   ngOnDestroy() {
     clearInterval(this.intervalId);
   }
```

### Detection Strategy

1. **Navigate through all routes** multiple times
2. **Take snapshots** after each navigation
3. **Look for patterns:**
   - Consistently increasing memory
   - Delta always positive
   - No garbage collection
4. **Verify cleanup** in ngOnDestroy hooks

---

## Performance Impact

### Memory Monitoring Overhead

- **Snapshot Creation:** ~0.1ms
- **Storage:** ~200 bytes per snapshot
- **Display Rendering:** ~1ms per snapshot
- **Total Impact:** Negligible (< 0.1% of application performance)

### Best Practices

1. **Limit Snapshot History:** Keep only last 20 snapshots
2. **Debounce Snapshots:** Wait 500ms after route change
3. **Development Only:** Consider disabling in production
4. **Manual Triggers:** Allow developers to take snapshots on demand

---

## Real-World Memory Patterns

### Normal Application Usage
```
Time:    0s     5s     10s    15s    20s    25s    30s
Memory:  15MB → 20MB → 18MB → 22MB → 17MB → 19MB → 18MB
Pattern: ▲      ▼      ▲      ▼      ▲      ▼     Stable
```
 **Healthy:** Memory fluctuates with GC cycles

### Memory Leak Pattern
```
Time:    0s     5s     10s    15s    20s    25s    30s
Memory:  15MB → 22MB → 28MB → 35MB → 42MB → 48MB → 55MB
Pattern: ▲      ▲      ▲      ▲      ▲      ▲     Growing
```
 **Unhealthy:** Continuous growth without GC

### After Leak Fix
```
Time:    0s     5s     10s    15s    20s    25s    30s
Memory:  15MB → 20MB → 19MB → 21MB → 18MB → 20MB → 19MB
Pattern: ▲      ▼      ▲      ▼      ▲      ▼     Stable
```
**Fixed:** Back to normal fluctuation

---

## Screenshot Examples

### Where to Place Screenshots

Save screenshots in: `docs/screenshots/memory/`

1. **memory-snapshot-healthy.png**
   - Shows normal memory usage
   - Multiple snapshots with OK status
   - Memory fluctuating normally

2. **memory-snapshot-warning.png**
   - Shows memory leak warning
   - Delta exceeding threshold
   - Warning message displayed

3. **memory-snapshot-table.png**
   - Full table view of all snapshots
   - Desktop and mobile views
   - All columns visible

4. **memory-api-unavailable.png**
   - Browser without memory API support
   - Warning message shown

---

## Troubleshooting Guide

### Issue: "Memory API Not Available"

**Solution:**
1. Use Chrome or Edge browser
2. Enable precise memory info flag
3. Restart browser completely
4. Check browser console: `console.log(performance.memory)`

### Issue: Memory Always Increasing

**Diagnosis:**
1. Check for unsubscribed Observables
2. Verify event listeners are removed
3. Ensure timers are cleared
4. Review component lifecycle hooks

### Issue: Delta Shows Negative Values

**Explanation:**
- This is normal and good!
- Indicates garbage collection occurred
- Memory was freed up
- Application is healthy

---

## Conclusion

Memory monitoring provides valuable insights into:
-Application memory health
-Memory leak detection
-Cleanup verification
-Performance optimization opportunities

Regular monitoring helps maintain application performance and user experience.

**Key Takeaways:**
1. Monitor memory during development
2. Watch for consistently increasing patterns
3. Always implement proper cleanup
4. Test across multiple navigation cycles
5. Use Chrome DevTools for deeper analysis