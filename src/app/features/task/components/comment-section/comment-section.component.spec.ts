import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentSectionComponent } from './comment-section.component';
import { CommentItemComponent } from '../comment-item/comment-item.component';
import { TaskService } from '../../services/task.service';
import { TaskComment } from '../../models/task.model';

describe('CommentSectionComponent', () => {
  let component: CommentSectionComponent;
  let fixture: ComponentFixture<CommentSectionComponent>;
  let mockTaskService: any;

  const mockComments: TaskComment[] = [
    {
      id: 'c1',
      author: 'Alice',
      content: 'This is comment 1',
      timestamp: new Date().toISOString(),
      replies: [
        {
          id: 'c1-1',
          author: 'Bob',
          content: 'This is reply 1',
          timestamp: new Date().toISOString(),
          replies: []
        }
      ]
    },
    {
      id: 'c2',
      author: 'Charlie',
      content: 'This is comment 2',
      timestamp: new Date().toISOString(),
      replies: []
    }
  ];

  beforeEach(async () => {
    mockTaskService = {
      addComment: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CommentSectionComponent, CommentItemComponent, CommonModule, FormsModule],
      providers: [
        { provide: TaskService, useValue: mockTaskService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommentSectionComponent);
    component = fixture.componentInstance;
    
    // Set required input signals
    fixture.componentRef.setInput('comments', mockComments);
    fixture.componentRef.setInput('taskId', 'task-123');

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate total comments count recursively', () => {
    // c1, c1-1, c2 = 3 comments total
    expect(component.totalCommentsCount()).toBe(3);
  });

  it('should render correct comments count title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.section-title')?.textContent).toContain('Comments (3)');
  });

  it('should submit root comment and call taskService.addComment', () => {
    component.newAuthor.set('Diana');
    component.newContent.set('This is a root comment');
    
    component.submitRootComment();
    
    expect(mockTaskService.addComment).toHaveBeenCalledWith('task-123', null, 'Diana', 'This is a root comment');
    expect(component.newContent()).toBe('');
  });
});
