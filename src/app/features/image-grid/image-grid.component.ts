// src/app/features/image-grid/image-grid.component.ts
import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PhotoService, Photo } from '../../shared/services/photo.service';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';

interface PhotoWithImage extends Photo {
  displayUrl: string;
}

@Component({
  selector: 'app-image-grid',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-8 text-gray-900">Photo Gallery</h1>

      <!-- Error -->
      <div *ngIf="error$ | async as error"
           class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
        <p class="font-semibold">Error loading photos:</p>
        <p class="text-sm">{{ error }}</p>
      </div>

      <!-- Skeleton Loader -->
      <div *ngIf="loading$ | async"
           class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div *ngFor="let item of skeletons"
             class="bg-gray-200 rounded-lg animate-pulse"
             [style.height.px]="item.height">
        </div>
      </div>

      <!-- Masonry Grid -->
      <div *ngIf="photos$ | async as photos"
           class="masonry-grid mb-8">
        <div *ngFor="let photo of getPaginatedPhotos(photos); trackBy: trackByPhotoId"
             class="masonry-item group cursor-pointer"
             [routerLink]="['/details', photo.id]"
             [queryParams]="{ imgurl: photo.displayUrl }">

          <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <img
              [ngSrc]="photo.displayUrl"
              [alt]="photo.title"
              width="150"
              height="150"
              loading="lazy"
              class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
            />

            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div class="absolute bottom-0 left-0 right-0 p-4">
                <p class="text-white text-sm font-medium line-clamp-2">
                  {{ photo.title }}
                </p>
                <p class="text-white/80 text-xs mt-1">
                  Album {{ photo.albumId }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="(photos$ | async) as photos" class="flex justify-center items-center gap-2 mt-8">
        <button
          (click)="previousPage()"
          [disabled]="currentPage === 1"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed">
          Previous
        </button>

        <span class="px-4 py-2 text-gray-700">
          Page {{ currentPage }} of {{ getTotalPages(photos) }}
        </span>

        <button
          (click)="nextPage(photos)"
          [disabled]="currentPage >= getTotalPages(photos)"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed">
          Next
        </button>
      </div>

      <!-- Empty State -->
      <div *ngIf="(photos$ | async)?.length === 0 && !(loading$ | async)"
           class="text-center py-12 text-gray-500">
        <p class="text-lg">No photos available</p>
      </div>
    </div>
  `,
  styles: [`
    .masonry-grid {
      column-count: 1;
      column-gap: 1rem;
    }

    @media (min-width: 640px) {
      .masonry-grid { column-count: 2; }
    }

    @media (min-width: 768px) {
      .masonry-grid { column-count: 3; }
    }

    @media (min-width: 1024px) {
      .masonry-grid { column-count: 4; }
    }

    .masonry-item {
      break-inside: avoid;
      margin-bottom: 1rem;
      display: inline-block;
      width: 100%;
    }
  `]
})
export class ImageGridComponent implements OnInit {
  photos$!: Observable<PhotoWithImage[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  currentPage = 1;
  pageSize = 12;

  skeletons = Array.from({ length: 12 }, () => ({
    height: 200 + Math.random() * 150
  }));

  imgArr = [
    'https://i.pinimg.com/236x/d3/fb/69/d3fb6973cddc1d875dc7c2e04525d2e7.jpg',
    'https://i.pinimg.com/736x/a5/68/e7/a568e70e3f218b022f18e42cb2805398.jpg',
    'https://i.pinimg.com/736x/fa/6b/43/fa6b4381301af3fde1ee9d0924a2f834.jpg',
    'https://i.pinimg.com/736x/ff/90/e2/ff90e20a730cb0a38ed46683bf97ee0f.jpg'
  ];

  private isBrowser: boolean;

  constructor(
    private photoService: PhotoService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.photos$ = this.photoService.getPhotos().pipe(
      map((photos) =>
        photos.map((photo, index) => ({
          ...photo,
          displayUrl: this.imgArr[index % this.imgArr.length]
        }))
      ),
      catchError(() => of([]))
    );

    this.loading$ = this.photos$.pipe(
      map(() => false),
      startWith(true)
    );

    this.error$ = of(null);
  }

  getPaginatedPhotos(photos: PhotoWithImage[]): PhotoWithImage[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return photos.slice(startIndex, endIndex);
  }

  getTotalPages(photos: PhotoWithImage[]): number {
    return Math.ceil(photos.length / this.pageSize);
  }

  nextPage(photos: PhotoWithImage[]): void {
    if (this.currentPage < this.getTotalPages(photos)) {
      this.currentPage++;
      this.scrollToTop();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  trackByPhotoId(_: number, photo: Photo): number {
    return photo.id;
  }
}