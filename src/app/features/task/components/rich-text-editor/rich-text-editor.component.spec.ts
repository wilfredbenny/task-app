import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RichTextEditorComponent } from './rich-text-editor.component';

describe('RichTextEditorComponent', () => {
  let component: RichTextEditorComponent;
  let fixture: ComponentFixture<RichTextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichTextEditorComponent, CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RichTextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set element innerHTML on writeValue', () => {
    component.writeValue('<p>Hello World</p>');
    expect(component.editorElement.nativeElement.innerHTML).toBe('<p>Hello World</p>');
  });

  it('should handle disabled state', () => {
    component.setDisabledState(true);
    expect(component.isDisabled).toBe(true);

    component.setDisabledState(false);
    expect(component.isDisabled).toBe(false);
  });

  it('should trigger focus and blur states', () => {
    component.onFocus();
    expect(component.isFocused).toBe(true);

    component.onBlur();
    expect(component.isFocused).toBe(false);
  });

  it('should trigger formatting commands on click', () => {
    // Mock execCommand and queryCommandState since they are not defined in JSDOM
    document.execCommand = vi.fn();
    document.queryCommandState = vi.fn().mockReturnValue(false);
    const execCommandSpy = vi.spyOn(document, 'execCommand');
    const mockEvent = new MouseEvent('mousedown');
    const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');

    component.format('bold', mockEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(execCommandSpy).toHaveBeenCalledWith('bold', false, '');
  });
});
