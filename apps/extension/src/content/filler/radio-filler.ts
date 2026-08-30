import { EventDispatcher } from './event-dispatcher';

export class RadioFiller {
  public static fill(element: HTMLElement, _valueToSelect: string): boolean {
    if (element instanceof HTMLInputElement && element.type === 'radio') {
      // If we are given a specific radio button that matches the value, click it
      if (!element.checked) {
        element.click();
        
        if (!element.checked) {
          element.checked = true;
          EventDispatcher.dispatchEvents(element, ['change']);
        }
      }
      return true;
    }
    return false;
  }
}
