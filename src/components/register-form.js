// src/components/register-form.js
class RegisterForm extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        form {
          display: grid;
          gap: 12px;
        }
        label {
          display: grid;
          gap: 6px;
          font-size: 14px;
          color: var(--muted, #6b7280);
        }
        input {
          padding: 10px 12px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
          background: var(--surface, #fff);
          color: var(--text, #111827);
          outline: none;
        }
        input:focus { border-color: var(--primary, #2563eb); }
        button {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--primary, #2563eb);
          background: var(--primary, #2563eb);
          color: white;
          cursor: pointer;
        }
      </style>
      <form novalidate>
        <label>
          Nama
          <input type="text" name="name" required minlength="2" placeholder="Nama lengkap" />
        </label>
        <label>
          Email
          <input type="email" name="email" required placeholder="email@example.com" />
        </label>
        <label>
          Password
          <input type="password" name="password" required placeholder="Minimal 6 karakter" minlength="6" />
        </label>
        <button type="submit">Daftar</button>
      </form>
    `;
    this.$form = shadow.querySelector('form');
  }

  connectedCallback() {
    this.$form.addEventListener('submit', this.#onSubmit);
  }
  disconnectedCallback() {
    this.$form.removeEventListener('submit', this.#onSubmit);
  }

  #onSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(this.$form);
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '').trim();
    this.dispatchEvent(
      new CustomEvent('register-submit', {
        bubbles: true,
        detail: { name, email, password },
      })
    );
  };
}
customElements.define('register-form', RegisterForm);