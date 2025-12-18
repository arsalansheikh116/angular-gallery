# System Architecture Documentation

## Project Overview

Angular 18+ application with Server-Side Rendering (SSR), implementing photo gallery with custom clustering algorithm, performance monitoring, and Core Web Vitals optimization.

## Technology Stack

### Frontend
- **Angular 21.0**: Latest Angular with standalone components
- **Tailwind CSS 4.1**: Utility-first CSS framework
- **RxJS 7.8**: Reactive programming with Observables
- **TypeScript 5.9**: Type-safe development

### Backend/SSR
- **Angular SSR (@angular/ssr)**: Server-side rendering
- **Express 5.1**: Node.js web server
- **Custom Rate Limiting**: IP-based request throttling

### Build & Deploy
- **Angular CLI**: Build and development tools
- **Vercel/Netlify**: SSR-enabled hosting platforms

## Architecture Patterns

### 1. Standalone Components Architecture

**Why Standalone?**
- Tree-shakeable by default
- Simpler imports and dependencies
- Better code splitting
- Modern Angular best practice

**Structure:**
```
src/app/
├── features/
│   ├── home/           # Photo grid
│   ├── details/        # Photo details
│   ├── clusters/       # Clustering visualization
│   ├── performance/    # CPU benchmark
│   └── debug/          # Hydration & memory logs
├── services/
│   └── photo.service.ts
├── directives/
│   └── hydration-checker.directive.ts
└── app.component.ts
```

### 2. Service Layer Pattern

**PhotoService** provides:
- HTTP communication with API
- Retry logic with exponential backoff
- Error handling and graceful degradation
- Custom clustering algorithm
- Observable-based data streams

**Benefits:**
- Separation of concerns
- Testable business logic
- Reusable across components
- Centralized data management

### 3. SSR (Server-Side Rendering) Architecture

```
┌─────────────┐
│   Browser   │
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Express Server │
│  (Port 4000)    │
│  + Rate Limit   │
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│  Angular Universal │
│  Common Engine     │
└─────────┬──────────┘
          │
          ▼
┌─────────────────────┐
│  Render Components  │
│  (Server Context)   │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐
│   HTML Response      │
│   + State Transfer   │
└───────────┬──────────┘
            │
            ▼
┌───────────────────────┐
│   Browser Hydration   │
│   (Client Context)    │
└───────────────────────┘
```

**SSR Benefits:**
1. **SEO**: Search engines see fully rendered content
2. **Performance**: Faster First Contentful Paint (FCP)
3. **UX**: Content visible before JavaScript executes
4. **Core Web Vitals**: Better LCP scores

### 4. Rate Limiting Implementation

**In-Memory Rate Limiter:**
```typescript
Map<IP, {count, resetTime}>
```

**Characteristics:**
- 10 requests per minute per IP
- Returns 429 with Retry-After header
- Automatic cleanup of expired entries
- Zero external dependencies

**Trade-offs:**
- ✅ Simple, fast, no database needed
- ✅ Works perfectly for single-instance deployments
- ❌ Doesn't scale across multiple server instances
- ❌ Resets on server restart

**For Production at Scale:**
- Use Redis for distributed rate limiting
- Implement sliding window counter
- Add API key authentication

### 5. Hydration Consistency Pattern

**Directive-Based Checking:**
```typescript
[appHydrationChecker] → Compares server/client checksums
```

**Flow:**
1. **Server**: Generate checksum from rendered content
2. **Server**: Attach checksum as data attribute
3. **Client**: Calculate checksum after hydration
4. **Client**: Compare and log mismatches

**Why Custom Directive?**
- Angular's built-in hydration is automatic
- Custom directive adds verification layer
- Helps debug hydration issues
- Visual feedback for mismatches

### 6. Memory Monitoring Pattern

**Route-Change Snapshots:**
```typescript
Router Events → Take Snapshot → Compare Delta → Warn if > Threshold
```

**Metrics Tracked:**
- `usedJSHeapSize`: Current memory usage
- `totalJSHeapSize`: Total allocated heap
- `jsHeapSizeLimit`: Maximum available memory
- `delta`: Change since last snapshot

**Threshold: 10 MB**
- Exceeding threshold indicates potential memory leak
- Logged with route information
- Historical tracking for analysis

### 7. Web Worker Pattern for CPU Tasks

**Why Web Worker?**
- Prevents UI blocking during heavy computation
- True multi-threading in browser
- Better user experience
- Accurate performance measurement

**Implementation:**
```typescript
Main Thread ──message──> Web Worker
                          │
                          ├─ Compute primes
                          │  (Sieve of Eratosthenes)
                          │
Main Thread <──result──── ┘
```

**Prime Computation: Sieve of Eratosthenes**
- Time: O(n log log n)
- Space: O(n)
- Efficient for range up to 350,000

## Data Flow Architecture

### Photo Gallery Flow
```
JSONPlaceholder API
        │
        ▼
  PhotoService
  (HttpClient + Retry)
        │
        ▼
   Observable Stream
        │
        ├──> Home Component (Grid)
        ├──> Details Component (Single)
        └──> Clusters Component (Grouped)
```

### Clustering Flow
```
Fetch Photos
     │
     ▼
Stage 1: Calculate Complexity Score
     │
     ▼
Stage 2: Apply Non-Linear Weighting
     │
     ▼
Stage 3: Sort & Divide into Quartiles
     │
     ▼
Return 4 Clusters (A, B, C, D)
```

## Core Web Vitals Optimization Strategies

### 1. Largest Contentful Paint (LCP) < 2.3s

**Optimizations:**
- ✅ SSR for instant content
- ✅ `<img ngSrc>` with automatic optimization
- ✅ Priority loading for above-fold images
- ✅ Lazy loading for below-fold images
- ✅ Optimized bundle size with standalone components

### 2. Cumulative Layout Shift (CLS) < 0.05

**Optimizations:**
- ✅ Fixed image dimensions (width/height attributes)
- ✅ Aspect ratio preservation
- ✅ No late-loading content above fold
- ✅ Skeleton loaders during data fetch

### 3. Interaction to Next Paint (INP) < 200ms

**Optimizations:**
- ✅ Web Worker for heavy computations
- ✅ Change detection optimization
- ✅ OnPush strategy where applicable
- ✅ Debouncing user interactions

### 4. Total Blocking Time (TBT) < 200ms

**Optimizations:**
- ✅ Code splitting with lazy loading
- ✅ Minimal JavaScript execution on load
- ✅ Async operations with Observables
- ✅ Web Worker offloading

## Component Architecture Details

### Home Component (Photo Grid)

**Responsibilities:**
- Fetch and display photos
- Masonry grid layout
- Error handling
- Loading states

**Optimizations:**
- Limit to 20 record per page for performance
- Virtual scrolling (future enhancement)
- TrackBy function for efficient re-rendering
- Lazy image loading

### Details Component

**Responsibilities:**
- Display single photo details
- Route parameter handling
- Metadata calculation

**Features:**
- Priority image loading (above fold)
- Back navigation
- Rich metadata display

### Clusters Component

**Responsibilities:**
- Display clustering results
- Visualize algorithm output
- Show distribution statistics

**Features:**
- Color-coded clusters
- Collapsible sections (future)
- Limited preview (24 photos per cluster)

### Performance Component

**Responsibilities:**
- Run CPU benchmarks
- Display execution times
- Calculate CPU utilization

**Features:**
- Web Worker implementation
- Historical results tracking
- Statistical analysis

### Debug Component

**Responsibilities:**
- Monitor hydration consistency
- Track memory usage
- Log diagnostic information

**Features:**
- Real-time memory snapshots
- Hydration mismatch detection
- Visual warnings

## Error Handling Strategy

### 1. HTTP Errors
```typescript
catchError(error => {
  // Log error
  console.error('Error:', error);
  
  // Return fallback
  return of(fallbackValue);
})
```

### 2. Rate Limiting (429)
- Exponential backoff retry
- User-friendly error messages
- Retry-After header respect

### 3. Network Errors
- Graceful degradation
- Offline indicators
- Retry mechanisms

### 4. Hydration Mismatches
- Visual indicators (red outline)
- Console warnings
- Development-time debugging

## Security Considerations

### 1. Rate Limiting
- Prevents DoS attacks
- IP-based throttling
- Configurable limits

### 2. XSS Prevention
- Angular's built-in sanitization
- No innerHTML usage
- Safe property binding

### 3. CSRF Protection
- Same-origin policy
- No state-changing GET requests

### 4. Content Security Policy
- Implement CSP headers
- Restrict script sources
- Future enhancement

## Performance Monitoring

### Metrics Collected:
1. **LCP**: Image load times
2. **CLS**: Layout stability
3. **INP**: Interaction responsiveness
4. **TBT**: Main thread blocking
5. **Memory**: Heap usage across routes
6. **CPU**: Benchmark execution times

### Tools:
- Lighthouse CI
- Chrome DevTools
- Performance Observer API
- Custom memory logger

## Scalability Considerations

### Current Limitations (500 photos):
- In-memory processing
- Client-side filtering
- No pagination

### Future Enhancements:
- Server-side pagination
- Virtual scrolling
- CDN for images
- Service Worker caching
- Progressive Web App (PWA)

## Deployment Architecture

### Vercel Deployment
```
Git Push
   │
   ▼
Vercel Build
   │
   ├─ npm install
   ├─ ng build
   └─ Build SSR server
   │
   ▼
Deploy to Edge Network
   │
   └─ Serverless Functions (SSR)
```

### Key Configuration:
- `vercel.json` for routing
- Environment variables
- SSR function configuration
- Static asset optimization

## Testing Strategy

### Unit Tests:
- Service logic
- Component behavior
- Directive functionality

### E2E Tests:
- User flows
- SSR rendering
- Route navigation

### Performance Tests:
- Lighthouse CI
- Load time benchmarks
- Memory leak detection

## Conclusion

This architecture provides:
1. ✅ **Scalable** component structure
2. ✅ **Performant** SSR implementation
3. ✅ **Maintainable** code organization
4. ✅ **Observable** metrics and logging
5. ✅ **Optimized** for Core Web Vitals

The system is production-ready with clear paths for future enhancements.