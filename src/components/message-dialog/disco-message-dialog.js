import DiscoDialog from '../dialog/disco-dialog.js';
import messageDialogCss from './disco-message-dialog.scss';
import '../buttons/disco-button.js';

class DiscoMessageDialog extends DiscoDialog {
  constructor(title = 'MESSAGE', message = '', actions = { ok: true }, options = {}) {
    super(title);

    this.loadStyle(messageDialogCss, this.shadowRoot);

    this._unsafe = Boolean(options?.unsafe);
    this._resolveSelection = null;
    this._openPromise = null;
    this._skipResolveOnClose = false;

    this.message = message;
    this.setActions(actions);
  }

  get message() {
    return this._message || '';
  }

  set message(value) {
    this._message = value == null ? '' : String(value);
    if (!this._messageEl) {
      this._messageEl = document.createElement(this._unsafe ? 'div' : 'p');
      this._messageEl.className = 'message-dialog-body';
      this._actionsEl = document.createElement('div');
      this._actionsEl.className = 'message-dialog-actions';
      this._dialogContent.replaceChildren(this._messageEl, this._actionsEl);
    }

    if (this._unsafe) this._messageEl.innerHTML = this._message;
    else this._messageEl.textContent = this._message;
  }

  setActions(actions = { ok: true }) {
    this._actions = actions && typeof actions === 'object' ? actions : { ok: true };
    if (!this._actionsEl) return;

    this._actionsEl.innerHTML = '';

    Object.entries(this._actions).forEach(([label, action]) => {
      const button = document.createElement('disco-button');
      button.className = 'message-dialog-action';
      button.setAttribute('flat', '');
      button.setAttribute('block', '');
      button.textContent = label;

      button.addEventListener('disco-press', async () => {
        let result = action;
        if (typeof action === 'function') {
          result = await action();
        }
        if (result === false) return;
        this._confirmSelection(result == null ? label : result);
      });

      this._actionsEl.appendChild(button);
    });

    this._actionsEl.classList.toggle('inline', this._actionsEl.childElementCount === 2);
  }

  open() {
    if (this._openPromise) return this._openPromise;

    this._openPromise = new Promise((resolve) => {
      this._resolveSelection = resolve;
    });

    this.show();
    return this._openPromise;
  }

  async close(options) {
    if (this._resolveSelection && !this._skipResolveOnClose) {
      this._resolveOnce(null);
    }
    this._skipResolveOnClose = false;
    await super.close(options);
  }

  _confirmSelection(value) {
    this._skipResolveOnClose = true;
    this._resolveOnce(value);
    this.close();
  }

  _resolveOnce(value) {
    if (!this._resolveSelection) return;
    const resolver = this._resolveSelection;
    this._resolveSelection = null;
    this._openPromise = null;
    resolver(value);
  }
}

if (!customElements.get('disco-message-dialog')) {
  customElements.define('disco-message-dialog', DiscoMessageDialog);
}

export default DiscoMessageDialog;
