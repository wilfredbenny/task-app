import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;

  beforeEach(async () => {
    // Mock matchMedia before initializing component
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });

    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to light theme if no localstorage is set', () => {
    expect(component.theme()).toBe('light');
  });

  it('should toggle theme when toggleTheme is called', async () => {
    expect(component.theme()).toBe('light');
    component.toggleTheme();
    fixture.detectChanges();
    expect(component.theme()).toBe('dark');

    component.toggleTheme();
    fixture.detectChanges();
    expect(component.theme()).toBe('light');
  });

  it('should render correct text on button based on theme', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    expect(button?.textContent).toContain('Dark Mode');

    component.toggleTheme();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(button?.textContent).toContain('Light Mode');
  });
});
