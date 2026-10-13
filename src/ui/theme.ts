/**
 * Theme Controller - RoadSafetyScan (SPEC-16)
 * Gestor del Modo Claro / Modo Oscuro con persistencia en localStorage y detección de preferencias del sistema.
 */

export type AppTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'rss_theme';

export class ThemeController {
  private currentTheme: AppTheme = 'light';
  private toggleButtonId: string;

  constructor(toggleButtonId: string = 'btn-toggle-theme') {
    this.toggleButtonId = toggleButtonId;
  }

  public init(): AppTheme {
    this.currentTheme = this.resolveInitialTheme();
    this.applyTheme(this.currentTheme);
    this.bindEvents();
    return this.currentTheme;
  }

  public getTheme(): AppTheme {
    return this.currentTheme;
  }

  public toggle(): AppTheme {
    const nextTheme: AppTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    return this.currentTheme;
  }

  public applyTheme(theme: AppTheme): void {
    this.currentTheme = theme;

    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', theme);
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Ignorar restricciones de almacenamiento local en sandbox o iframes
      }
    }

    this.updateButtonUI();
  }

  private resolveInitialTheme(): AppTheme {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
        if (saved === 'dark' || saved === 'light') {
          return saved;
        }
      } catch {
        // Continuar a fallback
      }
    }

    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    return 'light';
  }

  private bindEvents(): void {
    if (typeof document !== 'undefined') {
      const btn = document.getElementById(this.toggleButtonId);
      if (btn) {
        btn.addEventListener('click', () => {
          this.toggle();
        });
      }
    }

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          // Solo aplicar automáticamente si el usuario no ha forzado manualmente en localStorage
          let saved: string | null = null;
          if (typeof localStorage !== 'undefined') {
            try {
              saved = localStorage.getItem(THEME_STORAGE_KEY);
            } catch {
              saved = null;
            }
          }
          if (!saved) {
            this.applyTheme(e.matches ? 'dark' : 'light');
          }
        });
      } catch {
        // En navegadores antiguos addEventListener en mediaQuery puede no estar disponible
      }
    }
  }

  private updateButtonUI(): void {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById(this.toggleButtonId);
    if (!btn) return;

    if (this.currentTheme === 'dark') {
      btn.innerHTML = '☀️ Claro';
      btn.setAttribute('title', 'Cambiar a Modo Claro');
    } else {
      btn.innerHTML = '🌙 Oscuro';
      btn.setAttribute('title', 'Cambiar a Modo Oscuro');
    }
  }
}
