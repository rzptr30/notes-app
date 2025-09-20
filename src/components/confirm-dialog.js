class ConfirmDialog extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'message', 'confirm-text', 'cancel-text'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._resolver = null;
    this._onKeydown = this._onKeydown.bind(this);
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  get open() {
    return this.hasAttribute('open');
  }
  set open(val) {
    if (val) this.setAttribute('open', '');
    else this.removeAttribute('open');
  }

  openDialog(opts = {}) {
    const {
      message = 'Apakah kamu yakin ingin menghapus item ini?',
      confirmText = 'Hapus',
      cancelText = 'Batal',
    } = opts;

    this.setAttribute('message', message);
    this.setAttribute('confirm-text', confirmText);
    this.setAttribute('cancel-text', cancelText);

    if (typeof this._resolver === 'function') {
      try { this._resolver(false); } catch {}
      this._resolver = null;
    }

    this.open = true;

    queueMicrotask(() => {
      const confirmBtn = this.shadowRoot.querySelector('.confirm');
      confirmBtn?.focus();
    });

    document.addEventListener('keydown', this._onKeydown);

    return new Promise((resolve) => {
      this._resolver = resolve;
    });
  }

  closeDialog(result = false) {
    const panel = this.shadowRoot.querySelector('.panel');
    const backdrop = this.shadowRoot.querySelector('.backdrop');

    const anims = [];
    try {
      anims.push(
        panel.animate(
          [
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: 'translate(-50%, -48%) scale(0.98)', opacity: 0 },
          ],
          { duration: 140, easing: 'ease-in' }
        ).finished
      );
      anims.push(
        backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 140,
          easing: 'ease-in',
        }).finished
      );
    } catch {}

    Promise.allSettled(anims).finally(() => {
      this.open = false;
      document.removeEventListener('keydown', this._onKeydown);
      if (typeof this._resolver === 'function') {
        const r = this._resolver;
        this._resolver = null;
        r(result);
      }
    });
  }

  _onKeydown(e) {
    if (!this.open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeDialog(false);
    }
    if (e.key === 'Tab') {
      const focusables = Array.from(this.shadowRoot.querySelectorAll('button'));
      if (focusables.length === 0) return;
      const currentIdx = focusables.indexOf(this.shadowRoot.activeElement);
      if (e.shiftKey) {
        if (currentIdx <= 0) {
          e.preventDefault();
          focusables[focusables.length - 1].focus();
        }
      } else {
        if (currentIdx === focusables.length - 1) {
          e.preventDefault();
          focusables[0].focus();
        }
      }
    }
  }

  render() {
    const open = this.open;
    const message = this.getAttribute('message') || 'Apakah kamu yakin ingin menghapus item ini?';
    const confirmText = this.getAttribute('confirm-text') || 'Hapus';
    const cancelText = this.getAttribute('cancel-text') || 'Batal';

    this.shadowRoot.innerHTML = `
      <style>
        :host { position: fixed; inset: 0; display: ${open ? 'block' : 'none'}; }
        .backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(1px);
          animation: fadeIn .16s ease-out both;
        }
        .panel {
          position: fixed; left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          width: min(92vw, 440px);
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--shadow);
          padding: 16px;
          animation: popIn .18s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes popIn {
          from { transform: translate(-50%, -48%) scale(0.98); opacity: 0; }
          to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        h2 { margin: 0 0 8px; font-size: 1.1rem; }
        p { margin: 0 0 14px; }
        .actions {
          display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;
        }
        button {
          background: var(--button-bg);
          border: 1px solid var(--border);
          color: var(--button-fg);
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          font: inherit;
          transition: transform .08s ease, filter .12s ease, background-color .12s ease, border-color .12s ease;
        }
        button:hover { filter: brightness(1.05); }
        button:active { transform: scale(0.98); }
        button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        .confirm {
          background: var(--danger-bg);
          border-color: var(--danger-border);
          color: var(--danger-fg);
        }
      </style>
      <div class="backdrop" part="backdrop" aria-hidden="true"></div>
      <div class="panel" role="dialog" aria-modal="true" aria-labelledby="cd-title" aria-describedby="cd-desc">
        <h2 id="cd-title">Konfirmasi</h2>
        <p id="cd-desc"></p>
        <div class="actions">
          <button type="button" class="cancel">${cancelText}</button>
          <button type="button" class="confirm">${confirmText}</button>
        </div>
      </div>
    `;

    const msgEl = this.shadowRoot.querySelector('#cd-desc');
    if (msgEl) msgEl.textContent = message;

    const backdrop = this.shadowRoot.querySelector('.backdrop');
    const cancelBtn = this.shadowRoot.querySelector('.cancel');
    const confirmBtn = this.shadowRoot.querySelector('.confirm');

    backdrop?.addEventListener('click', () => this.closeDialog(false));
    cancelBtn?.addEventListener('click', () => this.closeDialog(false));
    confirmBtn?.addEventListener('click', () => this.closeDialog(true));
  }
}

customElements.define('confirm-dialog', ConfirmDialog);