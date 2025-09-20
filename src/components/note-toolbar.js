class NoteToolbar extends HTMLElement {
  static get observedAttributes() { return ['filter', 'search-placeholder']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._debounceTimer = null;
    this.render();
  }

  attributeChangedCallback() { this.render(); }

  connectedCallback() {
    this.attachEvents();
  }

  get filter() {
    const f = (this.getAttribute('filter') || 'all').toLowerCase();
    return ['all', 'active', 'archived', 'pinned'].includes(f) ? f : 'all';
  }

  render() {
    const filter = this.filter;
    const placeholder = this.getAttribute('search-placeholder') || 'Cari...';

    this.shadowRoot.innerHTML = `
      <style>
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          background: white;
          border-radius: 12px;
          padding: 10px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tabs button {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #111827;
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
          font: inherit;
        }
        .tabs button[aria-pressed="true"] {
          background: #2563eb; border-color: #2563eb; color: white;
        }
        .tabs button:focus-visible, input:focus-visible {
          outline: 2px solid #2563eb; outline-offset: 2px;
        }
        .search {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .search label {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0);
          white-space: nowrap; border: 0;
        }
        .search input {
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 8px 12px;
          font: inherit;
          min-width: 220px;
          background: #fff;
        }
      </style>
      <div class="toolbar">
        <div class="tabs" role="tablist" aria-label="Filter catatan">
          ${this._tab('all', 'Semua', filter)}
          ${this._tab('active', 'Aktif', filter)}
          ${this._tab('archived', 'Arsip', filter)}
          ${this._tab('pinned', 'Disematkan', filter)}
        </div>
        <div class="search">
          <label for="q">Cari catatan</label>
          <input id="q" type="search" placeholder="${placeholder}" autocomplete="off" />
        </div>
      </div>
    `;
  }

  _tab(value, label, current) {
    const pressed = current === value ? 'true' : 'false';
    return `<button type="button" data-filter="${value}" aria-pressed="${pressed}">${label}</button>`;
  }

  attachEvents() {
    const tabs = this.shadowRoot.querySelectorAll('.tabs button');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const f = btn.getAttribute('data-filter');
        // Update UI state
        tabs.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        this.setAttribute('filter', f);
        // Emit event
        this.dispatchEvent(new CustomEvent('filter-change', {
          bubbles: true, composed: true, detail: { filter: f }
        }));
      });
    });

    const input = this.shadowRoot.querySelector('#q');
    input.addEventListener('input', () => {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        const query = input.value || '';
        this.dispatchEvent(new CustomEvent('search-change', {
          bubbles: true, composed: true, detail: { query }
        }));
      }, 250);
    });
  }
}

customElements.define('note-toolbar', NoteToolbar);