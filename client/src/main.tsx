import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupAnalytics } from "./utils/analytics";

// Initialize analytics
setupAnalytics();

// Register enhanced service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker-enhanced.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker available - reload to update');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });

  // Listen for service worker updates
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// Prompt for app installation
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] App can be installed');
  
  // Dispatch custom event that UI can listen to
  const event = new CustomEvent('pwa-installable', { detail: { prompt: deferredPrompt } });
  window.dispatchEvent(event);
});

// Track app installation
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App was installed');
  deferredPrompt = null;
});

createRoot(document.getElementById("root")!).render(<App />);
