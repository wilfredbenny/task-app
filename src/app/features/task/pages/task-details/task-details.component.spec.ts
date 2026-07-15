import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { TaskDetailsComponent } from './task-details.component';
import { TaskService } from '../../services/task.service';
import { CommentSectionComponent } from '../../components/comment-section/comment-section.component';
import { Task } from '../../models/task.model';
import { signal } from '@angular/core';

describe('TaskDetailsComponent', () => {
  let component: TaskDetailsComponent;
  let fixture: ComponentFixture<TaskDetailsComponent>;
  let mockTaskService: any;
  let mockRoute: any;
  let router: Router;

  const mockTask: Task = {
    id: '123',
    title: 'Inspector Task',
    description: '<p>Some description</p>',
    deadline: '2026-07-25',
    status: 'In Progress',
    comments: []
  };

  beforeEach(async () => {
    mockTaskService = {
      loadTasks: vi.fn(),
      deleteTask: vi.fn(),
      getTaskById: vi.fn().mockReturnValue(signal(null))
    };

    mockRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('123')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent, CommentSectionComponent],
      providers: [
        provideRouter([]),
        { provide: TaskService, useValue: mockTaskService },
        { provide: ActivatedRoute, useValue: mockRoute }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
  });

  it('should initialize and fetch task details', () => {
    mockTaskService.getTaskById.mockReturnValue(signal(mockTask));
    fixture = TestBed.createComponent(TaskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockTaskService.loadTasks).toHaveBeenCalled();
    expect(mockTaskService.getTaskById).toHaveBeenCalledWith('123');
    expect(component.task()).toEqual(mockTask);
  });

  it('should render task details if found', () => {
    mockTaskService.getTaskById.mockReturnValue(signal(mockTask));
    fixture = TestBed.createComponent(TaskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.task-title')?.textContent).toContain('Inspector Task');
    expect(compiled.querySelector('.task-description-html')?.innerHTML).toContain('Some description');
  });

  it('should render not found template if task is null', () => {
    mockTaskService.getTaskById.mockReturnValue(signal(null));
    fixture = TestBed.createComponent(TaskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Task Not Found');
  });

  it('should trigger deleteTask and redirect to /tasks', () => {
    mockTaskService.getTaskById.mockReturnValue(signal(mockTask));
    fixture = TestBed.createComponent(TaskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteTask();

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockTaskService.deleteTask).toHaveBeenCalledWith('123');
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
  });
});
