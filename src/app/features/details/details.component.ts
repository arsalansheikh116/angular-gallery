// src/app/features/details/details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PhotoService, Photo } from '../../shared/services/photo.service';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  template: `
    <div class="container mx-auto px-4 py-8">
      <button 
        routerLink="/"
        class="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Back to Gallery
      </button>

      <div *ngIf="loading" class="max-w-4xl mx-auto">
        <div class="bg-gray-200 animate-pulse rounded-lg h-96 mb-6"></div>
        <div class="bg-gray-200 animate-pulse rounded h-8 w-3/4 mb-4"></div>
        <div class="bg-gray-200 animate-pulse rounded h-4 w-1/2"></div>
      </div>

      <div *ngIf="error$ | async as error" 
           class="max-w-4xl mx-auto bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        <p class="font-semibold">Error loading photo details:</p>
        <p class="text-sm">{{ error }}</p>
      </div>

      <div *ngIf="photo$ | async as photo" class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-8 flex flex-col items-center">
          <img 
            [ngSrc]="imgUrlParam || photo.url"
            [alt]="photo.title"
            [width]="400"
            [height]="320"
            priority
            class="w-full max-w-md h-[320px] object-cover"
          />
          <div class="mt-2 text-gray-700 text-base font-semibold">Image ID: {{ imageId }}</div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ photo.title }}</h1>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-center">
                <span class="text-gray-600 font-medium w-24">Photo ID:</span>
                <span class="text-gray-900">{{ photo.id }}</span>
              </div>
              <div class="flex items-center">
                <span class="text-gray-600 font-medium w-24">Album ID:</span>
                <span class="text-gray-900">{{ photo.albumId }}</span>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex flex-col">
                <span class="text-gray-600 font-medium mb-2">Original URL:</span>
                <a [href]="imgUrlParam || photo.url" 
                   target="_blank" 
                   class="text-blue-600 hover:text-blue-800 text-sm break-all">
                  {{ imgUrlParam || photo.url }}
                </a>
              </div>
            </div>
          </div>

          <div class="mt-8 pt-6 border-t border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Metadata</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="text-gray-600 text-sm">Title Length</p>
                <p class="text-2xl font-bold text-gray-900">{{ photo.title.length }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="text-gray-600 text-sm">Words</p>
                <p class="text-2xl font-bold text-gray-900">{{ countWords(photo.title) }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="text-gray-600 text-sm">Album</p>
                <p class="text-2xl font-bold text-gray-900">{{ photo.albumId }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="text-gray-600 text-sm">ID</p>
                <p class="text-2xl font-bold text-gray-900">{{ photo.id }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DetailsComponent implements OnInit {
  photo$!: Observable<Photo>;
  error$!: Observable<string | null>;
  loading = true;
  imgUrlParam: string | null = null;
  imageId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private photoService: PhotoService
  ) {}

  ngOnInit(): void {
    this.imgUrlParam = this.route.snapshot.queryParamMap.get('imgurl');
    this.imageId = this.route.snapshot.paramMap.get('id');
    this.photo$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id || isNaN(+id)) {
          throw new Error('Invalid photo ID');
        }
        return this.photoService.getPhotoById(+id);
      }),
      catchError(error => {
        console.error('Error loading photo:', error);
        this.loading = false;
        return of({} as Photo);
      })
    );

    this.photo$.subscribe({
      next: () => this.loading = false,
      error: () => this.loading = false
    });

    this.error$ = new Observable(observer => {
      this.photo$.subscribe({
        error: (err) => observer.next(err.message || 'Failed to load photo details'),
        complete: () => observer.next(null)
      });
      observer.next(null);
    });
  }

  countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}