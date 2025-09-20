class NoteForm extends HTMLElement {
  static get observedAttributes() { return ['submit-text', 'title-minlength', 'body-minlength']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        form {
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          display: grid;
          gap: 12px;
        }
        .field { display: grid; gap: 6px; }
        .field label { font-weight: 600; }
        .field input[type="text"], .field textarea {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          font: inherit;
        }
        .field input[type="text"]:focus-visible, .field textarea:focus-visible {
          outline: 2px solid #2563eb; outline-offset: 2px;
        }
        .error { color: #c62828; font-size: 0.9rem; min-height: 1.2em; }
        button[type="submit"] {
          justify-self: start;
          background: #2563eb;
          border: none;
          color: white;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
        }
        button[type="submit"]:hover { filter: brightness(0.95); }
        button[type="submit"]:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
      </style>
      <form id="note-form" novalidate>
        <div class="field">
          <label for="title">Judul</label>
          <input id="title" name="title" type="text" required autocomplete="off" aria-describedby="title-error" />
          <div class="error" id="title-error" aria-live="polite"></div>
        </div>
        <div class="field">
          <label for="body">Isi</label>
          <textarea id="body" name="body" required rows="4" aria-describedby="body-error"></textarea>
          <div class="error" id="body-error" aria-live="polite"></div>
        </div>
        <button type="submit"></button>
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
    this.titleInput.addEventListener('input', () => this.validateField(this.titleInput, this.titleError));
    this.bodyInput.addEventListener('input', () => this.validateField(this.bodyInput, this.bodyError));

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Paksa validasi realtime sebelum submit
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
customElements.define('note-form', NoteForm);