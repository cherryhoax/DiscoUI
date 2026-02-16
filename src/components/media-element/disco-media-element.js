import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import mediaElementStyles from './disco-media-element.scss';
import '../slider/disco-slider.js';
import '../progress-bar/disco-progress-bar.js';

class DiscoMediaElement extends DiscoUIElement {
  static get observedAttributes() {
    return ['src', 'autoplay', 'loop', 'muted', 'kind'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(mediaElementStyles, this.shadowRoot);

    this._root = document.createElement('div');
    this._root.className = 'media-root';

    this._surface = document.createElement('div');
    this._surface.className = 'media-surface';

    this._video = document.createElement('video');
    this._video.className = 'video';
    this._video.preload = 'metadata';
    this._video.playsInline = true;

    this._surface.appendChild(this._video);

    this._controls = document.createElement('div');
    this._controls.className = 'controls';

    this._loadingBar = document.createElement('disco-progress-bar');
    this._loadingBar.className = 'loading-bar';
    this._loadingBar.setAttribute('indeterminate', '');

    this._playButton = document.createElement('button');
    this._playButton.className = 'icon-button play-button';
    this._playButton.type = 'button';
    this._playButton.setAttribute('aria-label', 'Play');

    this._seek = document.createElement('disco-slider');
    this._seek.className = 'seek-slider';
    this._seek.min = '0';
    this._seek.max = '100';
    this._seek.step = '0.01';
    this._seek.value = '0';

    this._time = document.createElement('span');
    this._time.className = 'time';
    this._time.textContent = '0:00 / 0:00';

    this._volumeButton = document.createElement('button');
    this._volumeButton.className = 'icon-button volume-button';
    this._volumeButton.type = 'button';
    this._volumeButton.setAttribute('aria-label', 'Volume');

    this._volumeFlyout = document.createElement('div');
    this._volumeFlyout.className = 'volume-flyout';
    ['pointerdown', 'click', 'touchstart', 'mousedown'].forEach((eventName) => {
      this._volumeFlyout.addEventListener(eventName, (event) => {
        event.stopPropagation();
      });
    });
    this._volumeFlyout.addEventListener('pointermove', (event) => {
      event.stopPropagation();
    });
    this._volumeFlyout.addEventListener('touchmove', (event) => {
      event.stopPropagation();
      event.preventDefault();
    }, { passive: false });

    this._volumeSlider = document.createElement('disco-slider');
    this._volumeSlider.className = 'volume-slider';
    this._volumeSlider.min = '0';
    this._volumeSlider.max = '100';
    this._volumeSlider.step = '1';
    this._volumeSlider.value = '100';
    this._volumeSlider.style.setProperty('--disco-slider-step-overlay-opacity', '0');
    this._volumeSlider.style.touchAction = 'none';
    this._volumeSlider.style.width = '110px';
    this._volumeSlider.style.transform = 'rotate(-90deg)';
    this._volumeSlider.style.transformOrigin = 'center';
    this._volumeSlider.style.margin = '40px 0';

    this._volumePercent = document.createElement('div');
    this._volumePercent.className = 'volume-percent';
    this._volumePercent.textContent = '100%';

    this._volumeFlyout.append(this._volumeSlider, this._volumePercent);

    this._audio = document.createElement('audio');
    this._audio.preload = 'metadata';

    this._controls.append(this._playButton, this._seek, this._time, this._volumeButton);
    this._root.append(this._loadingBar, this._surface, this._controls);
    this.shadowRoot.append(this._root, this._audio);

    this._applyVolumeFlyoutPortalStyle();

    this._seeking = false;
    this._volumeOpen = false;
    this._activeMedia = this._audio;
    this._loadingVisible = false;
    this._loadingVisualToken = 0;
    this._controlsHidden = false;
    this._controlsAutoHideTimer = null;
    this._volumeFlyoutPushedState = false;
    this._volumeFlyoutPopStateListener = null;
    this._volumeFlyoutAnimationToken = 0;
    this._lastSyncedSrc = null;
    this._lastSyncedKind = null;

    this._onDocumentPointerDown = this._onDocumentPointerDown.bind(this);
    this._onDocumentKeyDown = this._onDocumentKeyDown.bind(this);
    this._onSurfaceClick = this._onSurfaceClick.bind(this);
    this._onWindowResize = this._onWindowResize.bind(this);

    this._surface.addEventListener('click', this._onSurfaceClick);

    this._playButton.addEventListener('click', () => {
      if (this._activeMedia.paused || this._activeMedia.ended) {
        this.play();
      } else {
        this.pause();
      }
    });

    this._volumeButton.addEventListener('click', () => {
      if (this._volumeOpen) {
        this.muted = !this.muted;
      } else {
        this._setVolumeFlyoutOpen(true);
      }
    });

    this._seek.addEventListener('input', () => {
      this._seeking = true;
      const duration = Number.isFinite(this._activeMedia.duration) ? this._activeMedia.duration : 0;
      const next = Number(this._seek.value);
      if (duration > 0) {
        this._activeMedia.currentTime = Math.max(0, Math.min(duration, next));
      }
      this._syncTime();
    });

    this._seek.addEventListener('change', () => {
      this._seeking = false;
      this._syncTime();
    });

    this._volumeSlider.addEventListener('input', () => {
      this._applyVolumeFromSlider();
    });

    this._onVolumePointerDown = this._onVolumePointerDown.bind(this);
    this._onVolumePointerMove = this._onVolumePointerMove.bind(this);
    this._onVolumePointerEnd = this._onVolumePointerEnd.bind(this);
    this._volumeDragPointerId = null;
    this._volumeSlider.addEventListener('pointerdown', this._onVolumePointerDown);

    this._bindMediaEvents(this._audio);
    this._bindMediaEvents(this._video);

    this._audio.volume = 1;
    this._video.volume = 1;
    this._syncPlayIcon();
    this._syncVolume();
  }

  connectedCallback() {
    this._syncFromAttributes();
    document.addEventListener('pointerdown', this._onDocumentPointerDown, true);
    document.addEventListener('keydown', this._onDocumentKeyDown);
  }

  disconnectedCallback() {
    this._setVolumeFlyoutOpen(false, { skipHistory: true });
    this._volumeSlider.removeEventListener('pointerdown', this._onVolumePointerDown);
    this._removeVolumePointerTracking();
    if (document.body.contains(this._volumeFlyout)) {
      this._volumeFlyout.remove();
    }
    document.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
    document.removeEventListener('keydown', this._onDocumentKeyDown);
    this._clearControlsAutoHide();
  }

  attributeChangedCallback() {
    this._syncFromAttributes();
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

  get muted() {
    return this.hasAttribute('muted');
  }

  set muted(next) {
    if (next) {
      this.setAttribute('muted', '');
    } else {
      this.removeAttribute('muted');
    }
  }

  get kind() {
    return (this.getAttribute('kind') || 'auto').toLowerCase();
  }

  set kind(value) {
    if (!value) {
      this.removeAttribute('kind');
      return;
    }
    this.setAttribute('kind', String(value));
  }

  play() {
    return this._activeMedia.play();
  }

  pause() {
    this._activeMedia.pause();
  }

  _syncFromAttributes() {
    const src = this.src;
    const targetKind = this._resolveKind(src);
    const sourceOrKindChanged = src !== this._lastSyncedSrc || targetKind !== this._lastSyncedKind;

    if (sourceOrKindChanged) {
      this._setMediaKind(targetKind);

      const active = this._activeMedia;
      const inactive = active === this._audio ? this._video : this._audio;

      if (src) {
        this._setLoadingBarVisible(true);
        active.src = src;
        active.load();
        inactive.removeAttribute('src');
        inactive.load();
        this._syncSeekBounds();
        this._syncTime();
      } else {
        active.removeAttribute('src');
        active.load();
        inactive.removeAttribute('src');
        inactive.load();
        this._setLoadingBarVisible(false);
      }

      this._lastSyncedSrc = src;
      this._lastSyncedKind = targetKind;
    }

    this._audio.autoplay = this.hasAttribute('autoplay');
    this._video.autoplay = this.hasAttribute('autoplay');
    this._audio.loop = this.hasAttribute('loop');
    this._video.loop = this.hasAttribute('loop');
    this._audio.muted = this.muted;
    this._video.muted = this.muted;
    this._syncPlayIcon();
    this._syncVolume();
  }

  _bindMediaEvents(media) {
    media.addEventListener('loadedmetadata', () => {
      if (media !== this._activeMedia) return;
      this._syncSeekBounds();
      this._syncTime();
    });

    media.addEventListener('durationchange', () => {
      if (media !== this._activeMedia) return;
      this._syncSeekBounds();
      this._syncTime();
    });

    media.addEventListener('timeupdate', () => {
      if (media !== this._activeMedia) return;
      if (!this._seeking) {
        this._seek.value = String(media.currentTime || 0);
      }
      this._syncTime();
    });

    media.addEventListener('play', () => {
      if (media !== this._activeMedia) return;
      this._syncPlayIcon();
      this._setLoadingBarVisible(false);
      this._setControlsHidden(false);
      this._scheduleControlsAutoHide();
    });

    media.addEventListener('pause', () => {
      if (media !== this._activeMedia) return;
      this._syncPlayIcon();
      this._clearControlsAutoHide();
      this._setControlsHidden(false);
    });

    media.addEventListener('volumechange', () => {
      if (media !== this._activeMedia) return;
      this._syncVolume();
    });

    media.addEventListener('ended', () => {
      if (media !== this._activeMedia) return;
      this._syncPlayIcon();
      this._setLoadingBarVisible(false);
      this._clearControlsAutoHide();
      this._setControlsHidden(false);
    });

    media.addEventListener('loadstart', () => {
      if (media !== this._activeMedia) return;
      this._setLoadingBarVisible(true);
    });

    media.addEventListener('waiting', () => {
      if (media !== this._activeMedia) return;
      this._setLoadingBarVisible(true);
      this._clearControlsAutoHide();
      this._setControlsHidden(false);
    });

    media.addEventListener('stalled', () => {
      if (media !== this._activeMedia) return;
      this._setLoadingBarVisible(true);
      this._clearControlsAutoHide();
      this._setControlsHidden(false);
    });

    media.addEventListener('seeking', () => {
      if (media !== this._activeMedia) return;
      this._setLoadingBarVisible(true);
      this._clearControlsAutoHide();
      this._setControlsHidden(false);
    });

    media.addEventListener('playing', () => {
      if (media !== this._activeMedia) return;
      this._setLoadingBarVisible(false);
      this._syncPlayIcon();
      this._scheduleControlsAutoHide();
    });

    media.addEventListener('canplay', () => {
      if (media !== this._activeMedia) return;
      this._setLoadingBarVisible(false);
      this._scheduleControlsAutoHide();
    });

    media.addEventListener('canplaythrough', () => {
      if (media !== this._activeMedia) return;
      this._setLoadingBarVisible(false);
      this._scheduleControlsAutoHide();
    });

    media.addEventListener('seeked', () => {
      if (media !== this._activeMedia) return;
      this._setLoadingBarVisible(false);
      this._scheduleControlsAutoHide();
    });
  }

  _resolveKind(src) {
    const explicit = this.kind;
    if (explicit === 'audio' || explicit === 'video') return explicit;
    if (!src) return 'audio';
    return /\.(mp4|webm|ogv|m4v|mov)(?:$|[?#])/i.test(src) ? 'video' : 'audio';
  }

  _setMediaKind(nextKind) {
    const normalized = nextKind === 'video' ? 'video' : 'audio';
    const nextMedia = normalized === 'video' ? this._video : this._audio;
    if (this._activeMedia === nextMedia) {
      this._root.classList.toggle('is-video', normalized === 'video');
      if (normalized !== 'video') {
        this._clearControlsAutoHide();
        this._setControlsHidden(false);
      }
      return;
    }

    const currentTime = Number.isFinite(this._activeMedia.currentTime) ? this._activeMedia.currentTime : 0;
    const volume = this._activeMedia.volume;
    const muted = this._activeMedia.muted;
    this._activeMedia.pause();

    this._activeMedia = nextMedia;
    this._activeMedia.volume = Number.isFinite(volume) ? volume : 1;
    this._activeMedia.muted = this.hasAttribute('muted') ? true : muted;
    if (currentTime > 0) {
      try {
        this._activeMedia.currentTime = currentTime;
      } catch (_error) {
      }
    }

    this._root.classList.toggle('is-video', normalized === 'video');
    if (normalized === 'video') {
      this._setControlsHidden(false);
      this._scheduleControlsAutoHide();
    } else {
      this._clearControlsAutoHide();
      this._setControlsHidden(false);
    }
    this._syncSeekBounds();
    this._syncTime();
    this._syncPlayIcon();
    this._syncVolume();
  }

  _syncSeekBounds() {
    const duration = Number.isFinite(this._activeMedia.duration) && this._activeMedia.duration > 0 ? this._activeMedia.duration : 0;
    this._seek.max = String(duration || 100);
    if (!this._seeking) {
      this._seek.value = String(this._activeMedia.currentTime || 0);
    }
  }

  _syncTime() {
    const current = Number.isFinite(this._activeMedia.currentTime) ? this._activeMedia.currentTime : 0;
    const duration = Number.isFinite(this._activeMedia.duration) && this._activeMedia.duration > 0 ? this._activeMedia.duration : 0;
    this._time.textContent = `${this._formatTime(current)} / ${this._formatTime(duration)}`;
  }

  _syncPlayIcon() {
    const paused = this._activeMedia.paused || this._activeMedia.ended;
    this._playButton.innerHTML = paused
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"></path></svg>';
    this._playButton.setAttribute('aria-label', paused ? 'Play' : 'Pause');
  }

  _syncVolume() {
    const media = this._activeMedia;
    const percent = media.muted ? 0 : Math.round((media.volume || 0) * 100);
    this._volumeSlider.value = String(percent);
    this._volumePercent.textContent = `${percent}%`;

    this._volumeButton.innerHTML = media.muted
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h4l5 5V5L7 10H3z"></path><path d="M14.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"></path></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h4l5 5V5L7 10H3z"></path><path d="M14 9a4 4 0 010 6m2-8a7 7 0 010 10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"></path></svg>';
  }

  _applyVolumeFromSlider() {
    const value = Number(this._volumeSlider.value);
    const normalized = Math.max(0, Math.min(100, value)) / 100;
    this._audio.volume = normalized;
    this._video.volume = normalized;
    if ((this._audio.muted || this._video.muted) && normalized > 0) {
      this._audio.muted = false;
      this._video.muted = false;
    }
    this._syncVolume();
  }

  _onVolumePointerDown(event) {
    if (!this._volumeOpen) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    this._volumeDragPointerId = event.pointerId;
    this._setVolumeFromPointer(event.clientY);

    window.addEventListener('pointermove', this._onVolumePointerMove, true);
    window.addEventListener('pointerup', this._onVolumePointerEnd, true);
    window.addEventListener('pointercancel', this._onVolumePointerEnd, true);
  }

  _onVolumePointerMove(event) {
    if (this._volumeDragPointerId == null || event.pointerId !== this._volumeDragPointerId) return;
    event.preventDefault();
    this._setVolumeFromPointer(event.clientY);
  }

  _onVolumePointerEnd(event) {
    if (this._volumeDragPointerId == null || event.pointerId !== this._volumeDragPointerId) return;
    event.preventDefault();
    this._setVolumeFromPointer(event.clientY);
    this._removeVolumePointerTracking();
  }

  _removeVolumePointerTracking() {
    this._volumeDragPointerId = null;
    window.removeEventListener('pointermove', this._onVolumePointerMove, true);
    window.removeEventListener('pointerup', this._onVolumePointerEnd, true);
    window.removeEventListener('pointercancel', this._onVolumePointerEnd, true);
  }

  _setVolumeFromPointer(clientY) {
    const rect = this._volumeSlider.getBoundingClientRect();
    if (!Number.isFinite(rect.height) || rect.height <= 0) return;

    const min = Number(this._volumeSlider.min || 0);
    const max = Number(this._volumeSlider.max || 100);
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) && max > safeMin ? max : 100;
    const rawRatio = (rect.bottom - clientY) / rect.height;
    const ratio = Math.max(0, Math.min(1, rawRatio));
    let nextValue = safeMin + ratio * (safeMax - safeMin);

    const step = Number(this._volumeSlider.step || 1);
    if (Number.isFinite(step) && step > 0) {
      const steps = Math.round((nextValue - safeMin) / step);
      nextValue = safeMin + steps * step;
    }

    nextValue = Math.max(safeMin, Math.min(safeMax, nextValue));
    this._volumeSlider.value = String(nextValue);
    this._applyVolumeFromSlider();
  }

  _setLoadingBarVisible(next) {
    const shouldShow = Boolean(next);
    if (shouldShow === this._loadingVisible) {
      return;
    }

    if (shouldShow) {
      this._loadingVisible = true;
      this._loadingVisualToken += 1;
      this._loadingBar.classList.add('visible');
      if (typeof this._loadingBar.startIndeterminate === 'function') {
        this._loadingBar.startIndeterminate();
      } else {
        this._loadingBar.setAttribute('indeterminate', '');
      }
      return;
    }

    this._loadingVisible = false;
    const token = ++this._loadingVisualToken;
    const finalizeHide = () => {
      if (token !== this._loadingVisualToken || this._loadingVisible) return;
      this._loadingBar.classList.remove('visible');
    };

    if (typeof this._loadingBar.stopIndeterminate === 'function') {
      this._loadingBar.stopIndeterminate({ graceful: true }).then(finalizeHide, finalizeHide);
      return;
    }

    finalizeHide();
  }

  _isVideoMode() {
    return this._root.classList.contains('is-video');
  }

  _setControlsHidden(next) {
    this._controlsHidden = Boolean(next) && this._isVideoMode();
    this._root.classList.toggle('controls-hidden', this._controlsHidden);
    if (this._controlsHidden && this._volumeOpen) {
      this._setVolumeFlyoutOpen(false);
    }
  }

  _scheduleControlsAutoHide() {
    this._clearControlsAutoHide();
    if (!this._isVideoMode()) return;
    if (this._activeMedia.paused || this._activeMedia.ended) return;
    if (this._controlsHidden) return;

    this._controlsAutoHideTimer = window.setTimeout(() => {
      this._controlsAutoHideTimer = null;
      if (!this._isVideoMode()) return;
      if (this._activeMedia.paused || this._activeMedia.ended) return;
      this._setControlsHidden(true);
    }, 2200);
  }

  _clearControlsAutoHide() {
    if (this._controlsAutoHideTimer == null) return;
    window.clearTimeout(this._controlsAutoHideTimer);
    this._controlsAutoHideTimer = null;
  }

  _setVolumeFlyoutOpen(next) {
    const options = arguments[1] || {};
    const fromPopState = Boolean(options.fromPopState);
    const skipHistory = Boolean(options.skipHistory);
    const shouldOpen = Boolean(next);

    if (shouldOpen === this._volumeOpen) {
      if (shouldOpen) this._positionVolumeFlyoutPortal();
      return;
    }

    this._volumeOpen = shouldOpen;
    this._root.classList.toggle('volume-open', this._volumeOpen);
    const animationToken = ++this._volumeFlyoutAnimationToken;

    if (shouldOpen) {
      this._volumeFlyout.getAnimations().forEach((animation) => animation.cancel());
      if (!document.body.contains(this._volumeFlyout)) {
        document.body.appendChild(this._volumeFlyout);
      }
      this._volumeFlyout.style.display = 'flex';
      this._positionVolumeFlyoutPortal();
      this._volumeFlyout.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 180,
          easing: this._getDiscoEasingVar('--disco-ease-out-circ', 'ease-out'),
          fill: 'both'
        }
      );

      window.addEventListener('resize', this._onWindowResize);

      if (!skipHistory) {
        window.history.pushState({ mediaVolumeFlyoutId: Math.random().toString(36) }, '', window.location.href);
        this._volumeFlyoutPushedState = true;
        this._volumeFlyoutPopStateListener = () => {
          this._setVolumeFlyoutOpen(false, { fromPopState: true, skipHistory: true });
        };
        window.addEventListener('popstate', this._volumeFlyoutPopStateListener, { once: true });
      }

      return;
    }

    window.removeEventListener('resize', this._onWindowResize);

    const finalizeClose = () => {
      if (animationToken !== this._volumeFlyoutAnimationToken || this._volumeOpen) return;
      if (document.body.contains(this._volumeFlyout)) {
        this._volumeFlyout.remove();
      }
      this._volumeFlyout.style.display = 'none';
      this._volumeFlyout.style.opacity = '';
      this._volumeFlyout.style.transform = '';
      this._volumeFlyout.style.visibility = 'visible';
    };

    if (document.body.contains(this._volumeFlyout)) {
      this._volumeFlyout.getAnimations().forEach((animation) => animation.cancel());
      const outAnimation = this._volumeFlyout.animate(
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(8px)' }
        ],
        {
          duration: 140,
          easing: this._getDiscoEasingVar('--disco-ease-in-circ', 'ease-in'),
          fill: 'both'
        }
      );
      outAnimation.finished.then(finalizeClose, finalizeClose);
    } else {
      finalizeClose();
    }

    if (this._volumeFlyoutPopStateListener) {
      window.removeEventListener('popstate', this._volumeFlyoutPopStateListener);
      this._volumeFlyoutPopStateListener = null;
    }

    if (this._volumeFlyoutPushedState && !fromPopState && !skipHistory) {
      this._volumeFlyoutPushedState = false;
      window.history.back();
      return;
    }

    if (fromPopState || skipHistory) {
      this._volumeFlyoutPushedState = false;
    }
  }

  _onDocumentPointerDown(event) {
    if (!this._volumeOpen) return;
    const path = event.composedPath();
    if (path.includes(this) || path.includes(this._volumeFlyout)) return;
    this._setVolumeFlyoutOpen(false);
  }

  _onDocumentKeyDown(event) {
    if (event.key === 'Escape' && this._volumeOpen) {
      this._setVolumeFlyoutOpen(false);
    }
  }

  _onSurfaceClick() {
    if (!this._isVideoMode()) return;

    const nextHidden = !this._controlsHidden;
    this._setControlsHidden(nextHidden);
    if (nextHidden) {
      this._clearControlsAutoHide();
      return;
    }

    this._scheduleControlsAutoHide();
  }

  _onWindowResize() {
    if (!this._volumeOpen) return;
    this._positionVolumeFlyoutPortal();
  }

  _applyVolumeFlyoutPortalStyle() {
    this._volumeFlyout.style.setProperty('--disco-theme', '1');
    this._volumeFlyout.style.setProperty('--disco-background', 'rgb(255 255 255)');
    this._volumeFlyout.style.setProperty('--disco-background-secondary', 'rgb(221 221 221)');
    this._volumeFlyout.style.setProperty('--disco-background-tertiary', 'rgb(190 190 190)');
    this._volumeFlyout.style.setProperty('--disco-foreground', 'rgb(0 0 0)');
    this._volumeFlyout.style.position = 'fixed';
    this._volumeFlyout.style.width = '72px';
    this._volumeFlyout.style.minHeight = '180px';
    this._volumeFlyout.style.padding = '10px';
    this._volumeFlyout.style.display = 'none';
    this._volumeFlyout.style.flexDirection = 'column';
    this._volumeFlyout.style.alignItems = 'center';
    this._volumeFlyout.style.justifyContent = 'flex-end';
    this._volumeFlyout.style.gap = '8px';
    this._volumeFlyout.style.border = '3px solid #000';
    this._volumeFlyout.style.background = '#fff';
    this._volumeFlyout.style.color = '#000';
    this._volumeFlyout.style.boxSizing = 'border-box';
    this._volumeFlyout.style.zIndex = '10000';
  }

  _positionVolumeFlyoutPortal() {
    if (!this._volumeButton) return;

    const triggerRect = this._volumeButton.getBoundingClientRect();
    this._volumeFlyout.style.visibility = 'hidden';
    this._volumeFlyout.style.left = '0px';
    this._volumeFlyout.style.top = '0px';

    const flyoutRect = this._volumeFlyout.getBoundingClientRect();
    const gap = 8;
    const minInset = 8;

    let left = triggerRect.right - flyoutRect.width;
    left = Math.max(minInset, Math.min(left, window.innerWidth - flyoutRect.width - minInset));

    let top = triggerRect.top - flyoutRect.height - gap;
    if (top < minInset) {
      top = triggerRect.bottom + gap;
    }
    top = Math.max(minInset, Math.min(top, window.innerHeight - flyoutRect.height - minInset));

    this._volumeFlyout.style.left = `${left}px`;
    this._volumeFlyout.style.top = `${top}px`;
    this._volumeFlyout.style.visibility = 'visible';
  }

  _getDiscoEasingVar(name, fallback) {
    const hostValue = getComputedStyle(this).getPropertyValue(name).trim();
    if (hostValue) return hostValue;
    const rootValue = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return rootValue || fallback;
  }

  _formatTime(value) {
    const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
}

if (!customElements.get('disco-media-element')) {
  customElements.define('disco-media-element', DiscoMediaElement);
}

export default DiscoMediaElement;
