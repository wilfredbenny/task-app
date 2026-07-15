import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideRouter, RouterLink } from '@angular/router';
import { TaskListComponent } from './task-list.component';
import { TaskService } from '../../services/task.service';
import { CalendarViewComponent } from '../../components/calendar-view/calendar-view.component';
import { Task } from '../../models/task.model';
import { signal } from '@angular/core';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let mockTaskService: any;

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'First Task',
      description: '<p>Establish guidelines</p>',
      deadline: '2026-07-15',
      status: 'Pending',
      comments: []
    },
    {
      id: '2',
      title: 'Second Task',
      description: 'Finish project build',
      deadline: '2026-07-20',
      status: 'Completed',
      comments: []
    }
  ];

  beforeEach(async () => {
    mockTaskService = {
      tasks: signal(mockTasks),
      loading: signal(false),
      error: signal(null),
      loadTasks: vi.fn(),
      deleteTask: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [TaskListComponent, CommonModule, FormsModule, RouterLink, CalendarViewComponent],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadTasks on initialization', () => {
    expect(mockTaskService.loadTasks).toHaveBeenCalled();
  });

  it('should filter tasks by search query', () => {
    component.searchQuery.set('First');
    fixture.detectChanges();
    expect(component.filteredTasks().length).toBe(1);
    expect(component.filteredTasks()[0].id).toBe('1');
  });

  it('should filter tasks by status tab', () => {
    component.selectedStatus.set('Completed');
    fixture.detectChanges();
    expect(component.filteredTasks().length).toBe(1);
    expect(component.filteredTasks()[0].id).toBe('2');
  });

  it('should prompt before deleting and call deleteTask', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteTask('1');
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this task?');
    expect(mockTaskService.deleteTask).toHaveBeenCalledWith('1');
  });
});
