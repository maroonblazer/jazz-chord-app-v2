export class ResultsView {
  constructor(container, stateManager) {
    if (!container) {
      throw new Error('ResultsView requires a container element');
    }
    this.container = container;
    this.stateManager = stateManager;
  }

  render(analysisResults = []) {
    this.container.innerHTML = '';

    const header = document.createElement('h3');
    header.textContent = 'Drill These Chord Shapes:';
    this.container.appendChild(header);

    const list = document.createElement('ul');
    list.setAttribute('tabindex', '0');
    list.style.cursor = 'text';

    analysisResults.forEach((result, index) => {
      const item = document.createElement('li');
      item.innerHTML = `
        <span class="problem-number">${index + 1}</span>
        <span class="chord-info">${result.chordInfo}</span>
        <span class="time-info">${result.timeInfo}</span>
      `;
      list.appendChild(item);
    });

    list.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        this.copyResultsToClipboard(analysisResults, list);
      }
    });

    this.container.appendChild(list);
  }

  async copyResultsToClipboard(results, listElement) {
    try {
      const clipboardText = this.formatResultsForClipboard(results);
      if (!navigator.clipboard) {
        throw new Error('Clipboard API is unavailable');
      }
      await navigator.clipboard.writeText(clipboardText);
      this.flashCopiedState(listElement);
      this.setStatusMessage('Results copied to clipboard');
    } catch (error) {
      this.setErrorMessage(`Failed to copy results: ${error.message}`);
    }
  }

  formatResultsForClipboard(results) {
    return results
      .map((result, index) => `${index + 1} ${result.chordInfo} ${result.timeInfo}`)
      .join('\n');
  }

  flashCopiedState(listElement) {
    const items = listElement.querySelectorAll('li');
    items.forEach((item) => item.classList.add('copy-flash'));
    setTimeout(() => {
      items.forEach((item) => item.classList.remove('copy-flash'));
    }, 300);
  }

  setStatusMessage(message) {
    if (this.stateManager) {
      this.stateManager.updateState('ui.statusMessage', message);
      this.stateManager.updateState('ui.errorMessage', null);
    }
  }

  setErrorMessage(message) {
    if (this.stateManager) {
      this.stateManager.updateState('ui.errorMessage', message);
    }
  }
}
