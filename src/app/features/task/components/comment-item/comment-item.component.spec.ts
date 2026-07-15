import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentItemComponent } from './comment-item.component';
import { TaskService } from '../../services/task.service';
import { TaskComment } from '../../models/task.model';
import { signal } from '@angular/core';

describe('CommentItemComponent', () => {
  let component: CommentItemComponent;
  let fixture: ComponentFixture<CommentItemComponent>;
  let mockTaskService: any;

  const mockComment: TaskComment = {
    id: 'c1',
    author: 'Alice',
    content: 'This is a comment',
    timestamp: new Date().toISOString(),
    replies: []
  };

  beforeEach(async () => {
    mockTaskService = {
      addComment: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CommentItemComponent, CommonModule, FormsModule],
      providers: [
        { provide: TaskService, useValue: mockTaskService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommentItemComponent);
    component = fixture.componentInstance;
    
    // Set required input signals
    fixture.componentRef.setInput('comment', mockComment);
    fixture.componentRef.setInput('taskId', 'task-123');

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render comment content and author', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.comment-author')?.textContent).toContain('Alice');
    expect(compiled.querySelector('.comment-content')?.textContent).toContain('This is a comment');
  });

  it('should toggle reply form visibility', () => {
    expect(component.showReplyForm()).toBe(false);
    component.toggleReplyForm();
    expect(component.showReplyForm()).toBe(true);
    component.toggleReplyForm();
    expect(component.showReplyForm()).toBe(false);
  });

  it('should submit reply and call taskService.addComment', () => {
    component.toggleReplyForm();
    fixture.detectChanges();

    component.replyAuthor.set('Bob');
    component.replyContent.set('This is a reply');
    
    component.submitReply();
    
    expect(mockTaskService.addComment).toHaveBeenCalledWith('task-123', 'c1', 'Bob', 'This is a reply');
    expect(component.replyContent()).toBe('');
    expect(component.showReplyForm()).toBe(false);
  });
});
