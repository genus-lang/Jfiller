import { ContentListener } from './messaging/content-listener';

console.log('JobFill content script loaded.');

// Initialize the message listener so the popup can trigger scans and autofills
ContentListener.init();
