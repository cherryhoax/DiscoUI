import DiscoFlyout from '../flyout/disco-flyout.js';
import dialogCss from './disco-dialog.scss';

class DiscoDialog extends DiscoFlyout {
  constructor(title = 'DIALOG') {
    super(title, title);

    this.loadStyle(dialogCss, this.shadowRoot);
      this.setAttribute('animation', 'none');
    this._buildDialog();
  }

  static get observedAttributes() {
    return [...super.observedAttributes, 'title'];
  }

  get title() {
    return this.header || 'DIALOG';
  }

  set title(value) {
    const next = typeof value === 'string' && value.trim() ? value.trim() : 'DIALOG';
    this.appTitle = next;
    this.header = next;
    this.setAttribute('app-title', next);
    this.setAttribute('header', next);
    this.setAttribute('title', next);
    if (this._dialogTitle) this._dialogTitle.textContent = next;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === 'title' && oldValue !== newValue) {
      const next = newValue || 'DIALOG';
      if (this._dialogTitle) this._dialogTitle.textContent = next;
      if (this.getAttribute('header') !== next) this.setAttribute('header', next);
      if (this.getAttribute('app-title') !== next) this.setAttribute('app-title', next);
    }
    if (name === 'header' && this._dialogTitle) {
      this._dialogTitle.textContent = this.header || 'DIALOG';
    }
  }

  open() {
    if (this._dialogStage) this._dialogStage.classList.remove('exit');
    return this.show();
  }

  async close(options) {
    if (this._isDialogClosing) return;
    this._isDialogClosing = true;

    if (this._dialogStage) {
      this._dialogStage.classList.add('exit');
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    await super.close(options);
    this._isDialogClosing = false;
  }

  _buildDialog() {
    if (!this._contentViewport) return;

    this._contentViewport.innerHTML = '';
    this._contentViewport.classList.add('dialog-viewport');

    this._dialogStage = document.createElement('div');
    this._dialogStage.className = 'dialog-stage';

    this._dialogBackdrop = document.createElement('div');
    this._dialogBackdrop.className = 'dialog-backdrop';
    this._dialogBackdrop.addEventListener('click', () => this.close());

    this._dialogPanel = document.createElement('div');
    this._dialogPanel.className = 'dialog-panel';

    this._dialogTitle = document.createElement('h1');
    this._dialogTitle.className = 'dialog-title';
    this._dialogTitle.textContent = this.title;

    this._dialogContent = document.createElement('div');
    this._dialogContent.className = 'dialog-content';

    const contentSlot = document.createElement('slot');
    this._dialogContent.appendChild(contentSlot);

    this._dialogPanel.appendChild(this._dialogTitle);
    this._dialogPanel.appendChild(this._dialogContent);

    this._dialogStage.appendChild(this._dialogBackdrop);
    this._dialogStage.appendChild(this._dialogPanel);

    this._contentViewport.appendChild(this._dialogStage);
  }
}

if (!customElements.get('disco-dialog')) {
  customElements.define('disco-dialog', DiscoDialog);
}

export default DiscoDialog;
