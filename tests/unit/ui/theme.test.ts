import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeController, THEME_STORAGE_KEY } from '../../../src/ui/theme.js';

describe('ThemeController (SPEC-16)', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      })
    };

    vi.stubGlobal('localStorage', storageMock);
  });

  it('debe inicializar con tema claro por defecto si no hay storage ni preferencia oscura', () => {
    const controller = new ThemeController();
    const theme = controller.init();
    expect(theme).toBe('light');
    expect(controller.getTheme()).toBe('light');
  });

  it('debe leer el tema guardado en localStorage', () => {
    mockStorage[THEME_STORAGE_KEY] = 'dark';
    const controller = new ThemeController();
    const theme = controller.init();
    expect(theme).toBe('dark');
    expect(controller.getTheme()).toBe('dark');
  });

  it('debe alternar entre dark y light y persistir en localStorage', () => {
    const controller = new ThemeController();
    controller.init();
    expect(controller.getTheme()).toBe('light');

    const next = controller.toggle();
    expect(next).toBe('dark');
    expect(controller.getTheme()).toBe('dark');
    expect(mockStorage[THEME_STORAGE_KEY]).toBe('dark');

    const back = controller.toggle();
    expect(back).toBe('light');
    expect(controller.getTheme()).toBe('light');
    expect(mockStorage[THEME_STORAGE_KEY]).toBe('light');
  });

  it('debe aplicar el atributo data-theme en document.documentElement si está presente', () => {
    const dummyElement = {
      setAttribute: vi.fn()
    };
    const dummyDoc = {
      documentElement: dummyElement,
      getElementById: vi.fn(() => null)
    };
    vi.stubGlobal('document', dummyDoc);

    const controller = new ThemeController();
    controller.applyTheme('dark');

    expect(dummyElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
  });
});
