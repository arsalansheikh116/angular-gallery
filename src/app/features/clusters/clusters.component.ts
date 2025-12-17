// src/app/features/clusters/clusters.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PhotoService, ClusterResult, Photo } from '../../shared/services/photo.service';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';

interface PhotoWithImage extends Photo {
  displayUrl: string;
}

interface ClusterWithImages extends ClusterResult {
  photos: PhotoWithImage[];
}

@Component({
  selector: 'app-clusters',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-4 text-gray-900">Cluster Analysis Results</h1>
      <p class="text-gray-600 mb-8">
        Photos clustered using custom multi-stage algorithm with complexity scoring
      </p>

      <!-- Loader -->
      <div *ngIf="loading$ | async" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div *ngFor="let i of [1,2,3,4]" class="bg-gray-200 animate-pulse rounded-lg h-64"></div>
      </div>

      <!-- Error -->
      <div *ngIf="error$ | async as error"
           class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        <p class="font-semibold">Error loading clusters:</p>
        <p class="text-sm">{{ error }}</p>
      </div>

      <!-- Clusters -->
      <div *ngIf="clusters$ | async as clusters" class="space-y-8">
        <div *ngFor="let cluster of clusters"
             class="bg-white rounded-lg shadow-lg overflow-hidden"
             [ngClass]="{
               'border-4 border-green-500': cluster.cluster === 'A',
               'border-4 border-blue-500': cluster.cluster === 'B',
               'border-4 border-yellow-500': cluster.cluster === 'C',
               'border-4 border-red-500': cluster.cluster === 'D'
             }">

          <!-- Header -->
          <div class="p-6 border-b"
               [ngClass]="{
                 'bg-green-50': cluster.cluster === 'A',
                 'bg-blue-50': cluster.cluster === 'B',
                 'bg-yellow-50': cluster.cluster === 'C',
                 'bg-red-50': cluster.cluster === 'D'
               }">

            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold">Cluster {{ cluster.cluster }}</h2>
                <p class="text-gray-600 mt-1">
                  {{ getClusterDescription(cluster.cluster) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">Photos</p>
                <p class="text-3xl font-bold">{{ cluster.photos.length }}</p>
              </div>
            </div>
          </div>

          <!-- Images -->
          <div class="p-6">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div *ngFor="let photo of cluster.photos.slice(0, 24)"
                   class="group cursor-pointer"
                   [routerLink]="['/details', photo.id]">

                <div class="relative overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow">
                  <img
                    [ngSrc]="photo.displayUrl"
                    [alt]="photo.title"
                    width="150"
                    height="150"
                    loading="lazy"
                    class="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-300"
                  />

                  <div class="absolute inset-0 bg-black/50 opacity-0
                              group-hover:opacity-100 transition-opacity
                              flex items-center justify-center">
                    <span class="text-white text-xs font-medium">
                      ID: {{ photo.id }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p *ngIf="cluster.photos.length > 24"
               class="text-center text-gray-500 mt-4 text-sm">
              Showing 24 of {{ cluster.photos.length }} photos
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClustersComponent implements OnInit {
  clusters$!: Observable<ClusterWithImages[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  imgArr = [
    'https://i.pinimg.com/236x/d3/fb/69/d3fb6973cddc1d875dc7c2e04525d2e7.jpg',
    'https://i.pinimg.com/736x/a5/68/e7/a568e70e3f218b022f18e42cb2805398.jpg',
    'https://i.pinimg.com/736x/fa/6b/43/fa6b4381301af3fde1ee9d0924a2f834.jpg',
    'https://i.pinimg.com/736x/ff/90/e2/ff90e20a730cb0a38ed46683bf97ee0f.jpg'
  ];

  constructor(private photoService: PhotoService) {}

  ngOnInit(): void {
    this.clusters$ = this.photoService.getPhotos().pipe(
      map(photos => photos.slice(0, 500)),
      map(photos => this.photoService.clusterPhotos(photos)),
      map(clusters =>
        clusters.map(cluster => ({
          ...cluster,
          photos: cluster.photos.map((photo, index) => ({
            ...photo,
            displayUrl: this.imgArr[index % this.imgArr.length]
          }))
        }))
      ),
      catchError(err => {
        console.error(err);
        return of([]);
      })
    );

    this.loading$ = this.clusters$.pipe(
      map(() => false),
      startWith(true)
    );

    this.error$ = of(null);
  }

  getClusterDescription(cluster: string): string {
    return {
      A: 'Highest complexity and weight - Premium content',
      B: 'High complexity - Quality content',
      C: 'Medium complexity - Standard content',
      D: 'Lower complexity - Basic content'
    }[cluster] || '';
  }
}
