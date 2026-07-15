import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.css'
})
export class ThemeToggleComponent {
  theme = signal<'light' | 'dark'>('light');

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tskmgr_theme') as 'light' | 'dark';
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = stored || (systemPrefersDark ? 'dark' : 'light');
      this.theme.set(initialTheme);
    }

    // Effect triggers update on DOM root element and writes to LocalStorage
    effect(() => {
      const activeTheme = this.theme();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', activeTheme);
        localStorage.setItem('tskmgr_theme', activeTheme);
      }
    });
  }

  toggleTheme(): void {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }
}
