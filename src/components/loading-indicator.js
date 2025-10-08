// src/components/loading-indicator.js
class LoadingIndicator extends HTMLElement {
  static get observedAttributes() {
    return ['active', 'message'];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          position: fixed;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.35);
          z-index: 9999;
        }
        :host([active]) { display: flex; }
        .card {
          min-width: 220px;
          max-width: 90vw;
          background: var(--surface, #ffffff);
          color: var(--text, #111827);
          border: 1px solid var(--border, #e5e7eb);
          box-shadow: var(--shadow, 0 2px 10px rgba(0,0,0,0.15));
          border-radius: 10px;
          padding: 18px 16px;
          display: grid;
          gap: 12px;
          text-align: center;
          animation: pop .15s ease-out;
        }
        @keyframes pop {
          from { transform: scale(0.98); opacity: .9; }
          to { transform: scale(1); opacity: 1; }
        }
        .spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(0,0,0,0.1);
          border-top-color: var(--primary, #2563eb);
          border-radius: 50%;
          margin: 0 auto;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .msg {
          font-size: 14px;
          color: var(--muted, #6b7280);
        }
      </style>
      <div class="card">
        <div class="spinner" role="progressbar" aria-label="Loading"></div>
        <div class="msg"></div>
      </div>
    `;
    this.$msg = shadow.querySelector('.msg');
  }

  attributeChangedCallback(name) {
    if (name === 'message') {
      this.$msg.textContent = this.getAttribute('message') || 'Memuat...';
    }
  }
}
customElements.define('loading-indicator', LoadingIndicator);