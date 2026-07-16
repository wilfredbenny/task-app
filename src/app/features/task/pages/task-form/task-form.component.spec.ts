import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { TaskFormComponent } from './task-form.component';
import { TaskService } from '../../services/task.service';
import { RichTextEditorComponent } from '../../components/rich-text-editor/rich-text-editor.component';
import { Task } from '../../models/task.model';
import { signal } from '@angular/core';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let mockTaskService: any;
  let mockRoute: any;
  let router: Router;

  const mockExistingTask: Task = {
    id: '123',
    title: 'Existing Task',
    description: 'Detailed description',
    deadline: '2026-07-25',
    status: 'Pending',
    comments: []
  };

  beforeEach(async () => {
    mockTaskService = {
      addTask: vi.fn().mockReturnValue(true),
      updateTask: vi.fn(),
      loadTasks: vi.fn(),
      getTaskById: vi.fn().mockReturnValue(signal(null)),
      tasks: signal([])
    };

    mockRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [TaskFormComponent, ReactiveFormsModule, RichTextEditorComponent],
      providers: [
        provideRouter([]),
        { provide: TaskService, useValue: mockTaskService },
        { provide: ActivatedRoute, useValue: mockRoute }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
  });

  it('should initialize empty form in create mode', () => {
    mockRoute.snapshot.paramMap.get.mockReturnValue(null);
    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(false);
    expect(component.taskForm.value).toEqual({
      title: '',
      description: '',
      deadline: '',
      status: 'Pending'
    });
  });

  it('should validate required fields', () => {
    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.taskForm.valid).toBe(false);
    
    component.taskForm.patchValue({
      title: 'New Title',
      description: 'New Description',
      deadline: '2026-07-30',
      status: 'In Progress'
    });
    
    expect(component.taskForm.valid).toBe(true);
  });

  it('should submit new task and navigate on submit', () => {
    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.taskForm.patchValue({
      title: 'New Title',
      description: 'New Description',
      deadline: '2026-07-30',
      status: 'In Progress'
    });

    component.onSubmit();

    expect(mockTaskService.addTask).toHaveBeenCalledWith('New Title', 'New Description', '2026-07-30', 'In Progress');
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('should load and patch task details in edit mode', () => {
    mockRoute.snapshot.paramMap.get.mockReturnValue('123');
    mockTaskService.getTaskById.mockReturnValue(signal(mockExistingTask));

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(true);
    expect(component.taskForm.value.title).toBe('Existing Task');
    expect(component.taskForm.value.deadline).toBe('2026-07-25');
  });

  it('should update task and navigate in edit mode', () => {
    mockRoute.snapshot.paramMap.get.mockReturnValue('123');
    mockTaskService.getTaskById.mockReturnValue(signal(mockExistingTask));

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.taskForm.patchValue({
      title: 'Updated Task Title'
    });

    component.onSubmit();

    expect(mockTaskService.updateTask).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
  });
});
