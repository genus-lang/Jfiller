import { EventDispatcher } from './event-dispatcher';

export class DateFiller {
  public static fill(element: HTMLElement, dateString: string): boolean {
    if (element instanceof HTMLInputElement && element.type === 'date') {
      // Dates usually need to be in YYYY-MM-DD format for input[type="date"]
      EventDispatcher.setNativeValue(element, dateString);
      EventDispatcher.dispatchEvents(element, ['focus', 'input', 'change', 'blur']);
      return true;
    }
    return false;
  }
}
