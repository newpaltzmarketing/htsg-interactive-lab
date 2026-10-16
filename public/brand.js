// Canvas reads the same CSS tokens as the page. No network configuration required.
const token = (name, fallback) => typeof document === 'undefined'
  ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
export const brand = Object.freeze({
  name: 'Holistic Tech Solutions Group',
  labName: 'Interactive Lab',
  contactUrl: 'https://holistictechsolutionsgroup.com/contact/',
  canvas: Object.freeze({
    background: token('--arena-background', '#111111'),
    grid: token('--arena-grid', '#303030'),
    player: token('--arena-player', '#f78c1a'),
    projectile: token('--arena-projectile', '#ffffff'),
    obstacle: token('--arena-obstacle', '#f43618'),
    text: token('--arena-text', '#ffffff'),
    overlay: token('--arena-overlay', '#111111ed'),
  }),
});
