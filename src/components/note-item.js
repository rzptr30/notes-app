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
          background: white;
          border: 1px solid ${pinned ? '#fde047' : '#e5e7eb'};
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          opacity: ${archived ? 0.85 : 1};
        }
        h3 { margin: 0 0 6px; font-size: 1rem; }
        p { margin: 0 0 10px; color: #374151; white-space: pre-wrap; }
        .pin { color: #92400e; font-size: 0.8rem; margin-bottom: 4px; }
        .badge {
          display: inline-block;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 999px;
          background: ${archived ? '#e5e7eb' : '#e0f2fe'};
          color: ${archived ? '#374151' : '#075985'};
          margin-bottom: 8px;
        }
        .actions { display: flex; gap: 8px; flex-wrap: wrap; }
        button {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #111827;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          font: inherit;
        }
        button:hover { background: #e5e7eb; }
        button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
        button.danger {
          background: #fee2e2; border-color: #fecaca; color: #991b1b;
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

    this.shadowRoot.querySelector('h3').textContent = title;
    this.shadowRoot.querySelector('p').textContent = body;

    this.shadowRoot.querySelector('.pin-btn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('pin', {
        bubbles: true,
        composed: true,
        detail: { id, pinned: !pinned },
      }));
    });

    this.shadowRoot.querySelector('.archive-btn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('archive', {
        bubbles: true,
        composed: true,
        detail: { id, archived: !archived },
      }));
    });

    this.shadowRoot.querySelector('.delete-btn').addEventListener('click', () => {
      if (!confirm('Hapus catatan ini?')) return;
      this.dispatchEvent(new CustomEvent('delete', {
        bubbles: true,
        composed: true,
        detail: { id },
      }));
    });
  }
}
customElements.define('note-item', NoteItem);