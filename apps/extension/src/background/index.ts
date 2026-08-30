import { MessageRouter } from './message-router';

console.log('JobFill background service worker loaded.');

// Initialize the central message router for the extension
MessageRouter.init();

// When user clicks the extension icon → toggle the overlay on the current active tab
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;

  chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_OVERLAY' }, (_response) => {
    if (chrome.runtime.lastError) {
      // Content script not yet injected (e.g., on a browser internal page) — inject it first
      chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ['src/overlay/index.js']
      }).then(() => {
        // Now try again
        chrome.tabs.sendMessage(tab.id!, { type: 'TOGGLE_OVERLAY' }).catch(e => console.log('Cannot message tab', e));
      }).catch(console.error);
    }
  });
});

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('JobFill extension installed');
  }
});
