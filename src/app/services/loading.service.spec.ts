import { ErrorHandler } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoadingService } from './loading.service';

// Assert both the public state and the actual overlay visibility.
describe('LoadingService concurrency', () => {
  let service: LoadingService;
  let errors: jasmine.Spy;
  const visible = () => document.querySelector<HTMLElement>('.loading-overlay')?.style.display === 'flex';

  beforeEach(() => {
    errors = jasmine.createSpy('handleError');
    TestBed.configureTestingModule({ providers: [{ provide: ErrorHandler, useValue: { handleError: errors } }] });
    service = TestBed.inject(LoadingService);
  });
  afterEach(() => service.ngOnDestroy());

  it('keeps a fast request visible for one second and drains callbacks once', fakeAsync(() => {
    const callback = jasmine.createSpy('callback');
    service.show();
    service.runAfterHide(callback);
    service.hide();
    tick(999);
    expect(visible()).toBeTrue();
    expect(callback).not.toHaveBeenCalled();
    tick(1);
    expect(visible()).toBeFalse();
    expect(service.isLoading()).toBeFalse();
    expect(callback).toHaveBeenCalledTimes(1);
  }));

  it('waits for all simultaneous requests, including a slow one', fakeAsync(() => {
    service.show();
    service.show();
    service.hide();
    tick(1500);
    expect(visible()).toBeTrue();
    service.hide();
    expect(visible()).toBeFalse();
  }));

  it('cancels an old hide timer when a new request starts', fakeAsync(() => {
    const callback = jasmine.createSpy('callback');
    service.show();
    service.hide();
    service.runAfterHide(callback);
    tick(500);
    service.show();
    tick(1000);
    expect(service.isLoading()).toBeTrue();
    expect(visible()).toBeTrue();
    expect(callback).not.toHaveBeenCalled();
    service.hide();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(visible()).toBeFalse();
  }));

  it('preserves the minimum duration across successive fast requests', fakeAsync(() => {
    service.show();
    service.hide();
    tick(500);
    service.show();
    service.hide();
    tick(499);
    expect(visible()).toBeTrue();
    tick(1);
    expect(visible()).toBeFalse();
  }));

  it('ignores unmatched hide calls instead of making the count negative', fakeAsync(() => {
    service.hide();
    expect(service.isLoading()).toBeFalse();
    service.show();
    service.hide();
    service.hide();
    tick(1000);
    service.show();
    expect(visible()).toBeTrue();
    service.hide();
    tick(1000);
    expect(visible()).toBeFalse();
  }));

  it('defers remaining callbacks if a callback starts a new request', fakeAsync(() => {
    const callback = jasmine.createSpy('callback');
    service.show();
    service.runAfterHide(() => service.show());
    service.runAfterHide(callback);
    service.hide();
    tick(1000);
    expect(visible()).toBeTrue();
    expect(callback).not.toHaveBeenCalled();
    service.hide();
    tick(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  }));

  it('does not orphan later callbacks when one throws', fakeAsync(() => {
    const callback = jasmine.createSpy('callback');
    service.show();
    service.runAfterHide(() => { throw new Error('callback'); });
    service.runAfterHide(callback);
    service.hide();
    tick(1000);
    expect(errors).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  }));

  it('runs immediately when idle and removes timers and callbacks on destruction', fakeAsync(() => {
    const callback = jasmine.createSpy('callback');
    service.runAfterHide(callback);
    expect(callback).toHaveBeenCalledTimes(1);
    service.show();
    service.hide();
    service.runAfterHide(callback);
    service.ngOnDestroy();
    tick(1000);
    expect(document.querySelector('.loading-overlay')).toBeNull();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(service.isLoading()).toBeFalse();
  }));
});
