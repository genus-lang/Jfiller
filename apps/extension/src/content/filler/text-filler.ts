import { EventDispatcher } from './event-dispatcher';

export class TextFiller {
  public static fill(element: HTMLElement, value: string): boolean {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      EventDispatcher.setNativeValue(element, value);
      EventDispatcher.dispatchEvents(element, ['focus', 'input', 'change', 'blur']);
      return true;
    }
    
    // Handle ARIA contenteditable textboxes
    if (element.getAttribute('role') === 'textbox' && element.isContentEditable) {
      element.focus();
      element.textContent = value;
      EventDispatcher.dispatchEvents(element, ['input', 'blur']);
      return true;
    }

    return false;
  }
}
