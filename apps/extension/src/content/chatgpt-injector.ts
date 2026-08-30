import { ExtensionMessage} from '../messaging/message-types';

// ============================================================
// CHATGPT SELECTOR DISCOVERY
// ChatGPT updates their UI frequently. We use a priority list
// of selectors and pick whichever one exists in the current DOM.
// ============================================================
const TEXTAREA_SELECTORS = [
  '#prompt-textarea',           // classic desktop
  'textarea#prompt-textarea',
  'div#prompt-textarea',        // newer rich-text div variant
  '[data-id="root"]',
  'textarea[placeholder]',      // last resort: any textarea with placeholder
  'div[contenteditable="true"]' // contenteditable fallback
];

const SEND_BTN_SELECTORS = [
  'button[data-testid="send-button"]',
  'button[aria-label="Send message"]',
  'button[aria-label="Send prompt"]',
  'button[aria-label="Send Message"]',
  'button[data-composer-submit]',
  'form button[type="submit"]',
  'button.send-button'
];

const STOP_BTN_SELECTORS = [
  'button[aria-label="Stop generating"]',
  'button[aria-label="Stop streaming"]',
  'button[data-testid="stop-button"]',
  'button[aria-label="Stop"]'
];

const FILE_INPUT_SELECTORS = [
  'input[type="file"]',
  'input[data-image-picker-input]',
  '#mobile-composer-files-input'
];

function findElement<T extends Element>(selectors: string[]): T | null {
  for (const sel of selectors) {
    const el = document.querySelector<T>(sel);
    if (el) return el;
  }
  return null;
}

// Wait for an element to appear in DOM (polls up to maxWaitMs)
function waitForElement<T extends Element>(selectors: string[], maxWaitMs = 8000): Promise<T | null> {
  return new Promise((resolve) => {
    // Check immediately first
    const immediate = findElement<T>(selectors);
    if (immediate) { resolve(immediate); return; }

    const start = Date.now();
    const observer = new MutationObserver(() => {
      const el = findElement<T>(selectors);
      if (el) {
        observer.disconnect();
        resolve(el);
      } else if (Date.now() - start > maxWaitMs) {
        observer.disconnect();
        resolve(null);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function injectText(el: HTMLElement, text: string) {
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    const isTextarea = el.tagName === 'TEXTAREA';
    const prototype = isTextarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    
    // Use React's native setter to bypass synthetic event detection
    const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(el, text);
    } else {
      (el as HTMLInputElement | HTMLTextAreaElement).value = text;
    }
    
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // For contenteditable (e.g. ProseMirror in newer ChatGPT UI)
    el.focus();
    
    // Attempt execCommand first as it properly triggers rich-text editor events
    if (!document.execCommand('insertText', false, text)) {
      // Fallback
      el.textContent = text;
      el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    }
  }
}

export class ChatGPTInjector {
  private static activeJobTabId: number | null = null;

  public static init() {
    console.log('ApplyAI ChatGPT Bridge Loaded (Automated Mode)');
  }

  public static injectAutomatedUI(status = 'working') {
    // Remove existing banner if present
    const oldContainer = document.getElementById('applyai-automation-container');
    if (oldContainer) oldContainer.remove();

    const container = document.createElement('div');
    container.id = 'applyai-automation-container';
    container.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const msgs: Record<string, string> = {
      working: `<span class="applyai-pulse"></span> ApplyAI is working in background`,
      pasting: `⌨️ Typing your prompt into ChatGPT...`,
      sending: `🚀 Sending to ChatGPT...`,
      waiting: `⏳ Waiting for ChatGPT to respond...`,
      done:    `✅ Answers injected into your form!`
    };

    container.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #0f172a, #1e293b);
        color: white; padding: 14px 18px; border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        border: 1px solid rgba(99,102,241,0.5);
        font-size: 13px; line-height: 1.5;
      ">
        <div style="font-weight:700; font-size:14px; color:#38bdf8; margin-bottom:6px;">
          ApplyAI Auto-Resolve
        </div>
        <div id="applyai-status">${msgs[status] || msgs.working}</div>
        <div style="font-size:11px; color:#64748b; margin-top:4px;">
          Working silently in background
        </div>
      </div>
      <style>
        @keyframes applyaiPulse{0%{opacity:1}50%{opacity:.3}100%{opacity:1}}
        .applyai-pulse{display:inline-block;width:8px;height:8px;background:#38bdf8;border-radius:50%;
          animation:applyaiPulse 1.5s infinite;margin-right:6px}
      </style>
    `;

    document.body.appendChild(container);
  }

  private static updateStatus(status: string) {
    const msgs: Record<string, string> = {
      pasting: `⌨️ Typing your prompt into ChatGPT...`,
      sending: `🚀 Sending to ChatGPT...`,
      waiting: `⏳ Waiting for ChatGPT to respond...`,
      done:    `✅ Answers injected into your form!`,
      error:   `❌ Could not find ChatGPT input. Please check console.`
    };
    const el = document.getElementById('applyai-status');
    if (el) el.innerHTML = msgs[status] || status;
  }

  private static broadcastPipeline(state: string, error?: string) {
    chrome.runtime.sendMessage({
      type: 'PIPELINE_UPDATE',
      payload: { state, error }
    }).catch(() => {});
  }

  public static async pasteAndSubmitPrompt(prompt: string, resumeFile?: any, jobTabId?: number | null) {
    this.activeJobTabId = jobTabId || null;
    this.updateStatus('pasting');
    this.broadcastPipeline('CHATGPT_OPENED');

    // ── STEP 1: Find the textarea ──────────────────────────────────
    const textarea = await waitForElement<HTMLElement>(TEXTAREA_SELECTORS, 10000);
    if (!textarea) {
      console.error('ApplyAI: Could not find ChatGPT text input after 10s. Selectors tried:', TEXTAREA_SELECTORS);
      this.updateStatus('error');
      this.broadcastPipeline('ERROR', 'Could not find ChatGPT text input');
      return;
    }
    console.log('ApplyAI: Found textarea →', textarea.tagName, textarea.id, textarea.className);

    // ── STEP 2: Inject resume file if provided ─────────────────────
    if (resumeFile?.base64) {
      try {
        const byteString = atob(resumeFile.base64.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const file = new File([ab], resumeFile.name, { type: resumeFile.type });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        const fileInput = findElement<HTMLInputElement>(FILE_INPUT_SELECTORS);
        if (fileInput) {
          fileInput.files = dataTransfer.files;
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('ApplyAI: Injected resume file →', resumeFile.name);
          // Wait for file to upload before typing
          await new Promise(r => setTimeout(r, 2500));
        } else {
          console.warn('ApplyAI: No file input found, skipping file upload');
        }
      } catch (e) {
        console.error('ApplyAI: Failed to inject resume file', e);
      }
    }

    // ── STEP 3: Type the prompt ────────────────────────────────────
    textarea.focus();
    injectText(textarea, prompt);
    console.log('ApplyAI: Injected prompt text, length =', prompt.length);

    // ── STEP 4: Find and click Send until textarea clears ─────────
    this.updateStatus('sending');
    await new Promise(r => setTimeout(r, 600)); // let React register input

    let attempts = 0;
    const trySend = setInterval(() => {
      attempts++;
      const val = textarea.tagName === 'TEXTAREA' 
        ? (textarea as HTMLTextAreaElement).value 
        : textarea.textContent;
      
      // If the textarea is empty, it means the message was successfully dispatched!
      if (!val || val.trim() === '') {
        console.log('ApplyAI: Textarea cleared! Message successfully sent.');
        clearInterval(trySend);
        this.updateStatus('waiting');
        this.broadcastPipeline('PROMPT_SENT');
        this.waitForAnswerAndSend();
        return;
      }

      if (attempts > 30) {
        console.error('ApplyAI: Failed to send message after 30 seconds.');
        clearInterval(trySend);
        this.updateStatus('error');
        this.broadcastPipeline('ERROR', 'Failed to click Send button');
        return;
      }

      console.log(`ApplyAI: Attempting to click Send (Attempt ${attempts})...`);
      const sendBtn = findElement<HTMLButtonElement>(SEND_BTN_SELECTORS);
      if (sendBtn && !sendBtn.disabled) {
        sendBtn.click();
      } else {
        // Fallback: simulate Enter key
        textarea.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
          bubbles: true, cancelable: true
        }));
      }
    }, 1500); // Check every 1.5s to allow file upload to finish
  }

  private static waitForAnswerAndSend() {
    console.log('ApplyAI: Starting robust generation monitor...');

    const getLatestAssistantResponse = (): Element | null => {
      const markdownElements = document.querySelectorAll('.markdown');
      if (markdownElements.length > 0) {
        return markdownElements[markdownElements.length - 1];
      }
      
      const fallbacks = [
        'div[data-message-author-role="assistant"]',
        'article[data-testid^="conversation-turn-"]',
        '.agent-turn'
      ];
      for (const sel of fallbacks) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) return els[els.length - 1];
      }
      return null;
    };

    const initialLastMessage = getLatestAssistantResponse();
    const initialText = initialLastMessage ? (initialLastMessage.textContent || '') : '';
    
    let stableTextLength = -1;
    let stablePolls = 0;
    let waitingPolls = 0;

    const checkInterval = setInterval(() => {
      const latestMessage = getLatestAssistantResponse();
      const currentText = latestMessage ? (latestMessage.textContent || '') : '';
      
      // Consider it a new message if it's a new element OR its text grew by at least 30 chars
      const isNewMessage = latestMessage && (latestMessage !== initialLastMessage || currentText.length > initialText.length + 30);

      if (latestMessage && isNewMessage) {
        const currentLength = currentText.length;
        console.log(`ApplyAI poll — New message found! Length: ${currentLength}`);

        if (currentLength === stableTextLength && currentLength > 0) {
          stablePolls++;
          const stopBtn = findElement(STOP_BTN_SELECTORS);
          
          if (stablePolls >= 2 && !stopBtn) { 
            console.log('ApplyAI: Text length stabilized and stop button gone. Generation complete.');
            clearInterval(checkInterval);
            this.scrapeAndSend(latestMessage);
          }
        } else {
          stableTextLength = currentLength;
          stablePolls = 0;
        }
      } else {
        console.log(`ApplyAI poll — Waiting for new message to appear...`);
        const sendBtn = findElement<HTMLButtonElement>(SEND_BTN_SELECTORS);
        const stopBtn = findElement(STOP_BTN_SELECTORS);
        if (!stopBtn && sendBtn && !sendBtn.disabled && waitingPolls > 10) {
           console.warn('ApplyAI: Send button active but no new message appeared after 10s.');
        }
        waitingPolls++;
      }
    }, 1000);

    // Safety timeout: give up after 90 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      const last = getLatestAssistantResponse();
      if (last && last !== initialLastMessage) {
        console.log("ApplyAI: Timeout reached, scraping available text");
        this.scrapeAndSend(last);
      } else {
        console.error('ApplyAI: Safety timeout reached while waiting for generation.');
        this.updateStatus('error');
        this.broadcastPipeline('ERROR', 'Safety timeout reached while waiting for generation');
      }
    }, 90000);
  }

  private static scrapeAndSend(messageNode: Element) {
    const textContent = messageNode.textContent || '';
    console.log('ApplyAI: Scraped answer, length =', textContent.length);

    if (textContent.length === 0) {
      this.updateStatus('error');
      this.broadcastPipeline('ERROR', 'Scraped answer was empty');
      return;
    }

    this.broadcastPipeline('ANSWER_RECEIVED');

    chrome.runtime.sendMessage({
      type: 'CHATGPT_ANSWER_READY',
      payload: { answer: textContent, jobTabId: this.activeJobTabId }
    }, () => {
      this.updateStatus('done');
      setTimeout(() => {
        const container = document.getElementById('applyai-automation-container');
        if (container) container.remove();
        this.activeJobTabId = null;
      }, 4000);
    });
  }
}

// ── Message listener for when extension reuses existing ChatGPT tab ──
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'PASTE_PROMPT_IN_CHATGPT') {
    const { prompt, resumeFile, jobTabId } = message.payload;

    ChatGPTInjector.injectAutomatedUI('pasting');

    // Small delay to ensure content script is fully ready
    setTimeout(() => {
      ChatGPTInjector.pasteAndSubmitPrompt(prompt, resumeFile, jobTabId);
    }, 800);

    sendResponse({ success: true });
    return false;
  }
});
