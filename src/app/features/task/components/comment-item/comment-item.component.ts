import { Component, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskComment } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-item.component.html',
  styleUrl: './comment-item.component.css'
})
export class CommentItemComponent {
  comment = input.required<TaskComment>();
  taskId = input.required<string>();

  private taskService = inject(TaskService);

  showReplyForm = signal(false);
  replyAuthor = signal('');
  replyContent = signal('');

  // Dynamically query avatar
  avatarUrl = computed(() => {
    const author = this.comment().author;
    return this.comment().avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(author)}`;
  });

  toggleReplyForm(): void {
    this.showReplyForm.update(val => !val);
    if (!this.showReplyForm()) {
      this.replyContent.set('');
    }
  }

  submitReply(): void {
    const author = this.replyAuthor().trim();
    const content = this.replyContent().trim();

    if (!author || !content) return;

    // Dispatch comment addition
    this.taskService.addComment(this.taskId(), this.comment().id, author, content);

    // Reset Form
    this.replyContent.set('');
    this.showReplyForm.set(false);
  }
}
