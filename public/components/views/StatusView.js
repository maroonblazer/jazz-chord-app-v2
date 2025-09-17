export class StatusView {
  constructor(statusElement, errorElement) {
    if (!statusElement || !errorElement) {
      throw new Error('StatusView requires status and error elements');
    }
    this.statusElement = statusElement;
    this.errorElement = errorElement;
  }

  setStatus(message) {
    if (message) {
      this.statusElement.textContent = message;
      this.statusElement.setAttribute('aria-hidden', 'false');
    } else {
      this.statusElement.textContent = '';
      this.statusElement.setAttribute('aria-hidden', 'true');
    }
  }

  setError(message) {
    if (message) {
      this.errorElement.textContent = message;
      this.errorElement.classList.add('visible');
    } else {
      this.errorElement.textContent = '';
      this.errorElement.classList.remove('visible');
    }
  }
}
