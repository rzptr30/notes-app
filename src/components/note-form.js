class NoteForm extends HTMLElement {
  static get observedAttributes() {
    return ['submit-text', 'title-minlength', 'body-minlength'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          /* lebar maksimum control (judul, isi, tombol) */
          --form-control-max: 720px;
        }

        /* Kartu form full width supaya sejajar dengan toolbar */
        form {
          width: 100%;
          margin: 0;

          background: var(--surface);
          color: var(--text);
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow);
          display: grid;
          gap: 12px;
        }

        /* Batasi lebar masing-masing baris field dan tombol, dan center */
        .row {
          width: min(var(--form-control-max), 100%);
          margin-inline: auto;
        }

        .field { display: grid; gap: 6px; }
        .field label { font-weight: 600; }

        .field input[type="text"],
        .field textarea {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          border-radius: 10px;
          padding: 10px 12px;
          font: inherit;
          transition: box-shadow .12s ease, border-color .12s ease, background-color .12s ease;
        }
        .field input[type="text"]:focus,
        .field textarea:focus {
          box-shadow: 0 0 0 3px rgba(96,165,250,0.25);
          border-color: var(--primary);
        }

        /* Textarea rapi */
        .field textarea {
          resize: vertical;     /* ubah ke 'none' jika mau benar-benar fixed */
          height: 140px;        /* tinggi default nyaman */
          min-height: 120px;
          max-height: 360px;
          overflow: auto;
        }

        .error {
          color: var(--error);
          font-size: 0.9rem;
          min-height: 1.2em;
        }

        /* Tombol ada di dalam .row agar ikut max width yang sama */
        .actions {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .actions button[type="submit"] {
          background: var(--primary);
          border: none;
          color: white;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: transform .08s ease, filter .12s ease, background-color .12s ease;
        }
        .actions button[type="submit"]:hover { filter: brightness(0.95); }
        .actions button[type="submit"]:active { transform: scale(0.98); }
        .actions button[type="submit"]:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

        @media (max-width: 480px) {
          form { padding: 12px; }
        }
      </style>

      <form id="note-form" novalidate>
        <div class="row field">
          <label for="title">Judul</label>
          <input id="title" name="title" type="text" required autocomplete="off" aria-describedby="title-error" />
          <div class="error" id="title-error" aria-live="polite"></div>
        </div>

        <div class="row field">
          <label for="body">Isi</label>
          <textarea id="body" name="body" required rows="4" aria-describedby="body-error"></textarea>
          <div class="error" id="body-error" aria-live="polite"></div>
        </div>

        <div class="row actions">
          <button type="submit"></button>
        </div>
      </form>
    `;

    this.form = this.shadowRoot.querySelector('#note-form');
    this.titleInput = this.shadowRoot.querySelector('#title');
    this.bodyInput = this.shadowRoot.querySelector('#body');
    this.titleError = this.shadowRoot.querySelector('#title-error');
    this.bodyError = this.shadowRoot.querySelector('#body-error');
    this.submitBtn = this.shadowRoot.querySelector('button[type="submit"]');
  }

  connectedCallback() {
    this.applyAttributesToControls();
    this.attachEvents();
  }

  attributeChangedCallback() {
    this.applyAttributesToControls();
  }

  applyAttributesToControls() {
    const titleMin = Number(this.getAttribute('title-minlength') ?? 3);
    const bodyMin = Number(this.getAttribute('body-minlength') ?? 5);
    const submitText = this.getAttribute('submit-text') ?? 'Tambah Catatan';

    this.titleInput.minLength = titleMin;
    this.bodyInput.minLength = bodyMin;
    this.submitBtn.textContent = submitText;
  }

  attachEvents() {
    this.titleInput.addEventListener('input', () =>
      this.validateField(this.titleInput, this.titleError)
    );
    this.bodyInput.addEventListener('input', () =>
      this.validateField(this.bodyInput, this.bodyError)
    );

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      this.bodyInput.dispatchEvent(new Event('input', { bubbles: true }));

      if (!this.form.checkValidity()) return;

      const detail = {
        title: this.titleInput.value,
        body: this.bodyInput.value,
      };
      this.dispatchEvent(new CustomEvent('create', { detail, bubbles: true, composed: true }));

      this.form.reset();
      this.titleInput.setCustomValidity('');
      this.bodyInput.setCustomValidity('');
      this.titleError.textContent = '';
      this.bodyError.textContent = '';
    });
  }

  validateField(el, errorEl) {
    let message = '';
    if (el.validity.valueMissing) message = 'Kolom ini wajib diisi.';
    else if (el.validity.tooShort) message = `Minimal ${el.minLength} karakter.`;
    else if (el.id === 'title' && el.value.trim().length < el.minLength) {
      message = `Judul minimal ${el.minLength} karakter (bukan spasi).`;
    }
    el.setCustomValidity(message);
    errorEl.textContent = message;
  }
}

if (!customElements.get('note-form')) {
  customElements.define('note-form', NoteForm);
}
