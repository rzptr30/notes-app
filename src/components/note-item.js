class NoteItem extends HTMLElement {
  static get observedAttributes() { return ['note-id', 'title', 'body', 'pinned', 'archived']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  attributeChangedCallback() { this.render(); }

  render() {
    const id = this.getAttribute('note-id') ?? '';
    const title = this.getAttribute('title') ?? '';
    const body = this.getAttribute('body') ?? '';
    const pinned = this.hasAttribute('pinned');
    const archived = this.hasAttribute('archived');

    this.shadowRoot.innerHTML = `
      <style>
        article {
          background: var(--surface);
          color: var(--text);
          border: 1px solid ${pinned ? '#fde047' : 'var(--border)'};
          border-radius: 12px;
          padding: 12px;
          box-shadow: var(--shadow);
          opacity: ${archived ? 0.9 : 1};
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease, opacity .2s ease;
          will-change: transform;
        }
        article:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
        h3 { margin: 0 0 6px; font-size: 1rem; }
        p { margin: 0 0 10px; color: var(--text); opacity: 0.95; white-space: pre-wrap; }
        .pin { color: #f59e0b; font-size: 0.8rem; margin-bottom: 4px; }
        .badge {
          display: inline-block;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 999px;
          background: ${archived ? 'var(--badge-archived-bg)' : 'var(--badge-active-bg)'};
          color: ${archived ? 'var(--badge-archived-fg)' : 'var(--badge-active-fg)'};
          margin-bottom: 8px;
          transition: background-color .16s ease, color .16s ease;
        }
        .actions { display: flex; gap: 8px; flex-wrap: wrap; }
        button {
          background: var(--button-bg);
          border: 1px solid var(--border);
          color: var(--button-fg);
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          font: inherit;
          transition: transform .08s ease, filter .12s ease, background-color .12s ease, border-color .12s ease;
        }
        button:hover { filter: brightness(1.05); }
        button:active { transform: scale(0.98); }
        button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        button.danger {
          background: var(--danger-bg); border-color: var(--danger-border); color: var(--danger-fg);
        }
      </style>
      <article>
        ${pinned ? '<div class="pin">📌 Disematkan</div>' : ''}
        <div class="badge">${archived ? 'Arsip' : 'Aktif'}</div>
        <h3></h3>
        <p></p>
        <div class="actions">
          <button type="button" class="pin-btn">${pinned ? 'Lepas Sematan' : 'Sematkan'}</button>
          <button type="button" class="archive-btn">${archived ? 'Keluarkan dari Arsip' : 'Arsipkan'}</button>
          <button type="button" class="delete-btn danger">Hapus</button>
        </div>
      </article>
    `;

    const articleEl = this.shadowRoot.querySelector('article');
    this.shadowRoot.querySelector('h3').textContent = title;
    this.shadowRoot.querySelector('p').textContent = body;

    const flash = (color = 'rgba(96,165,250,0.28)') => {
      if (!articleEl?.animate) return;
      articleEl.animate(
        [
          { boxShadow: `0 0 0 0 ${color}` },
          { boxShadow: `0 0 0 6px ${color}` },
          { boxShadow: `0 0 0 0 ${color}` },
        ],
        { duration: 420, easing: 'ease-out' }
      );
    };

    this.shadowRoot.querySelector('.pin-btn').addEventListener('click', () => {
      flash('rgba(234,179,8,0.3)'); 
      this.dispatchEvent(new CustomEvent('pin', {
        bubbles: true, composed: true, detail: { id, pinned: !pinned },
      }));
    });

    this.shadowRoot.querySelector('.archive-btn').addEventListener('click', () => {
      flash('rgba(96,165,250,0.28)'); 
      this.dispatchEvent(new CustomEvent('archive', {
        bubbles: true, composed: true, detail: { id, archived: !archived },
      }));
    });

    this.shadowRoot.querySelector('.delete-btn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('delete', {
        bubbles: true, composed: true, detail: { id },
      }));
    });
  }
}
customElements.define('note-item', NoteItem);