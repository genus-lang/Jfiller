/**
 * overlay/index.ts
 *
 * This content script injects a floating iframe sidebar onto every job application page.
 * The iframe loads the full popup UI (React app) as an overlay — it stays open until the
 * user explicitly clicks X. No separate window, no popup that closes on click-away.
 *
 * The extension icon click → background script sends TOGGLE_OVERLAY → this script shows/hides
 */

const OVERLAY_ID = 'applyai-overlay-root';
const OVERLAY_BTN_ID = 'applyai-overlay-toggle';

// ── Listen for toggle message from background ────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_OVERLAY') {
    toggleOverlay();
  }
});

function toggleOverlay() {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    // Already visible — remove it
    existing.remove();
    const btn = document.getElementById(OVERLAY_BTN_ID);
    if (btn) btn.remove();
    return;
  }

  injectOverlay();
}

function injectOverlay() {
  // ── Floating toggle button ───────────────────────────────────────────────
  const toggleBtn = document.createElement('div');
  toggleBtn.id = OVERLAY_BTN_ID;
  toggleBtn.title = 'Close JobFill';
  toggleBtn.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 2147483646;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #06b6d4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 4px 16px rgba(99,102,241,0.5);
    transition: transform 0.2s ease;
    user-select: none;
  `;
  toggleBtn.innerHTML = '✕';
  toggleBtn.style.color = 'white';
  toggleBtn.style.fontWeight = '700';
  toggleBtn.addEventListener('mouseenter', () => toggleBtn.style.transform = 'scale(1.1)');
  toggleBtn.addEventListener('mouseleave', () => toggleBtn.style.transform = 'scale(1)');
  toggleBtn.addEventListener('click', () => {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.remove();
    toggleBtn.remove();
  });

  // ── Main iframe overlay ──────────────────────────────────────────────────
  const wrapper = document.createElement('div');
  wrapper.id = OVERLAY_ID;
  wrapper.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    z-index: 2147483645;
    background: transparent;
    box-shadow: -8px 0 40px rgba(0,0,0,0.35);
    border-left: 1px solid rgba(99,102,241,0.3);
    animation: applyaiSlideIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    overflow: hidden;
  `;

  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('src/popup/index.html');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
  `;

  // ── Slide-in animation ───────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    @keyframes applyaiSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);
  document.body.appendChild(toggleBtn);
}
