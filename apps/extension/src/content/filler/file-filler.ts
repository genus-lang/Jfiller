export class FileFiller {
  public static fill(element: HTMLElement, fileInfo: any): boolean {
    if (!fileInfo || !fileInfo.base64) {
      console.warn('FileFiller: No valid file provided.');
      return false;
    }
    
    try {
      const input = element as HTMLInputElement;
      if (input.type !== 'file') return false;

      // Decode base64
      const byteString = atob(fileInfo.base64.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      // Create File object
      const file = new File([ab], fileInfo.name, { type: fileInfo.type });
      
      // Use DataTransfer to bypass security restrictions on input.value
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      input.files = dataTransfer.files;
      
      // Some frameworks require both 'input' and 'change' events to register the file
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      return true;
    } catch (e) {
      console.error('FileFiller: Failed to automatically inject file:', e);
      return false;
    }
  }
}
