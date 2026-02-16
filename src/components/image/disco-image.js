import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import imageStyles from './disco-image.scss';
import '../progress-bar/disco-progress-bar.js';

class DiscoImage extends DiscoUIElement {
  static get observedAttributes() {
    return ['src', 'alt', 'fit', 'ratio'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(imageStyles, this.shadowRoot);

    this._frame = document.createElement('div');
    this._frame.className = 'frame';

    this._imgA = document.createElement('img');
    this._imgA.className = 'image-layer';

    this._imgB = document.createElement('img');
    this._imgB.className = 'image-layer';

    this._loadingBar = document.createElement('disco-progress-bar');
    this._loadingBar.className = 'loading-bar';
    this._loadingBar.setAttribute('indeterminate', '');

    this._frame.append(this._imgA, this._imgB, this._loadingBar);
    this.shadowRoot.appendChild(this._frame);

    this._images = [this._imgA, this._imgB];
    this._activeIndex = -1;
    this._loadToken = 0;
    this._intrinsicRatio = '';
    this._loadingVisualToken = 0;
  }

  connectedCallback() {
    this._syncFit();
    this._syncAlt();
    this._syncAspectRatio();
    this._loadFromAttribute();
  }

  attributeChangedCallback(name) {
    if (name === 'fit') {
      this._syncFit();
      return;
    }
    if (name === 'alt') {
      this._syncAlt();
      return;
    }
    if (name === 'ratio') {
      this._syncAspectRatio();
      return;
    }
    if (name === 'src') {
      this._loadFromAttribute();
    }
  }

  get src() {
    return this.getAttribute('src') || '';
  }

  set src(value) {
    if (value == null || value === '') {
      this.removeAttribute('src');
      return;
    }
    this.setAttribute('src', String(value));
  }

  get alt() {
    return this.getAttribute('alt') || '';
  }

  set alt(value) {
    if (value == null || value === '') {
      this.removeAttribute('alt');
      return;
    }
    this.setAttribute('alt', String(value));
  }

  get fit() {
    const value = (this.getAttribute('fit') || '').toLowerCase();
    if (value === 'contain' || value === 'cover' || value === 'stretch') return value;
    return 'cover';
  }

  set fit(value) {
    if (!value) {
      this.removeAttribute('fit');
      return;
    }
    this.setAttribute('fit', String(value));
  }

  get ratio() {
    return this.getAttribute('ratio') || '';
  }

  set ratio(value) {
    if (value == null || value === '') {
      this.removeAttribute('ratio');
      return;
    }
    this.setAttribute('ratio', String(value));
  }

  _syncFit() {
    const fit = this.fit;
    const objectFit = fit === 'stretch' ? 'fill' : fit;
    this._images.forEach((image) => {
      image.style.objectFit = objectFit;
    });
  }

  _syncAspectRatio() {
    if (this.ratio) {
      this.style.aspectRatio = this.ratio;
      return;
    }

    if (this._intrinsicRatio) {
      this.style.aspectRatio = this._intrinsicRatio;
      return;
    }

    this.style.removeProperty('aspect-ratio');
  }

  _syncAlt() {
    const alt = this.alt;
    this._images.forEach((image) => {
      image.alt = alt;
    });
  }

  _loadFromAttribute() {
    const src = this.src;
    if (!src) {
      this._loadToken += 1;
      this._hideLoadingBar();
      this._images.forEach((image) => {
        image.classList.remove('active');
        image.removeAttribute('src');
      });
      this._activeIndex = -1;
      this._intrinsicRatio = '';
      this._syncAspectRatio();
      return;
    }

    this._showLoadingBar();

    const token = ++this._loadToken;
    const targetIndex = this._activeIndex === 0 ? 1 : 0;
    const target = this._images[targetIndex];
    target.classList.remove('active');
    target.alt = this.alt;

    target.onload = () => {
      if (token !== this._loadToken) return;
      if (target.naturalWidth > 0 && target.naturalHeight > 0) {
        this._intrinsicRatio = `${target.naturalWidth} / ${target.naturalHeight}`;
        this._syncAspectRatio();
      }
      this._activateImage(targetIndex);
      this._hideLoadingBar();
    };

    target.onerror = () => {
      if (token !== this._loadToken) return;
      this._hideLoadingBar();
    };

    target.src = src;
  }

  _activateImage(index) {
    this._images.forEach((image, current) => {
      image.classList.toggle('active', current === index);
    });
    this._activeIndex = index;
  }

  _showLoadingBar() {
    this._loadingVisualToken += 1;
    this._loadingBar.classList.add('visible');
    if (typeof this._loadingBar.startIndeterminate === 'function') {
      this._loadingBar.startIndeterminate();
      return;
    }
    this._loadingBar.setAttribute('indeterminate', '');
  }

  _hideLoadingBar() {
    const token = ++this._loadingVisualToken;
    const finalizeHide = () => {
      if (token !== this._loadingVisualToken) return;
      this._loadingBar.classList.remove('visible');
    };

    if (typeof this._loadingBar.stopIndeterminate === 'function') {
      this._loadingBar.stopIndeterminate({ graceful: true }).then(finalizeHide, finalizeHide);
      return;
    }

    finalizeHide();
  }
}

if (!customElements.get('disco-image')) {
  customElements.define('disco-image', DiscoImage);
}

export default DiscoImage;
