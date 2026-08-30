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

// Set value on a textarea or contenteditable in a way React detects
function injectText(el: HTMLElement, text: string) {
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    const textarea = el as HTMLTextAreaElement;
    // Use React's native setter to bypass synthetic event detection
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(textarea, text);
    else textarea.value = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // contenteditable div
    el.textContent = text;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  }
}

export class ChatGPTInjector {
  public static init() {
    console.log('ApplyAI ChatGPT Bridge Loaded (Automated Mode)');
    
    // Only inject if there's a prompt parameter (new tab opened by extension)
    const urlParams = new URLSearchParams(window.location.search);
    const hasJobFillPrompt = urlParams.has('q');

    if (hasJobFillPrompt) {
      this.injectAutomatedUI();
      // Wait for React to fully mount before trying to paste
      setTimeout(() => {
        this.pasteAndSubmitPrompt(urlParams.get('q')!);
      }, 3000);
    }
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

  public static async pasteAndSubmitPrompt(prompt: string, resumeFile?: any) {
    this.updateStatus('pasting');

    // ── STEP 1: Find the textarea ──────────────────────────────────
    const textarea = await waitForElement<HTMLElement>(TEXTAREA_SELECTORS, 10000);
    if (!textarea) {
      console.error('ApplyAI: Could not find ChatGPT text input after 10s. Selectors tried:', TEXTAREA_SELECTORS);
      this.updateStatus('error');
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

    // ── STEP 4: Find and click Send ───────────────────────────────
    this.updateStatus('sending');
    await new Promise(r => setTimeout(r, 600)); // let React register input

    const sendBtn = findElement<HTMLButtonElement>(SEND_BTN_SELECTORS);
    console.log('ApplyAI: Send button found →', sendBtn?.tagName, sendBtn?.getAttribute('aria-label'), sendBtn?.disabled);

    if (sendBtn && !sendBtn.disabled) {
      sendBtn.click();
      console.log('ApplyAI: Clicked send button');
    } else {
      // Fallback: simulate Enter key
      console.warn('ApplyAI: Send button not found or disabled — falling back to Enter key');
      textarea.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
        bubbles: true, cancelable: true
      }));
    }

    // ── STEP 5: Wait for generation to finish ─────────────────────
    this.updateStatus('waiting');
    this.waitForAnswerAndSend();
  }

  private static waitForAnswerAndSend() {
    console.log('ApplyAI: Starting generation monitor...');

    // Wait 3s for generation to begin, then poll every second
    setTimeout(() => {
      let stableCount = 0; // consecutive "not generating" checks before we scrape

      const checkFinished = setInterval(() => {
        const stopBtn = findElement(STOP_BTN_SELECTORS);
        const sendBtn = findElement<HTMLButtonElement>(SEND_BTN_SELECTORS);
        const isGenerating = !!stopBtn || !sendBtn || sendBtn.disabled;

        console.log('ApplyAI poll — stopBtn:', !!stopBtn, 'sendBtn:', !!sendBtn, 'disabled:', sendBtn?.disabled, '→ generating:', isGenerating);

        if (!isGenerating) {
          stableCount++;
          if (stableCount >= 2) { // require 2 consecutive stable checks
            console.log('ApplyAI: Generation complete.');
            clearInterval(checkFinished);
            setTimeout(() => this.scrapeAndSend(), 1500);
          }
        } else {
          stableCount = 0;
        }
      }, 1000);

      // Safety timeout: give up after 3 minutes
      setTimeout(() => clearInterval(checkFinished), 180000);
    }, 3000);
  }

  private static scrapeAndSend() {
    // Try multiple message selectors
    const messageSels = [
      'div[data-message-author-role="assistant"]',
      '[data-testid="conversation-turn-"] .markdown',
      '.agent-turn .markdown',
      'div.markdown'
    ];

    let lastMessage: Element | null = null;
    for (const sel of messageSels) {
      const all = document.querySelectorAll(sel);
      if (all.length > 0) { lastMessage = all[all.length - 1]; break; }
    }

    if (!lastMessage) {
      console.warn('ApplyAI: No assistant message found in DOM');
      this.updateStatus('error');
      return;
    }

    const textContent = lastMessage.textContent || '';
    console.log('ApplyAI: Scraped answer, length =', textContent.length);

    chrome.runtime.sendMessage({
      type: 'CHATGPT_ANSWER_READY',
      payload: { answer: textContent }
    } as ExtensionMessage, () => {
      this.updateStatus('done');
      setTimeout(() => {
        const container = document.getElementById('applyai-automation-container');
        if (container) container.remove();
      }, 4000);
    });
  }
}

// ── Message listener for when extension reuses existing ChatGPT tab ──
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'PASTE_PROMPT_IN_CHATGPT') {
    const { prompt, resumeFile } = message.payload;

    ChatGPTInjector.injectAutomatedUI('pasting');

    // Small delay to ensure content script is fully ready
    setTimeout(() => {
      ChatGPTInjector.pasteAndSubmitPrompt(prompt, resumeFile);
    }, 800);

    sendResponse({ success: true });
    return false;
  }
});
