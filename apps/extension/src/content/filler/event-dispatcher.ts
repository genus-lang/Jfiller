export class EventDispatcher {
  /**
   * Safely sets a value on an HTMLInputElement or HTMLTextAreaElement
   * by bypassing React's internal value tracking property.
   */
  public static setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter?.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }
  }

  /**
   * Dispatches standard DOM events to trigger framework state updates.
   */
  public static dispatchEvents(element: HTMLElement, events: string[] = ['focus', 'input', 'change', 'blur']) {
    events.forEach(eventName => {
      let event;
      if (eventName === 'input' || eventName === 'change') {
        event = new Event(eventName, { bubbles: true, cancelable: false });
      } else {
        event = new FocusEvent(eventName, { bubbles: true, cancelable: false });
      }
      element.dispatchEvent(event);
    });
  }
}
