/**
 * Runs before paint to avoid theme flash. Default: stored → system → dark.
 * Marketing `/` is always dark + mu-active so the Earth canvas never washes
 * under the product light-theme surface glow.
 */
export const themeInitScript = `(function(){try{var p=location.pathname;if(p==='/'||p===''){document.documentElement.classList.add('elsewhere-mu-active');document.documentElement.setAttribute('data-theme','dark');return;}var k='elsewhere-theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
