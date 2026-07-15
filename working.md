# Task Manager — How It Works

A detailed technical reference covering architecture, data flow, persistence, validations, and the role of NgRx + RxJS in this Angular 21 app.

---

## Table of Contents

1. [How This Works (Overview)](#1-how-this-works-overview)
2. [How Comments Are Stored](#2-how-comments-are-stored)
3. [How Tasks Are Stored & Linked to Comments](#3-how-tasks-are-stored--linked-to-comments)
4. [Architecture Design](#4-architecture-design)
5. [Validations](#5-validations)
6. [NgRx & RxJS Usage](#6-ngrx--rxjs-usage)

---

## 1. How This Works (Overview)

The app is a client-side **Angular 21 standalone** task manager with no backend. All state lives in an **NgRx store** that is automatically persisted to and hydrated from **`localStorage`**.

### User Flow

```
App Boot
  └─► AppConfig bootstraps NgRx store + router
        └─► Router resolves "/" → "/tasks" → TaskListComponent
              └─► ngOnInit dispatches loadTasks()
                    └─► Effect checks localStorage
                          ├─► (hit)  emits loadTasksSuccess({ tasks })
                          └─► (miss) HTTP GET /public/tasks.json → emits loadTasksSuccess({ tasks })
                                └─► Reducer updates state.tasks[]
                                      └─► UI re-renders via Signals
```

### Key Principles

| Concern | Approach |
|---|---|
| State management | NgRx Store (single source of truth) |
| Reactivity | Angular Signals + `store.selectSignal()` |
| Persistence | `localStorage` via NgRx Effects (side-effect) |
| Forms | Angular Reactive Forms + Custom Validators |
| Routing | Angular Router (standalone, no modules) |
| Styling | Vanilla CSS with CSS custom properties |

### Routes

| URL | Component | Purpose |
|---|---|---|
| `/tasks` | `TaskListComponent` | Dashboard — list + calendar views |
| `/tasks/new` | `TaskFormComponent` | Create a new task |
| `/tasks/:id` | `TaskDetailsComponent` | View task + comments |
| `/tasks/:id/edit` | `TaskFormComponent` | Edit an existing task |
| `**` / `""` | redirect | Falls back to `/tasks` |

---

## 2. How Comments Are Stored

### Data Shape

Comments are stored **inside each task object**, not in a separate collection. The `Task` interface includes a `comments` array:

```typescript
// src/app/features/task/models/task.model.ts

export interface TaskComment {
  id: string;          // "comment-<random>" e.g. "comment-a3f9z12"
  author: string;      // Free-text name entered by user
  avatar?: string;     // Optional URL; falls back to DiceBear avatar API
  content: string;     // Plain text body of the comment
  timestamp: string;   // ISO 8601 string from new Date().toISOString()
  replies: TaskComment[]; // Recursive — same structure for nested replies
}

export interface Task {
  // ...
  comments: TaskComment[]; // Root-level comments; replies nested within each
}
```

### Nested Tree Structure

Comments support **unlimited nesting depth** via a recursive tree. A root comment has `parentCommentId = null`, and each reply is placed inside its parent's `replies[]` array.

```
Task.comments[]
  ├── Comment A (root)        parentCommentId: null
  │     replies[]
  │       ├── Reply A1        parentCommentId: "comment-A"
  │       │     replies[]
  │       │       └── Reply A1a   parentCommentId: "comment-A1"
  │       └── Reply A2        parentCommentId: "comment-A"
  └── Comment B (root)        parentCommentId: null
        replies[]
          └── Reply B1        parentCommentId: "comment-B"
```

### How a Reply Is Inserted (Recursive Algorithm)

The reducer uses a recursive helper `insertReply()` to locate the correct parent at any depth and immutably add the new reply:

```typescript
// src/app/features/task/store/task.reducer.ts

function insertReply(
  comments: TaskComment[],
  parentId: string,
  newComment: TaskComment
): TaskComment[] {
  return comments.map(comment => {
    if (comment.id === parentId) {
      // Found the target parent — append new reply
      return { ...comment, replies: [...comment.replies, newComment] };
    } else if (comment.replies.length > 0) {
      // Not found yet — recurse deeper into this branch
      return { ...comment, replies: insertReply(comment.replies, parentId, newComment) };
    }
    return comment; // Leaf node, not the target
  });
}
```

This is a **depth-first tree traversal** that returns new object references at every level it visits, preserving immutability for NgRx change detection.

### Comment Counting

Both `CommentSectionComponent` and `TaskListComponent` count comments recursively to include all nested replies:

```typescript
// Counts root comments AND all their deeply nested replies
const countReplies = (list: TaskComment[]): number => {
  let count = list.length;
  for (const item of list) {
    if (item.replies && item.replies.length > 0) {
      count += countReplies(item.replies);
    }
  }
  return count;
};
```

### Comment Avatar

`CommentItemComponent` computes a dynamic avatar URL using the **DiceBear API** as a fallback if no `avatar` field is set on the comment:

```typescript
avatarUrl = computed(() => {
  const author = this.comment().author;
  return this.comment().avatar ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(author)}`;
});
```

---

## 3. How Tasks Are Stored & Linked to Comments

### Storage Location

All task data (including embedded comments) is stored in a **single `localStorage` entry**:

```
Key:   "tskmgr_tasks"
Value: JSON.stringify(Task[])
```

### Initial Seed Data

On the very first load (empty `localStorage`), the `loadTasks$` effect fetches a seed file:

```
HTTP GET /tasks.json   →   public/tasks.json
```

The fetched tasks are immediately saved to `localStorage` so subsequent reloads are instant (no HTTP round trip).

### Task–Comment Link

Tasks and comments are **not stored separately**. Comments live inside `task.comments[]`. This means:

- When you add a comment, the **entire task** is updated in the store and re-serialized to `localStorage`
- When you load the app, all tasks with all their embedded comments are restored in one `JSON.parse()` call
- The `addComment` action targets a task by `taskId` and mutates only that task's `comments[]`:

```typescript
// task.reducer.ts — addComment handler (simplified)
on(TaskActions.addComment, (state, { taskId, parentCommentId, author, content }) => {
  const newComment: TaskComment = {
    id: generateCommentId(),
    author,
    content,
    timestamp: new Date().toISOString(),
    replies: []
  };

  return {
    ...state,
    tasks: state.tasks.map(task => {
      if (task.id !== taskId) return task; // Skip other tasks (unchanged reference)

      if (!parentCommentId) {
        // Root-level comment: append to task.comments
        return { ...task, comments: [...task.comments, newComment] };
      } else {
        // Nested reply: recursively insert into the comment tree
        return { ...task, comments: insertReply(task.comments, parentCommentId, newComment) };
      }
    })
  };
})
```

### Sync Effect

Every mutating action automatically syncs the updated state back to `localStorage`:

```typescript
// task.effects.ts
syncTasksToLocalStorage$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(
        TaskActions.addTask,
        TaskActions.updateTask,
        TaskActions.deleteTask,
        TaskActions.addComment   // ← Includes comment additions
      ),
      withLatestFrom(this.store.select(selectAllTasks)),
      tap(([_, tasks]) => {
        localStorage.setItem('tskmgr_tasks', JSON.stringify(tasks));
      })
    ),
  { dispatch: false } // Side-effect only, no new action dispatched
);
```

### Task ID Generation

Task IDs and comment IDs are generated at creation time inside the reducer using a simple random string:

```typescript
function generateId(): string {
  return 'task-' + Math.random().toString(36).substring(2, 9);
  // Example: "task-a3f9z12"
}

function generateCommentId(): string {
  return 'comment-' + Math.random().toString(36).substring(2, 9);
  // Example: "comment-bx72k9a"
}
```

> **Note:** IDs are generated inside the reducer (a pure function) using `Math.random()`. This is technically a side effect in a reducer, but acceptable for a client-side demo app without a backend UUID service.

---

## 4. Architecture Design

### Folder Structure

```
src/app/
├── app.config.ts              ← Bootstrap: registers NgRx, Router, HttpClient
├── app.routes.ts              ← Route definitions (standalone, no NgModule)
├── app.component.*            ← Root shell with theme toggle + router-outlet
│
├── features/
│   └── task/
│       ├── models/
│       │   └── task.model.ts  ← Task & TaskComment interfaces, TaskStatus type
│       │
│       ├── store/             ← NgRx state slice ("task" feature)
│       │   ├── task.actions.ts
│       │   ├── task.reducer.ts
│       │   ├── task.effects.ts
│       │   └── task.selectors.ts
│       │
│       ├── services/
│       │   └── task.service.ts ← Facade: wraps store dispatch + selectSignal
│       │
│       ├── pages/             ← Routed top-level components
│       │   ├── task-list/     ← Dashboard (list + calendar toggle)
│       │   ├── task-form/     ← Create / Edit form (shared component)
│       │   └── task-details/  ← View task + comment thread
│       │
│       └── components/        ← Reusable feature components
│           ├── calendar-view/ ← Monthly calendar grid
│           ├── comment-section/ ← Root comment form + comment list
│           ├── comment-item/  ← Single comment + recursive replies
│           └── rich-text-editor/ ← contenteditable CVA editor
│
└── shared/
    ├── components/
    │   └── theme-toggle/      ← Light/dark mode toggle
    └── validators/
        └── deadline.validator.ts ← futureDateValidator()
```

### Component Hierarchy

```
AppComponent (router-outlet + theme toggle)
│
├── TaskListComponent          (route: /tasks)
│   ├── [filter/search bar]
│   ├── [task cards grid]
│   └── CalendarViewComponent  (route: /tasks → calendar toggle)
│
├── TaskFormComponent          (route: /tasks/new OR /tasks/:id/edit)
│   └── RichTextEditorComponent (CVA for description field)
│
└── TaskDetailsComponent       (route: /tasks/:id)
    └── CommentSectionComponent
          └── CommentItemComponent (self-recursive for nested replies)
```

### Data Flow

```
User Action
    │
    ▼
Component (dispatches action via TaskService)
    │
    ▼
NgRx Action  e.g. addTask({ title, description, deadline, status })
    │
    ├──► Reducer (pure fn, updates state immutably)
    │       └─► New TaskState { tasks: [...], loading, error }
    │
    └──► Effect (side-effects: HTTP, localStorage)
              └─► Dispatches success/failure actions OR writes to localStorage
    │
    ▼
Selectors (memoized slices of state)
    │
    ▼
TaskService.selectSignal()  → Angular Signal<T>
    │
    ▼
Component Template re-renders (Signal-based change detection)
```

### TaskService as a Facade

`TaskService` acts as a **single interface** between UI components and the NgRx store. Components never import from `@ngrx/store` directly — they only use `TaskService`:

```typescript
// Components only know about TaskService
this.taskService.loadTasks();
this.taskService.addTask(title, description, deadline, status);
this.taskService.updateTask(task);
this.taskService.deleteTask(id);
this.taskService.addComment(taskId, parentCommentId, author, content);
this.taskService.getTaskById(taskId); // Returns Signal<Task | null>

// Reactive state as Signals
this.taskService.tasks     // Signal<Task[]>
this.taskService.loading   // Signal<boolean>
this.taskService.error     // Signal<string | null>
```

### RichTextEditor as a ControlValueAccessor (CVA)

`RichTextEditorComponent` implements `ControlValueAccessor` so it integrates seamlessly with `ReactiveFormsModule` as a proper `formControlName`:

```typescript
providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichTextEditorComponent), multi: true }]
```

It uses the browser's native `document.execCommand()` API to apply **bold**, *italic*, and underline formatting to a `contenteditable` `<div>`. The raw HTML content is passed to the form control via `onChange(html)` on every keystroke.

---

## 5. Validations

### Form-Level Validation (Reactive Forms)

The task form uses `FormBuilder` with Angular's built-in validators plus a custom one:

```typescript
// task-form.component.ts
this.taskForm = this.fb.group({
  title:       ['', Validators.required],
  description: ['', Validators.required],
  deadline:    ['', [Validators.required, futureDateValidator()]],
  status:      ['Pending', Validators.required]
});
```

### Custom Validator: `futureDateValidator`

**File:** [`deadline.validator.ts`]

Rejects deadline dates that fall in the past. Compares only the **date** (not time) to avoid off-by-one issues caused by timezones:

```typescript
export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null; // Let Validators.required handle empty case

    const inputDate = new Date(control.value);
    if (isNaN(inputDate.getTime())) return { invalidDate: true };

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    // Build a local-midnight date for the input to avoid timezone offset issues
    const compareDate = new Date(
      inputDate.getFullYear(),
      inputDate.getMonth(),
      inputDate.getDate()
    );

    if (compareDate < today) return { pastDate: true };
    return null;
  };
}
```

**Error keys emitted:**

| Key | Triggered when |
|---|---|
| `pastDate` | The entered date is before today |
| `invalidDate` | The date string cannot be parsed |

**Template error display:**

```html
<span *ngIf="taskForm.get('deadline')?.hasError('required')">Deadline is required.</span>
<span *ngIf="taskForm.get('deadline')?.hasError('pastDate')">Deadline cannot be set in the past.</span>
<span *ngIf="taskForm.get('deadline')?.hasError('invalidDate')">Selected date is invalid.</span>
```

### Validation Timing

Errors only display after the user has interacted with a field (`dirty` or `touched`):

```typescript
isFieldInvalid(fieldName: string): boolean {
  const control = this.taskForm.get(fieldName);
  return !!(control && control.invalid && (control.dirty || control.touched));
}
```

On form submit, `markAllAsTouched()` is called to force all errors to show simultaneously.

### Description Validation (Custom Logic)

Because `RichTextEditorComponent` uses `contenteditable`, the browser may emit `<br>` or `<div><br></div>` as the "empty" state instead of an empty string. The component normalizes this:

```typescript
// rich-text-editor.component.ts
onInput(): void {
  const html = this.editorElement.nativeElement.innerHTML;
  const normalizedHtml = (html === '<br>' || html === '<div><br></div>') ? '' : html;
  this.onChange(normalizedHtml); // Propagates '' if effectively empty
}
```

The form submit handler adds an extra guard for the description:

```typescript
// task-form.component.ts — onSubmit()
const descControl = this.taskForm.get('description');
if (!descControl?.value || descControl.value.trim() === '') {
  this.errorMessage.set('Description is required!');
  this.taskForm.markAllAsTouched();
  return;
}
```

### Duplicate Task Title Prevention

`TaskService.addTask()` prevents creating a task if one with the same title already exists (case-insensitive):

```typescript
addTask(title: string, description: string, deadline: string, status: TaskStatus): boolean {
  const currentTasks = this.tasks(); // Read current Signal value
  const taskExists = currentTasks.some(
    task => task.title.trim().toLowerCase() === title.trim().toLowerCase()
  );

  if (!taskExists) {
    this.store.dispatch(TaskActions.addTask({ title, description, deadline, status }));
    return true;  // Success
  }
  return false;   // Duplicate found
}
```

If `addTask()` returns `false`, the form stays on the page and shows an inline error toast:

```typescript
// task-form.component.ts — onSubmit()
const isAdded = this.taskService.addTask(title, description, deadline, status);
if (isAdded) {
  this.router.navigate(['/tasks']); // Navigate away on success
} else {
  this.errorMessage.set(`A task with the title "${title}" already exists.`);
}
```

### Comment Validation

Comments use basic template-driven form validation (`required` attribute + signal guard):

```typescript
// comment-section.component.ts
submitRootComment(): void {
  const author = this.newAuthor().trim();
  const content = this.newContent().trim();
  if (!author || !content) return; // Silently block empty submissions
  // ...
}
```

The "Post Comment" button is also disabled at the template level:

```html
<button [disabled]="!newAuthor().trim() || !newContent().trim()" (click)="submitRootComment()">
  Post Comment
</button>
```

---

## 6. NgRx & RxJS Usage

### NgRx Store Setup

Registered in [`app.config.ts`] using the modern functional API (no `NgModule`):

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideStore({ task: taskReducer }),   // Feature key "task" → TaskState
    provideEffects([TaskEffects])
  ]
};
```

### State Shape

```typescript
// task.reducer.ts
export interface TaskState {
  tasks: Task[];          // All task objects (with embedded comments)
  loading: boolean;       // True while loadTasks effect is pending
  error: string | null;   // Set if HTTP load fails
}
```

### Actions

| Action | Payload | Purpose |
|---|---|---|
| `loadTasks` | — | Trigger initial data load |
| `loadTasksSuccess` | `{ tasks: Task[] }` | Populate state after load |
| `loadTasksFailure` | `{ error: string }` | Store error message |
| `addTask` | `{ title, description, deadline, status }` | Create new task in store |
| `updateTask` | `{ task: Task }` | Replace existing task by ID |
| `deleteTask` | `{ id: string }` | Remove task by ID |
| `addComment` | `{ taskId, parentCommentId, author, content }` | Add root comment or nested reply |

### Selectors

```typescript
// task.selectors.ts

// Root feature selector
const selectTaskState = createFeatureSelector<TaskState>('task');

// Derived slices
selectAllTasks    // Task[]
selectTasksLoading // boolean
selectTasksError  // string | null
selectTaskById(id) // (taskId: string) => MemoizedSelector<Task | null>
```

Selectors are **memoized** — they only recompute when their input slice changes, preventing unnecessary re-renders.

### Effects

**Effect 1: `loadTasks$`** — Data hydration with localStorage-first strategy

```
loadTasks action
    │
    ▼ switchMap (cancels previous if re-dispatched)
    │
    ├── localStorage.getItem("tskmgr_tasks")
    │     ├── (exists + parseable) → of(loadTasksSuccess({ tasks }))
    │     └── (missing/invalid)   → HttpClient.get<Task[]>('tasks.json')
    │                                   ├── (success) → localStorage.setItem(...) → loadTasksSuccess
    │                                   └── (error)   → loadTasksFailure({ error })
```

**Effect 2: `syncTasksToLocalStorage$`** — Persistence on every mutation

```
addTask | updateTask | deleteTask | addComment
    │
    ▼ withLatestFrom(selectAllTasks)    ← Gets current snapshot of tasks Signal
    │
    ▼ tap([_, tasks]) => localStorage.setItem("tskmgr_tasks", JSON.stringify(tasks))
    │
    (dispatch: false)  ← No new action emitted; pure side-effect
```

### RxJS Operators Used

| Operator | Where | Why |
|---|---|---|
| `switchMap` | `loadTasks$` effect | Cancels in-flight HTTP if action fires again |
| `catchError` | `loadTasks$` effect | Converts HTTP errors to `loadTasksFailure` action |
| `map` | `loadTasks$` effect | Transforms `Task[]` response to `loadTasksSuccess` action |
| `of` | `loadTasks$` effect | Wraps localStorage result in an observable |
| `ofType` | Both effects | Filters the actions$ stream to only relevant action types |
| `withLatestFrom` | `syncTasksToLocalStorage$` | Snapshots current store state at the moment the action fires |
| `tap` | `syncTasksToLocalStorage$` | Runs the localStorage write as a side-effect without altering the stream |

### Angular Signals Integration

`TaskService` bridges NgRx observables to Angular Signals using `store.selectSignal()`:

```typescript
// task.service.ts
readonly tasks: Signal<Task[]> = this.store.selectSignal(TaskSelectors.selectAllTasks);
readonly loading: Signal<boolean> = this.store.selectSignal(TaskSelectors.selectTasksLoading);
readonly error: Signal<string | null> = this.store.selectSignal(TaskSelectors.selectTasksError);
```

Components then use `computed()` to derive reactive values from those signals:

```typescript
// task-list.component.ts
readonly filteredTasks = computed(() => {
  const rawTasks = this.taskService.tasks(); // Signal read → tracks dependency
  const query = this.searchQuery().toLowerCase().trim();
  const status = this.selectedStatus();

  return rawTasks.filter(task => {
    const matchesStatus = status === 'All' || task.status === status;
    const matchesQuery = !query ||
      task.title.toLowerCase().includes(query) ||
      this.stripHtml(task.description).toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });
});
```

`filteredTasks` automatically recomputes whenever `tasks()`, `searchQuery()`, or `selectedStatus()` changes — **no manual subscriptions or `async` pipes needed**.

### CalendarView Computed Grid

`CalendarViewComponent` uses a `computed()` to build the entire calendar grid reactively. When `currentDate` signal changes (user clicks prev/next month), the full 42-cell grid is recalculated:

```typescript
readonly calendarCells = computed<CalendarCell[]>(() => {
  const activeDate = this.currentDate(); // Signal dependency
  // ... builds array of 42 CalendarCell objects
  // Each cell contains: date, isCurrentMonth, isToday, tasks[]
  // tasks[] is populated by matching task.deadline === "YYYY-MM-DD"
});
```

### Effect in TaskFormComponent (Edit Mode)

`TaskFormComponent` uses Angular's `effect()` to reactively populate the form when the task loads from the store (handles async store hydration on page refresh):

```typescript
// task-form.component.ts — constructor
const idParam = route.snapshot.paramMap.get('id');
if (idParam) {
  const taskSignal = this.taskService.getTaskById(idParam);
  effect(() => {
    const task = taskSignal(); // Re-runs whenever the task updates in store
    if (task) {
      this.populateForm(task);
    }
  });
}
```

This ensures that if the user navigates directly to `/tasks/:id/edit` and the store is still loading, the form populates as soon as `loadTasksSuccess` fires and the signal updates.
