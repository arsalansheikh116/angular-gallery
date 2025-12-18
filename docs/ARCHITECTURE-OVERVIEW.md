# System Architecture Documentation

## Project Overview

**Project Name:** Angular SSR Photo Gallery  
**Framework:** Angular 21+ 
**Version:** 1.0

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Patterns](#architecture-patterns)
3. [Application Structure](#application-structure)
4. [Data Flow](#data-flow)
5. [Server-Side Rendering (SSR)](#server-side-rendering-ssr)
6. [Rate Limiting](#rate-limiting)
7. [Performance Optimizations](#performance-optimizations)
8. [Security Considerations](#security-considerations)

---

## Technology Stack

### Frontend
- **Angular 21.0.5** - Latest Angular with standalone components
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **RxJS 7.8** - Reactive programming with Observables
- **TypeScript 5.6** - Type-safe development

### Backend/SSR
- **Angular SSR (@angular/ssr)** - Server-side rendering
- **Express 4.21** - Node.js web server
- **Custom Rate Limiting** - IP-based request throttling

### Build & Deploy
- **Angular CLI 21.0.3** - Build and development tools
- **Vercel** - SSR-enabled hosting platform

---

## Architecture Patterns

### 1. Standalone Components Architecture

**Benefits:**
- Tree-shakeable by default
- Simpler imports and dependencies
- Better code splitting
- Modern Angular best practice
- Reduced bundle size

**Structure:**
```
src/app/
├── features/          # Feature modules
│   ├── image-grid/    # Home page with masonry grid
│   ├── details/       # Photo details page
│   ├── clusters/      # Clustering visualization
│   ├── performance/   # CPU benchmark
│   └── debug/         # Debug console
├── shared/
│   └── services/      # Shared services
│       └── photo.service.ts
├── app.component.ts   # Root component
├── app.config.ts      # App configuration
└── app.routes.ts      # Route definitions
```

---

### 2. Service Layer Pattern

**PhotoService Responsibilities:**
- HTTP communication with JSONPlaceholder API
- Retry logic with exponential backoff (max 4 retries)
- Error handling and graceful degradation
- Custom clustering algorithm implementation
- Observable-based data streams

**Benefits:**
- Separation of concerns
- Testable business logic
- Reusable across components
- Centralized data management

---

### 3. SSR Architecture Flow
```
┌─────────────────┐
│   User Browser  │
│     Request     │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│   Express Server    │
│   (Port 4000)       │
│   + Rate Limiting   │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐
│ AngularNodeAppEngine │
│    (Angular SSR)     │
└───────────┬──────────┘
            │
            ▼
┌───────────────────────┐
│   Render Components   │
│   (Server Context)    │
└────────────┬──────────┘
             │
             ▼
┌────────────────────────┐
│    HTML Response       │
│  + Hydration Data      │
└─────────────┬──────────┘
              │
              ▼
┌─────────────────────────┐
│   Browser Hydration     │
│   (Client Context)      │
└─────────────────────────┘
```

**SSR Benefits:**
1. **SEO:** Search engines see fully rendered content
2. **Performance:** Faster First Contentful Paint (FCP)
3. **UX:** Content visible before JavaScript executes
4. **Core Web Vitals:** Better LCP scores

---

## Application Structure

### Component Hierarchy
```
AppComponent (Root)
├── Router Outlet
    ├── ImageGridComponent (/)
    │   ├── Masonry Grid
    │   ├── Photo Cards
    │   └── Pagination
    ├── DetailsComponent (/details/:id)
    │   ├── Photo Details
    │   └── Metadata Display
    ├── ClustersComponent (/clusters)
    │   ├── Cluster Visualization
    │   ├── Algorithm Info
    │   └── Photo Grids (A, B, C, D)
    ├── PerformanceComponent (/performance)
    │   ├── Web Worker Manager
    │   ├── Benchmark UI
    │   └── Results Display
    └── DebugComponent (/debug)
        ├── Hydration Checker
        ├── Memory Monitor
        └── Log Display
```

---

## Data Flow

### Photo Gallery Flow
```
JSONPlaceholder API
         │
         ▼
   PhotoService
  (HttpClient + Retry Logic)
         │
         ▼
  Observable Stream
         │
         ├──> ImageGridComponent (Display Grid)
         ├──> DetailsComponent (Single Photo)
         └──> ClustersComponent (Grouped Photos)
```

### Clustering Flow
```
Fetch Photos (API)
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

---

## Server-Side Rendering (SSR)

### Implementation Details

**server.ts:**
```typescript
const angularApp = new AngularNodeAppEngine();

server.use('*', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        writeResponseToNodeResponse(response, res);
      } else {
        next();
      }
    })
    .catch(next);
});
```

**Key Features:**
1. All routes render server-side
2. Automatic hydration on client
3. No hydration mismatches
4. Platform checks for browser-only code

---

## Rate Limiting

### In-Memory Rate Limiter

**Configuration:**
- **Limit:** 10 requests per minute per IP
- **Window:** 60 seconds (rolling)
- **Response:** 429 (Too Many Requests)
- **Headers:** Retry-After, X-RateLimit-*

**Implementation:**
```typescript
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// On each request:
if (entry.count >= RATE_LIMIT) {
  return res.status(429).json({
    error: 'Too Many Requests',
    retryAfter: retryAfter
  });
}
```

**Trade-offs:**
- Simple, fast, no dependencies
- Perfect for single-instance deployment
- Resets on server restart
- Doesn't scale across multiple instances

**Production Alternative:** Use Redis for distributed rate limiting

---

## Performance Optimizations

### Core Web Vitals Strategies

#### 1. LCP (Largest Contentful Paint) < 2.3s
- SSR for instant content
- `<img ngSrc>` with automatic optimization
- Priority loading for above-fold images
- Lazy loading for below-fold images
- Optimized bundle size

#### 2. CLS (Cumulative Layout Shift) < 0.05
- Fixed image dimensions (width/height)
- Aspect ratio preservation
- Skeleton loaders during fetch
- No late-loading content above fold

#### 3. INP (Interaction to Next Paint) < 200ms
- Web Worker for heavy computations
- Change detection optimization
- Debouncing user interactions
- Efficient event handlers

#### 4. TBT (Total Blocking Time) < 200ms
- Code splitting with lazy loading
- Minimal JavaScript on initial load
- Async operations with Observables
- Web Worker offloading

---

## Security Considerations

### Implemented Security Measures

1. **Rate Limiting**
   - Prevents DoS attacks
   - IP-based throttling
   - Configurable limits

2. **XSS Prevention**
   - Angular's built-in sanitization
   - No innerHTML usage
   - Safe property binding

3. **CSRF Protection**
   - Same-origin policy
   - No state-changing GET requests

4. **HTTP Headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block

---

## Deployment Architecture

### Vercel Deployment Flow
```
Git Push (GitHub)
       │
       ▼
Vercel Build System
       │
       ├─ npm install
       ├─ ng build --configuration production
       └─ Package SSR server
       │
       ▼
Deploy to Edge Network
       │
       └─ Serverless Functions (SSR)
```

**Configuration:**
- `vercel.json` for routing
- Environment variables
- SSR function configuration
- Static asset optimization

---

## Conclusion

This architecture provides:
1. **Scalable** component structure
2. **Performant** SSR implementation
3. **Maintainable** code organization
4. **Observable** metrics and logging
5. **Optimized** for Core Web Vitals

The system is production-ready with clear paths for future enhancements.