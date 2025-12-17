import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <nav class="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex gap-4">
            <a routerLink="/" routerLinkActive="bg-white/20" 
               class="text-white px-4 py-2 rounded-md hover:bg-white/10 transition-colors font-medium" aria-current="page">
              Home
            </a>
            <a routerLink="/clusters" routerLinkActive="bg-white/20"
               class="text-white px-4 py-2 rounded-md hover:bg-white/10 transition-colors font-medium">
              Clusters
            </a>
            <a routerLink="/performance" routerLinkActive="bg-white/20"
               class="text-white px-4 py-2 rounded-md hover:bg-white/10 transition-colors font-medium">
              Performance
            </a>
            <a routerLink="/debug" routerLinkActive="bg-white/20"
               class="text-white px-4 py-2 rounded-md hover:bg-white/10 transition-colors font-medium">
              Debug
            </a>
          </div>
        </div>
      </div>
    </nav>
    <div class="min-h-screen bg-gray-50">
      <router-outlet />
    </div>
  `,
  styles: []
})
export class AppComponent {}
