# Hydration Consistency Examples

## Overview

This document explains the hydration consistency checker, provides examples of matches and mismatches, and demonstrates how to debug SSR hydration issues.

---

## Table of Contents

1. [What is Hydration?](#what-is-hydration)
2. [Hydration Checker Implementation](#hydration-checker-implementation)
3. [Example: Successful Hydration](#example-successful-hydration)
4. [Example: Hydration Mismatch](#example-hydration-mismatch)
5. [Common Causes of Mismatches](#common-causes-of-mismatches)
6. [Debugging Guide](#debugging-guide)
7. [Best Practices](#best-practices)

---

## What is Hydration?

### Definition

**Hydration** is the process where Angular attaches event listeners and makes the server-rendered HTML interactive on the client side.

### SSR + Hydration Flow
```
1. Server Renders HTML
   ├─ Components execute
   ├─ Generate static HTML
   └─ Send to browser

2. Browser Receives HTML
   ├─ Display content immediately
   ├─ Download JavaScript
   └─ Wait for Angular to load

3. Angular Hydrates
   ├─ Compare server HTML with expected client HTML
   ├─ Attach event listeners
   ├─ Make interactive
   └─ Complete hydration
```

### Why Hydration Matters

**Fast FCP (First Contentful Paint):** Users see content immediately  
**SEO Benefits:** Search engines index full content  
**Better UX:** No content flash/flicker  
 **Must Match:** Server and client must render identically

---

## Hydration Checker Implementation

### How It Works
```typescript
interface HydrationLog {
  timestamp: Date;
  serverChecksum: string;   // Hash of server-rendered content
  clientChecksum: string;   // Hash of client-rendered content
  match: boolean;           // Do they match?
  element: string;          // Element checked (e.g., 'body')
}
```

### Checksum Algorithm
```typescript
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
```

**Algorithm:** Simple hash function (FNV-1a inspired)
- Fast computation
- Good distribution
- Deterministic results

---

## Example: Successful Hydration

### Scenario: Static Content Page
```typescript
@Component({
  template: `
    <div class="container">
      <h1>Photo Gallery</h1>
      <p>Welcome to our gallery</p>
    </div>
  `
})
export class SimpleComponent {}
```

### Server Renders:
```html
<div class="container">
  <h1>Photo Gallery</h1>
  <p>Welcome to our gallery</p>
</div>
```

### Client Expects:
```html
<div class="container">
  <h1>Photo Gallery</h1>
  <p>Welcome to our gallery</p>
</div>
```

### Hydration Log Result:
```
Hydration Log #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status:           MATCH
Timestamp:        Dec 18, 2025 3:45:23 PM
Element:          body
Server Checksum:  a3f2b8c1
Client Checksum:  a3f2b8c1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hydration successful
Server and client rendered identical content.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Result:** Perfect match, no issues!

---

## Example: Hydration Mismatch

### Scenario: Using Browser-Only API Without Platform Check
```typescript
@Component({
  template: `
    <div class="container">
      <h1>Current Time</h1>
      <p>{{ currentTime }}</p>
    </div>
  `
})
export class TimeComponent {
  // BAD: Direct Date() without platform check
  currentTime = new Date().toLocaleTimeString();
}
```

### Server Renders (at 3:45:23 PM):
```html
<div class="container">
  <h1>Current Time</h1>
  <p>3:45:23 PM</p>
</div>
```

### Client Expects (at 3:45:25 PM):
```html
<div class="container">
  <h1>Current Time</h1>
  <p>3:45:25 PM</p>
</div>
```

### Hydration Log Result:
```
Hydration Log #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status:           MISMATCH
Timestamp:        Dec 18, 2025 3:45:25 PM
Element:          body
Server Checksum:  8c4f2a91
Client Checksum:  7b3e1d82
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hydration mismatch detected!
Server and client rendered different content.

Possible causes:
- Browser-only APIs used without platform checks
- Random number generation
- Date/time without synchronization
- localStorage/sessionStorage access
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Result:** Mismatch detected!

---

## Common Causes of Mismatches

### 1. Browser-Only APIs

**Bad:**
```typescript
export class BadComponent {
  userAgent = navigator.userAgent; // Crashes on server
  width = window.innerWidth;       // Crashes on server
}
```

 **Good:**
```typescript
export class GoodComponent {
  userAgent = 'N/A';
  width = 0;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    if (isPlatformBrowser(platformId)) {
      this.userAgent = navigator.userAgent;
      this.width = window.innerWidth;
    }
  }
}
```

---

### 2. Random Number Generation

**Bad:**
```typescript
export class BadComponent {
  randomId = Math.random(); // Different each render
}
```

 **Good:**
```typescript
export class GoodComponent {
  randomId = 0;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.randomId = Math.random();
    }
  }
}
```

---

### 3. Date/Time Without Synchronization

**Bad:**
```typescript
export class BadComponent {
  currentTime = new Date().toISOString(); // Different server vs client
}
```

**Good:**
```typescript
export class GoodComponent {
  currentTime = '';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.currentTime = new Date().toISOString();
    }
  }
}
```

---

### 4. LocalStorage/SessionStorage

**Bad:**
```typescript
export class BadComponent {
  username = localStorage.getItem('username'); // Not available on server
}
```

**Good:**
```typescript
export class GoodComponent {
  username = '';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.username = localStorage.getItem('username') || '';
    }
  }
}
```

---

### 5. Third-Party Libraries

**Bad:**
```typescript
import Chart from 'chart.js'; // Assumes DOM exists

export class BadComponent {
  chart = new Chart(ctx, config); // Crashes on server
}
```

**Good:**
```typescript
import Chart from 'chart.js';

export class GoodComponent {
  chart?: Chart;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const ctx = document.getElementById('myChart');
      this.chart = new Chart(ctx, config);
    }
  }
}
```

---

## Debugging Guide

### Step 1: Check Console

Browser console will show Angular hydration errors:
```
NG0500: During hydration Angular expected <div> but found <span>.
```

### Step 2: Use Hydration Checker

Navigate to `/debug` page and click "Test Hydration"

### Step 3: Compare Checksums

If mismatch:
1. Note the checksums
2. Check recent code changes
3. Look for platform-specific code

### Step 4: Review Component Lifecycle

Ensure browser-only code is in:
- `ngOnInit()` with platform check
- `ngAfterViewInit()`
- Event handlers (never in constructor or template expressions)

### Step 5: Test SSR Build
```bash
npm run build
npm run serve:ssr

# Visit http://localhost:4000
# Check for hydration warnings in console
```

---

## Best Practices

### 1. Always Use Platform Checks
```typescript
constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    // Browser-only code here
  }
}
```

### 2. Defer Browser-Specific Initialization
```typescript
// Constructor: Runs on both server and client
constructor() {
  this.initChart(); // May cause issues
}

// ngAfterViewInit: Runs only after view is ready
ngAfterViewInit() {
  if (isPlatformBrowser(this.platformId)) {
    this.initChart();
  }
}
```

### 3. Use TransferState for Shared Data
```typescript
// Server
constructor(private transferState: TransferState) {
  const data = this.fetchData();
  this.transferState.set(DATA_KEY, data);
}

// Client
constructor(private transferState: TransferState) {
  const data = this.transferState.get(DATA_KEY, null);
  if (data) {
    this.data = data;
  }
}
```

### 4. Test Both Environments
```bash
# Test client-side rendering
npm start

# Test server-side rendering
npm run build
npm run serve:ssr
```

---

## Visual Examples

### Screenshot Locations

Save screenshots in: `docs/screenshots/hydration/`

1. **hydration-match.png**
   - Green status indicator
   - Matching checksums
   - "MATCH" badge
   - Success message

2. **hydration-mismatch.png**
   - Red status indicator
   - Different checksums
   - "MISMATCH" badge
   - Warning message with possible causes

3. **hydration-console-error.png**
   - Browser DevTools console
   - Angular hydration error (NG0500)
   - Stack trace

4. **hydration-test-button.png**
   - Debug page interface
   - "Test Hydration" button
   - Log display area

---

## Real-World Mismatch Examples

### Example 1: Window Dimensions

**Problem:**
```typescript
template: `<div>Width: {{ windowWidth }}px</div>`

windowWidth = window.innerWidth; // Server crash!
```

**Solution:**
```typescript
windowWidth = 0;

ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    this.windowWidth = window.innerWidth;
  }
}
```

---

### Example 2: Conditional Rendering Based on User Agent

**Problem:**
```typescript
template: `
  <div *ngIf="isMobile">Mobile View</div>
  <div *ngIf="!isMobile">Desktop View</div>
`

isMobile = /mobile/i.test(navigator.userAgent); // Different server vs client
```

**Solution:**
```typescript
isMobile = false;

ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    this.isMobile = /mobile/i.test(navigator.userAgent);
  }
}
```

---

### Example 3: Canvas Rendering

**Problem:**
```typescript
ngOnInit() {
  const canvas = document.getElementById('canvas'); // No document on server
  const ctx = canvas.getContext('2d');
  ctx.fillRect(0, 0, 100, 100);
}
```

**Solution:**
```typescript
ngAfterViewInit() {
  if (isPlatformBrowser(this.platformId)) {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillRect(0, 0, 100, 100);
    }
  }
}
```

---

## Conclusion

Hydration consistency is critical for:
- Optimal performance
- No content flashing
- Better user experience
- SEO benefits

**Key Takeaways:**
1. Always use platform checks for browser-only code
2. Test SSR builds regularly
3. Use the hydration checker for debugging
4. Follow Angular SSR best practices
5. Monitor for hydration warnings in console

**Zero hydration mismatches = Production-ready SSR!** 