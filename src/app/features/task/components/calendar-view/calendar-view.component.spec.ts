import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CalendarViewComponent } from './calendar-view.component';
import { Task } from '../../models/task.model';

describe('CalendarViewComponent', () => {
  let component: CalendarViewComponent;
  let fixture: ComponentFixture<CalendarViewComponent>;
  let router: Router;

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      description: 'Detail 1',
      deadline: '2026-07-15',
      status: 'Pending',
      comments: []
    },
    {
      id: '2',
      title: 'Task 2',
      description: 'Detail 2',
      deadline: '2026-07-20',
      status: 'Completed',
      comments: []
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarViewComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    fixture = TestBed.createComponent(CalendarViewComponent);
    component = fixture.componentInstance;
    
    // Set required input signal
    fixture.componentRef.setInput('tasks', mockTasks);
    // Explicitly set date to 2026-07-15 to keep tests deterministic
    component.currentDate.set(new Date(2026, 6, 15)); // July 2026
    
    fixture.detectChanges();
  });

  it('should create the calendar-view component', () => {
    expect(component).toBeTruthy();
  });

  it('should generate 42 calendar cells for a grid month view', () => {
    expect(component.calendarCells().length).toBe(42);
  });

  it('should navigate to next and previous months', () => {
    component.nextMonth();
    expect(component.currentDate().getMonth()).toBe(7); // August

    component.prevMonth();
    expect(component.currentDate().getMonth()).toBe(6); // July
  });

  it('should route to details page when task badge is clicked', () => {
    const event = new MouseEvent('click');
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
    
    component.navigateToTask('123', event);
    
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/tasks', '123']);
  });
});
