import { SiteAdapter } from './adapter.interface';
import { GenericAdapter } from './generic-adapter';
import { GoogleFormsAdapter } from './google-forms-adapter';

export class AdapterManager {
  private static adapters: SiteAdapter[] = [
    new GoogleFormsAdapter(),
    // Keep GenericAdapter last as the fallback
    new GenericAdapter()
  ];

  public static getAdapter(): SiteAdapter {
    const url = window.location.href;
    
    for (const adapter of this.adapters) {
      if (adapter.canHandle(url, document)) {
        console.log(`JobFill: Using ${adapter.name}`);
        return adapter;
      }
    }

    return new GenericAdapter();
  }
}
