/**
 * Runs before paint to avoid theme flash. Default: stored → system → dark.
 */
export const themeInitScript = `(function(){try{var k='elsewhere-theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
