import { HTTP_INTERCEPTORS, HttpClient, HttpHandler, HttpRequest, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoadingService } from '../services/loading.service';
import { LoadingInterceptor } from './loading.interceptor';

describe('LoadingInterceptor HTTP lifecycle', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let loading: LoadingService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting(), LoadingInterceptor,
      { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true }
    ] });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(LoadingService);
  });
  afterEach(() => controller.verify());

  for (const outcome of ['success', 'error', 'cancel']) {
    it(`finalizes a ${outcome} request`, fakeAsync(() => {
      const subscription = http.get('/api/test').subscribe({ error: () => {} });
      const request = controller.expectOne('/api/test');
      expect(loading.isLoading()).toBeTrue();
      if (outcome === 'success') request.flush({ ok: true });
      if (outcome === 'error') request.flush({}, { status: 500, statusText: 'Error' });
      if (outcome === 'cancel') {
        subscription.unsubscribe();
        expect(request.cancelled).toBeTrue();
      }
      tick(1000);
      expect(loading.isLoading()).toBeFalse();
      expect(document.querySelector<HTMLElement>('.loading-overlay')?.style.display).toBe('none');
    }));
  }

  it('tracks simultaneous requests and a request started during minimum display time', fakeAsync(() => {
    http.get('/api/a').subscribe();
    http.get('/api/b').subscribe();
    controller.expectOne('/api/a').flush({});
    const second = controller.expectOne('/api/b');
    tick(300);
    expect(loading.isLoading()).toBeTrue();
    second.flush({});
    http.get('/api/c').subscribe();
    const third = controller.expectOne('/api/c');
    tick(1000);
    expect(document.querySelector<HTMLElement>('.loading-overlay')?.style.display).toBe('flex');
    third.flush({});
    expect(loading.isLoading()).toBeFalse();
  }));

  it('does not show loading for assets', () => {
    http.get('/assets/i18n/pt.json').subscribe();
    controller.expectOne('/assets/i18n/pt.json').flush({});
    expect(loading.isLoading()).toBeFalse();
  });

  it('counts subscriptions rather than construction and finalizes synchronous handler errors', fakeAsync(() => {
    const interceptor = TestBed.inject(LoadingInterceptor);
    const stream = interceptor.intercept(new HttpRequest('GET', '/api/test'), {
      handle: () => { throw new Error('handler'); }
    } as HttpHandler);
    expect(loading.isLoading()).toBeFalse();
    stream.subscribe({ error: () => {} });
    tick(1000);
    expect(loading.isLoading()).toBeFalse();
  }));
});
