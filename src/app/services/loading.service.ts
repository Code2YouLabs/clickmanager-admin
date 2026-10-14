import { ErrorHandler, Injectable, OnDestroy, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService implements OnDestroy {
  private activeRequests = 0;
  private loadingStartTime = 0;
  private minDuration = 1000;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly errorHandler = inject(ErrorHandler);
  private pendingCallbacks: (() => void)[] = [];
  private loadingElement: HTMLDivElement | null = null;

  show() {
    const alreadyVisible = this.isLoading();
    this.cancelHideTimer();
    this.activeRequests++;

    if (!alreadyVisible) {
      this.loadingStartTime = Date.now();
      this.createLoadingElement();
      this.loadingElement!.style.display = 'flex';
    }
  }

  hide() {
    if (this.activeRequests === 0) return;
    this.activeRequests--;

    if (this.activeRequests === 0 && this.hideTimer === null) {
      const elapsed = Date.now() - this.loadingStartTime;
      const remainingTime = this.minDuration - elapsed;

      if (remainingTime > 0) {
        this.hideTimer = setTimeout(() => {
          this.hideTimer = null;
          this.forceHide();
        }, remainingTime);
      } else {
        this.forceHide();
      }
    }
  }

  private forceHide() {
    if (this.activeRequests > 0) return;
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
    // A callback may start another request. Keep the remaining callbacks queued
    // until that request and its minimum display time have also finished.
    while (!this.isLoading() && this.pendingCallbacks.length) {
      const callback = this.pendingCallbacks.shift()!;
      try {
        callback();
      } catch (error) {
        this.errorHandler.handleError(error);
      }
    }
  }

  runAfterHide(callback: () => void) {
    if (!this.isLoading()) {
      // Mesmo se nem existiu loading ainda, chamamos na hora
      callback();
    } else {
      this.pendingCallbacks.push(callback);
    }
  }

  isLoading(): boolean {
    return this.activeRequests > 0 || this.hideTimer !== null;
  }

  ngOnDestroy(): void {
    this.cancelHideTimer();
    this.pendingCallbacks = [];
    this.activeRequests = 0;
    this.loadingElement?.remove();
    this.loadingElement = null;
  }

  private cancelHideTimer(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private createLoadingElement() {
    if (!this.loadingElement) {
      this.loadingElement = document.createElement('div');
      this.loadingElement.classList.add('loading-overlay');
      this.loadingElement.innerHTML = `
        <div class="spinner"></div>
      `;
      document.body.appendChild(this.loadingElement);
    }
  }
}
