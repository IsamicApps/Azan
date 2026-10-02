/**
 * Registers the offline service worker (production only). Both apps share the
 * single worker at the site root, so the TV app passes '../sw.js'.
 */
export function registerServiceWorker(swUrl: string, scope?: string): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl, scope ? { scope } : undefined).catch((err) => {
      console.log('ServiceWorker registration skipped:', err);
    });
  });
}
