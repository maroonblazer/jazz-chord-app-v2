export class FretboardView {
  constructor(container) {
    if (!container) {
      throw new Error('FretboardView requires a container element');
    }
    this.container = container;
  }

  render(svgString) {
    // Parse SVG through DOMParser for XSS safety rather than raw innerHTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      console.error('FretboardView: invalid SVG', errorNode.textContent);
      return;
    }
    this.container.innerHTML = '';
    this.container.appendChild(doc.documentElement);
    this.show();
  }

  clear() {
    this.container.innerHTML = '';
  }

  show() {
    this.container.style.visibility = 'visible';
  }

  hide() {
    this.container.style.visibility = 'hidden';
  }
}
