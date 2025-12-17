import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <nav class="sticky top-0 z-50 bg-white border-b-2 border-gray-200">
      <div class="container mx-auto">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <button class="md:hidden mr-2 p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-400" (click)="toggleMenu()">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
          <div class="hidden md:flex gap-8">
            <a routerLink="/" [ngClass]="isActive('/') ? 'active-link' : ''"
              class="px-4 py-2 rounded-md font-medium text-black transition hover:bg-gray-100 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
              aria-current="page">Home</a>
            <a routerLink="/clusters" [ngClass]="isActive('/clusters') ? 'active-link' : ''"
              class="px-4 py-2 rounded-md font-medium text-black transition hover:bg-gray-100 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300">Clusters</a>
            <a routerLink="/performance" [ngClass]="isActive('/performance') ? 'active-link' : ''"
              class="px-4 py-2 rounded-md font-medium text-black transition hover:bg-gray-100 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300">Performance</a>
            <a routerLink="/debug" [ngClass]="isActive('/debug') ? 'active-link' : ''"
              class="px-4 py-2 rounded-md font-medium text-black transition hover:bg-gray-100 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300">Debug</a>
          </div>
        </div>
        <!-- Mobile menu -->
        <div *ngIf="menuOpen" class="md:hidden mt-2 flex flex-col gap-2">
          <a routerLink="/" (click)="closeMenu()" [ngClass]="isActive('/') ? 'active-link' : ''"
            class="px-4 py-2 rounded-md font-medium text-black transition hover:bg-gray-100 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            aria-current="page">Home</a>
          <a routerLink="/clusters" (click)="closeMenu()" [ngClass]="isActive('/clusters') ? 'active-link' : ''"
            class="px-4 py-2 rounded-md font-medium text-black transition hover:bg-gray-100 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300">Clusters</a>
          <a routerLink="/performance" (click)="closeMenu()" [ngClass]="isActive('/performance') ? 'active-link' : ''"
            class="px-4 py-2 rounded-md font-medium text-black transition hover:bg-gray-100 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300">Performance</a>
          <a routerLink="/debug" (click)="closeMenu()" [ngClass]="isActive('/debug') ? 'active-link' : ''"
            class="px-4 py-2 rounded-md font-medium text-black transition hover:bg-gray-100 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300">Debug</a>
        </div>
      </div>
    </nav>
    <main class="min-h-[calc(100vh-56px)] flex justify-center items-start bg-gray-50 pt-2 pb-4">
      <section class="w-full max-w-full bg-white rounded-lg shadow-md min-h-[400px] px-0 sm:px-2 md:px-4 lg:px-6 xl:px-8 2xl:px-10 py-6">
        <router-outlet></router-outlet>
      </section>
    </main>
  `,
  styles: [
    `.active-link {
      border-bottom: 2px solid #222 !important;
      color: #222 !important;
      background: #eaeaea;
    }`
  ]
})

export class AppComponent {
  menuOpen = false;
  constructor(private router: Router) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
  closeMenu() {
    this.menuOpen = false;
  }

  isActive(path: string): boolean {
    if (path === '/') {
      return this.router.url === '/';
    }
    return this.router.url.startsWith(path);
  }
}
