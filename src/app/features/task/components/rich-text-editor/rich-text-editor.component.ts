import { Component, ElementRef, forwardRef, ViewChild, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ]
})
export class RichTextEditorComponent implements ControlValueAccessor {
  @ViewChild('editorContent', { static: true }) editorElement!: ElementRef<HTMLDivElement>;

  isFocused = false;
  isDisabled = false;

  // Active formats states
  formats = {
    bold: false,
    italic: false,
    underline: false
  };

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    if (this.editorElement) {
      this.editorElement.nativeElement.innerHTML = value || '';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onInput(): void {
    const html = this.editorElement.nativeElement.innerHTML;
    // Standardize empty content to avoid submitting redundant tags
    const normalizedHtml = (html === '<br>' || html === '<div><br></div>') ? '' : html;
    this.onChange(normalizedHtml);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
  }

  format(command: string, event: MouseEvent): void {
    event.preventDefault(); // Prevent focus loss on editor
    if (this.isDisabled) return;

    document.execCommand(command, false, '');
    this.editorElement.nativeElement.focus();
    this.checkSelection();
    this.onInput();
  }

  checkSelection(): void {
    if (typeof document === 'undefined') return;
    this.formats.bold = document.queryCommandState('bold');
    this.formats.italic = document.queryCommandState('italic');
    this.formats.underline = document.queryCommandState('underline');
  }

  isFormatActive(format: 'bold' | 'italic' | 'underline'): boolean {
    return this.formats[format];
  }
}
