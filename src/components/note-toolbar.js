import anime from 'animejs/lib/anime.es.js';

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
    this._prevCounts = null; // simpan nilai sebelumnya untuk animasi perubahan
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }
  connectedCallback() {
    this.render();
  }

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

    const prevCounts = this._prevCounts;

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
          transition: transform .08s ease, filter .12s ease, background-color .12s ease, border-color .12s ease, color .12s ease;
        }
        .tabs button:hover { filter: brightness(1.05); }
        .tabs button:active { transform: scale(0.98); }
        .tabs button[aria-pressed="true"] {
          background: var(--primary); border-color: var(--primary); color: #fff;
        }
        .tabs button:focus-visible, input:focus-visible, .theme:focus-visible, .export:focus-visible, .import:focus-visible {
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
          transition: background-color .12s ease, color .12s ease;
          will-change: transform;
        }
        .tabs button[aria-pressed="true"] .tab-badge {
          background: #ffffff; color: #111827;
        }
        .spacer { flex: 1 1 auto; }
        .search { display: flex; align-items: center; gap: 8px; }
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
          transition: box-shadow .12s ease, border-color .12s ease;
        }
        .search input:focus {
          box-shadow: 0 0 0 3px rgba(96,165,250,0.25);
          border-color: var(--primary);
        }
        .actions { display: flex; gap: 8px; align-items: center; }
        .theme, .export, .import {
          background: var(--button-bg); border: 1px solid var(--border); color: var(--button-fg);
          padding: 6px 10px; border-radius: 999px; cursor: pointer; font: inherit;
          transition: transform .08s ease, filter .12s ease, background-color .12s ease, border-color .12s ease, color .12s ease;
        }
        .theme:hover, .export:hover, .import:hover { filter: brightness(1.05); }
        .theme:active, .export:active, .import:active { transform: scale(0.98); }
        input[type="file"] { display: none; }
      </style>
      <div class="toolbar">
        <div class="tabs" role="tablist" aria-label="Filter catatan">
          ${this._tab('all', 'Semua', filter, all)}
          ${this._tab('active', 'Aktif', filter, active)}
          ${this._tab('archived', 'Arsip', filter, archived)}
          ${this._tab('pinned', 'Disematkan', filter, pinned)}
        </div>

        <div class="spacer"></div>

        <div class="search">
          <label for="q">Cari catatan</label>
          <input id="q" type="search" placeholder="${placeholder}" autocomplete="off" />
        </div>

        <div class="actions">
          <button type="button" class="export" title="Unduh data sebagai JSON">Export JSON</button>
          <button type="button" class="import" title="Impor data dari JSON">Import JSON</button>
          <input id="import-file" type="file" accept=".json,application/json" />
          <button type="button" class="theme" title="${themeBtnTitle}">${themeBtnText}</button>
        </div>
      </div>
    `;

    // Setelah render, animasikan badge yang berubah
    this._animateCountChanges(prevCounts, { all, active, archived, pinned });

    this._prevCounts = { all, active, archived, pinned };
    this.attachEvents();
  }

  _tab(value, label, current, count) {
    const pressed = current === value ? 'true' : 'false';
    const badge = Number.isFinite(count) ? `<span class="tab-badge">${count}</span>` : '';
    return `<button type="button" data-filter="${value}" aria-pressed="${pressed}">${label}${badge}</button>`;
  }

  _animateCountChanges(prev, curr) {
    if (!prev) return; // render pertama: tidak perlu animasi perbandingan
    const keys = [
      ['all', 'all'],
      ['active', 'active'],
      ['archived', 'archived'],
      ['pinned', 'pinned'],
    ];
    for (const [key, filterVal] of keys) {
      const before = prev[key];
      const after = curr[key];
      if (Number.isFinite(before) && Number.isFinite(after) && before !== after) {
        const badge = this.shadowRoot.querySelector(
          `.tabs button[data-filter="${filterVal}"] .tab-badge`
        );
        if (!badge) continue;
        // Animasi pulse halus menggunakan animejs
        anime.remove(badge);
        anime({
          targets: badge,
          scale: [
            { value: 1, duration: 0 },
            { value: 1.12, duration: 120, easing: 'easeOutCubic' },
            { value: 1, duration: 180, easing: 'easeOutBack' },
          ],
        });
      }
    }
  }

  attachEvents() {
    const tabs = this.shadowRoot.querySelectorAll('.tabs button');
    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.getAttribute('data-filter');
        tabs.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        this.setAttribute('filter', f);
        this.dispatchEvent(
          new CustomEvent('filter-change', {
            bubbles: true,
            composed: true,
            detail: { filter: f },
          })
        );
      });
    });

    const input = this.shadowRoot.querySelector('#q');
    input.addEventListener('input', () => {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        const query = input.value || '';
        this.dispatchEvent(
          new CustomEvent('search-change', {
            bubbles: true,
            composed: true,
            detail: { query },
          })
        );
      }, 250);
    });

    const themeBtn = this.shadowRoot.querySelector('.theme');
    themeBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('theme-toggle', { bubbles: true, composed: true }));
    });

    const exportBtn = this.shadowRoot.querySelector('.export');
    exportBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('export-data', { bubbles: true, composed: true }));
    });

    const importBtn = this.shadowRoot.querySelector('.import');
    const fileInput = this.shadowRoot.querySelector('#import-file');
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        this.dispatchEvent(
          new CustomEvent('import-data', {
            bubbles: true,
            composed: true,
            detail: { text, filename: file.name },
          })
        );
        fileInput.value = '';
      };
      reader.onerror = () => {
        this.dispatchEvent(
          new CustomEvent('import-error', {
            bubbles: true,
            composed: true,
            detail: { message: 'Gagal membaca file.' },
          })
        );
        fileInput.value = '';
      };
      reader.readAsText(file);
    });
  }
}

if (!customElements.get('note-toolbar')) {
  customElements.define('note-toolbar', NoteToolbar);
}
