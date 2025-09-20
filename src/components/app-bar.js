class AppBar extends HTMLElement {
  static get observedAttributes() { return ['title', 'variant']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  attributeChangedCallback() { this.render(); }

  render() {
    const title = this.getAttribute('title') ?? 'Notes App';
    const variant = this.getAttribute('variant') ?? 'flat';
    const elevated = variant === 'elevated';

    this.shadowRoot.innerHTML = `
      <style>
        header {
          position: sticky; top: 0; z-index: 10;
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px;
          background: var(--surface);
          color: var(--text);
          border-bottom: 1px solid var(--border);
          ${elevated ? 'box-shadow: var(--shadow);' : ''}
        }
        h1 { margin: 0; font-size: 1.25rem; }
      </style>
      <header>
        <h1>${title}</h1>
      </header>
    `;
  }
}
customElements.define('app-bar', AppBar);