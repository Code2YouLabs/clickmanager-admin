import { TestBed } from '@angular/core/testing';
import { AppTaskComponent } from './task.component';

describe('AppTaskComponent', () => {
  it('should create with its standalone template', async () => {
    await TestBed.configureTestingModule({
      imports: [AppTaskComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppTaskComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
