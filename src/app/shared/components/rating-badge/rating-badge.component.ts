import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="badgeClasses">
      ⭐ {{ rating || 'N/A' }}
    </div>
  `,
  styles: []
})
export class RatingBadgeComponent {
  @Input() rating: number | string = 'N/A';
  @Input() position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right';

  get badgeClasses(): string {
    const baseClasses = 'bg-yellow-400 text-gray-900 px-2 py-1 rounded-md text-sm font-semibold';
    
    const positionClasses = {
      'top-left': 'absolute top-2 left-2',
      'top-right': 'absolute top-2 right-2',
      'bottom-left': 'absolute bottom-2 left-2',
      'bottom-right': 'absolute bottom-2 right-2'
    };

    return `${baseClasses} ${positionClasses[this.position]}`;
  }
}
