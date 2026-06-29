// pwa.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PwaService {
  installable = signal(false);
  installed = signal(false);
  private deferredPrompt: any = null;

  constructor() {
    this.registerServiceWorker();
    this.listenForInstall();
    this.checkIfInstalled();
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/service-worker.js');
        console.log('✅ MediShop PWA: Service Worker registered', reg.scope);
      } catch (e) {
        console.warn('PWA: Service Worker registration failed', e);
      }
    }
  }

  private listenForInstall() {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.installable.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.installable.set(false);
      this.deferredPrompt = null;
      console.log('✅ MediShop PWA Installed!');
    });
  }

  private checkIfInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.installed.set(true);
    }
  }

  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) return false;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    return outcome === 'accepted';
  }
}
