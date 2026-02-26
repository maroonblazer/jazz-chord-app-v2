const STORAGE_KEY = 'jazz-chord-theme';
const DEFAULT_THEME = 'classic';

const THEME_FRETBOARD_COLORS = {
  'classic':      { stroke: '#000000', dot: '#000000' },
  'jazz-club':    { stroke: '#a89f91', dot: '#d4a843' },
  'vintage':      { stroke: '#5c4a32', dot: '#3b2f20' },
  'modern-bold':  { stroke: '#0a0a0a', dot: '#2563eb' },
  'warm-earthy':  { stroke: '#5c4a35', dot: '#4a7c59' },
};

export class ThemeManager {
  constructor() {
    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
  }

  loadTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  }

  saveTheme(themeName) {
    try {
      localStorage.setItem(STORAGE_KEY, themeName);
    } catch {
      // localStorage unavailable
    }
  }

  applyTheme(themeName) {
    this.currentTheme = themeName;

    if (themeName === 'classic') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = themeName;
    }

    this.saveTheme(themeName);
  }

  getFretboardColors() {
    return THEME_FRETBOARD_COLORS[this.currentTheme]
      || THEME_FRETBOARD_COLORS[DEFAULT_THEME];
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}
