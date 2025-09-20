class NoteToolbar extends HTMLElement {
  static get observedAttributes() {
    return [
      'filter',
      'search-placeholder',
      'theme',
      'count-all',
      'count-active',
      'count-archived',
      'count-pinned',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._debounceTimer = null;
    this.render();
  }

  attributeChangedCallback() { this.render(); }

  connectedCallback() { this.render(); }

  get filter() {
    const f = (this.getAttribute('filter') || 'all').toLowerCase();
    return ['all', 'active', 'archived', 'pinned'].includes(f) ? f : 'all';
  }

  get theme() {
    const t = (this.getAttribute('theme') || 'light').toLowerCase();
    return t === 'dark' ? 'dark' : 'light';
  }

  get counts() {
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    return {
      all: toNum(this.getAttribute('count-all')),
      active: toNum(this.getAttribute('count-active')),
      archived: toNum(this.getAttribute('count-archived')),
      pinned: toNum(this.getAttribute('count-pinned')),
    };
  }

  render() {
    const filter = this.filter;
    const placeholder = this.getAttribute('search-placeholder') || 'Cari...';
    const theme = this.theme;
    const { all, active, archived, pinned } = this.counts;

    const themeBtnText = theme === 'dark' ? '☀️ Terang' : '🌙 Gelap';
    const themeBtnTitle = theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap';

    this.shadowRoot.innerHTML = `
      <style>
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px;
          box-shadow: var(--shadow);
        }
        .tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .tabs button {
          background: var(--button-bg);
          border: 1px solid var(--border);
          color: var(--button-fg);
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
          font: inherit;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .tabs button[aria-pressed="true"] {
          background: var(--primary); border-color: var(--primary); color: #fff;
        }
        .tabs button:focus-visible, input:focus-visible, .theme:focus-visible {
          outline: 2px solid var(--primary); outline-offset: 2px;
        }
        .tab-badge {
          display: inline-block;
          min-width: 20px;
          padding: 0 6px;
          height: 20px;
          line-height: 20px;
          font-size: 0.75rem;
          border-radius: 999px;
          text-align: center;
          background: var(--badge-archived-bg);
          color: var(--badge-archived-fg);
        }
        .tabs button[aria-pressed="true"] .tab-badge {
          background: #ffffff; color: #111827;
        }
        .search {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .search label {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }
        .search input {
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 8px 12px;
          font: inherit;
          min-width: 220px;
          background: var(--surface);
          color: var(--text);
        }
        .theme {
          background: var(--button-bg); border: 1px solid var(--border); color: var(--button-fg);
          padding: 6px 10px; border-radius: 999px; cursor: pointer; font: inherit;
        }
      </style>
      <div class="toolbar">
        <div class="tabs" role="tablist" aria-label="Filter catatan">
          ${this._tab('all', 'Semua', filter, all)}
          ${this._tab('active', 'Aktif', filter, active)}
          ${this._tab('archived', 'Arsip', filter, archived)}
          ${this._tab('pinned', 'Disematkan', filter, pinned)}
        </div>

        <div class="search">
          <label for="q">Cari catatan</label>
          <input id="q" type="search" placeholder="${placeholder}" autocomplete="off" />
        </div>

        <button type="button" class="theme" title="${themeBtnTitle}">${themeBtnText}</button>
      </div>
    `;

    this.attachEvents();
  }

  _tab(value, label, current, count) {
    const pressed = current === value ? 'true' : 'false';
    const badge = Number.isFinite(count) ? `<span class="tab-badge">${count}</span>` : '';
    return `<button type="button" data-filter="${value}" aria-pressed="${pressed}">${label}${badge}</button>`;
  }

  attachEvents() {
    const tabs = this.shadowRoot.querySelectorAll('.tabs button');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const f = btn.getAttribute('data-filter');
        tabs.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        this.setAttribute('filter', f);
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

    const themeBtn = this.shadowRoot.querySelector('.theme');
    themeBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('theme-toggle', { bubbles: true, composed: true }));
    });
  }
}

customElements.define('note-toolbar', NoteToolbar);