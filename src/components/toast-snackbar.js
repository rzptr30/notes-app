class ToastSnackbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._queue = [];
    this._showing = false;
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          inset: auto 0 18px 0;
          display: grid;
          place-items: center;
          pointer-events: none;
          z-index: 9999;
        }
        .toast {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border);
          border-left: 6px solid var(--primary);
          box-shadow: var(--shadow);
          padding: 10px 14px;
          border-radius: 12px;
          max-width: min(92vw, 520px);
        }
        .msg { line-height: 1.3; }
        .icon { font-size: 1.1rem; }
        .toast.success { border-left-color: #16a34a; }
        .toast.warn { border-left-color: #ca8a04; }
        .toast.error { border-left-color: var(--error); }
        .toast.info { border-left-color: var(--primary); }
      </style>
      <div id="slot"></div>
    `;
  }

  async show(message, opts = {}) {
    const { variant = 'info', duration = 2200, icon } = opts;
    this._queue.push({ message: String(message || ''), variant, duration, icon });
    if (!this._showing) this._drain();
  }

  async _drain() {
    if (this._showing) return;
    this._showing = true;

    while (this._queue.length) {
      const { message, variant, duration, icon } = this._queue.shift();
      const slot = this.shadowRoot.getElementById('slot');
      slot.innerHTML = `
        <div class="toast ${variant}">
          <div class="icon">${icon ?? this._icon(variant)}</div>
          <div class="msg">${this._escape(message)}</div>
        </div>
      `;
      const el = slot.firstElementChild;

      try {
        await el.animate(
          [
            { transform: 'translateY(8px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 },
          ],
          { duration: 180, easing: 'cubic-bezier(0.22,1,0.36,1)' }
        ).finished;
      } catch {}

      await new Promise((r) => setTimeout(r, duration));

      try {
        await el.animate(
          [
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(6px)', opacity: 0 },
          ],
          { duration: 160, easing: 'ease-in' }
        ).finished;
      } catch {}

      slot.innerHTML = '';
    }

    this._showing = false;
  }

  _icon(v) {
    if (v === 'success') return '✅';
    if (v === 'warn') return '⚠️';
    if (v === 'error') return '🗑️';
    return 'ℹ️';
  }

  _escape(s) {
    return s.replace(
      /[&<>"']/g,
      (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]
    );
  }
}

const TOAST_TAG = 'toast-snackbar';
if (!customElements.get(TOAST_TAG)) {
  customElements.define(TOAST_TAG, ToastSnackbar);
}
