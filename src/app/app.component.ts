import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <nav class="main-navbar">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="nav-links">
            <a routerLink="/" routerLinkActive="active-link" aria-current="page">Home</a>
            <a routerLink="/clusters" routerLinkActive="active-link">Clusters</a>
            <a routerLink="/performance" routerLinkActive="active-link">Performance</a>
            <a routerLink="/debug" routerLinkActive="active-link">Debug</a>
          </div>
        </div>
      </div>
    </nav>
    <div class="min-h-screen bg-gray-50">
      <router-outlet />
    </div>
  `,
  styles: [`
    .main-navbar {
      background: #fff;
      color: #000;
      padding: 0 24px;
      height: 56px;
      display: flex;
      align-items: center;
      border-bottom: 2px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-links {
      display: flex;
      gap: 32px;
    }
    .nav-links a {
      color: #000;
      text-decoration: none;
      font-weight: 500;
      padding: 8px 18px;
      border-radius: 6px;
      border-bottom: 2px solid transparent;
      transition: background 0.18s, color 0.18s, border 0.18s;
      font-size: 1rem;
      margin-right: 0;
      display: inline-block;
    }
    .nav-links a:last-child {
      margin-right: 0;
    }
    .nav-links a:hover {
      background: #f0f0f0;
      color: #222;
      border-bottom: 2px solid #bdbdbd;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04);
    }
    .nav-links a.active-link {
      border-bottom: 2px solid #222;
      color: #222;
      background: #eaeaea;
    }
  `]
})
export class AppComponent {}
