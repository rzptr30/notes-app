class NoteList extends HTMLElement {
  static get observedAttributes() { return ['min', 'gap']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  attributeChangedCallback() { this.render(); }

  render() {
    const min = this.getAttribute('min') ?? '220';
    const gap = this.getAttribute('gap') ?? '12';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --min: ${Number(min)}px;
          --gap: ${Number(gap)}px;
          display: block;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(var(--min), 1fr));
          gap: var(--gap);
        }
      </style>
      <div class="grid"><slot></slot></div>
    `;
  }
}
customElements.define('note-list', NoteList);