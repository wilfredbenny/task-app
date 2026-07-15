import { Component, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskComment } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { CommentItemComponent } from '../comment-item/comment-item.component';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule, CommentItemComponent],
  templateUrl: './comment-section.component.html',
  styleUrl: './comment-section.component.css'
})
export class CommentSectionComponent {
  comments = input.required<TaskComment[]>();
  taskId = input.required<string>();

  private taskService = inject(TaskService);

  newAuthor = signal('');
  newContent = signal('');

  // Reactively compute the sum of all comments + their nested replies
  readonly totalCommentsCount = computed(() => {
    const countReplies = (list: TaskComment[]): number => {
      let count = list.length;
      for (const item of list) {
        if (item.replies && item.replies.length > 0) {
          count += countReplies(item.replies);
        }
      }
      return count;
    };
    return countReplies(this.comments());
  });

  submitRootComment(): void {
    const author = this.newAuthor().trim();
    const content = this.newContent().trim();

    if (!author || !content) return;

    this.taskService.addComment(this.taskId(), null, author, content);
    this.newContent.set('');
  }
}
