// src/app/shared/services/photo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retryWhen, mergeMap } from 'rxjs/operators';

export interface Photo {
  albumId: number;
  id: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

export interface ClusterResult {
  cluster: 'A' | 'B' | 'C' | 'D';
  photos: Photo[];
  complexityScore: number;
  weight: number;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private readonly API_URL =
    'https://jsonplaceholder.typicode.com/photos?_page=1&_limit=20';

  private readonly MAX_RETRIES = 4;
  private readonly INITIAL_DELAY = 1000;

  constructor(private http: HttpClient) {}

  // -----------------------------
  // API METHODS
  // -----------------------------
  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>(this.API_URL).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            if (retryAttempt > this.MAX_RETRIES) {
              return throwError(() => error);
            }

            if (error.status === 429) {
              const retryAfter = error.headers?.get('Retry-After');
              const delay = retryAfter
                ? parseInt(retryAfter, 10) * 1000
                : this.INITIAL_DELAY * Math.pow(2, retryAttempt - 1);

              return timer(delay);
            }

            return timer(this.INITIAL_DELAY * Math.pow(2, retryAttempt - 1));
          })
        )
      ),
      catchError(this.handleError)
    );
  }

  getPhotoById(id: number): Observable<Photo> {
    return this.http.get<Photo>(`${this.API_URL}/${id}`).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            if (index >= this.MAX_RETRIES) {
              return throwError(() => error);
            }
            return timer(this.INITIAL_DELAY * Math.pow(2, index));
          })
        )
      ),
      catchError(this.handleError)
    );
  }

  // -----------------------------
  // CLUSTERING LOGIC (RESTORED)
  // -----------------------------
  clusterPhotos(photos: Photo[]): ClusterResult[] {
    const scoredPhotos = photos.map(photo => ({
      ...photo,
      complexityScore: this.calculateComplexityScore(photo)
    }));

    const weightedPhotos = scoredPhotos.map(photo => ({
      ...photo,
      weight: this.calculateNonLinearWeight(
        photo.complexityScore,
        photo.albumId,
        photo.id
      )
    }));

    const maxWeight = Math.max(...weightedPhotos.map(p => p.weight));
    const minWeight = Math.min(...weightedPhotos.map(p => p.weight));

    const normalizedPhotos = weightedPhotos.map(photo => ({
      ...photo,
      normalizedWeight:
        (photo.weight - minWeight) / (maxWeight - minWeight || 1)
    }));

    const sorted = [...normalizedPhotos].sort(
      (a, b) => b.normalizedWeight - a.normalizedWeight
    );

    const quartileSize = Math.ceil(sorted.length / 4);

    return [
      {
        cluster: 'A',
        photos: sorted.slice(0, quartileSize),
        complexityScore: this.getAverageScore(sorted.slice(0, quartileSize)),
        weight: this.getAverageWeight(sorted.slice(0, quartileSize))
      },
      {
        cluster: 'B',
        photos: sorted.slice(quartileSize, quartileSize * 2),
        complexityScore: this.getAverageScore(
          sorted.slice(quartileSize, quartileSize * 2)
        ),
        weight: this.getAverageWeight(
          sorted.slice(quartileSize, quartileSize * 2)
        )
      },
      {
        cluster: 'C',
        photos: sorted.slice(quartileSize * 2, quartileSize * 3),
        complexityScore: this.getAverageScore(
          sorted.slice(quartileSize * 2, quartileSize * 3)
        ),
        weight: this.getAverageWeight(
          sorted.slice(quartileSize * 2, quartileSize * 3)
        )
      },
      {
        cluster: 'D',
        photos: sorted.slice(quartileSize * 3),
        complexityScore: this.getAverageScore(
          sorted.slice(quartileSize * 3)
        ),
        weight: this.getAverageWeight(
          sorted.slice(quartileSize * 3)
        )
      }
    ];
  }

  // -----------------------------
  // HELPERS
  // -----------------------------
  private calculateComplexityScore(photo: Photo): number {
    const titleLength = photo.title.length;
    const albumId = photo.albumId;
    const idModulo = photo.id % 13;
    const charVariance = this.calculateCharacterVariance(photo.title);

    return (
      titleLength * 2.5 +
      albumId * 1.8 +
      idModulo * 3.2 +
      charVariance * 4.1
    );
  }

  private calculateCharacterVariance(title: string): number {
    const chars = title.toLowerCase().split('');
    const uniqueChars = new Set(chars).size;
    const totalChars = chars.length;
    return (uniqueChars / (totalChars || 1)) * 100;
  }

  private calculateNonLinearWeight(
    score: number,
    albumId: number,
    id: number
  ): number {
    const logComponent = Math.log(score + 1);
    const sqrtComponent = Math.sqrt(albumId);
    const trigComponent = 1 + Math.sin(id / 100);

    return logComponent * sqrtComponent * trigComponent;
  }

  private getAverageScore(photos: any[]): number {
    if (!photos.length) return 0;
    return (
      photos.reduce((acc, p) => acc + (p.complexityScore || 0), 0) /
      photos.length
    );
  }

  private getAverageWeight(photos: any[]): number {
    if (!photos.length) return 0;
    return (
      photos.reduce((acc, p) => acc + (p.normalizedWeight || 0), 0) /
      photos.length
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error: ${error.status} - ${error.message}`;

      if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection.';
      }
    }

    console.error('PhotoService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
