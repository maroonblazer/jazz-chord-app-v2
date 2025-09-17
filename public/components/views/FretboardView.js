export class FretboardView {
  constructor(container) {
    if (!container) {
      throw new Error('FretboardView requires a container element');
    }
    this.container = container;
  }

  render(svgString) {
    this.container.innerHTML = svgString;
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
