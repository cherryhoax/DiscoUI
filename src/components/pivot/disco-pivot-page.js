import DiscoPage from '../disco-page.js';
import pivotPageCss from './disco-pivot-page.css';

class DiscoPivotPage extends DiscoPage {
  /**
   * @param {string} [appTitle]
   */
  constructor(appTitle = 'DISCO APP') {
    super();
    this.appTitle = appTitle;
    this.attachShadow({ mode: 'open' });
    this.loadStyle(pivotPageCss, this.shadowRoot);
    this._container = document.createElement('div');
    this._container.className = 'pivot-shell';
    this.shadowRoot.appendChild(this._container);
    this.render();
  }

  /**
   * @returns {void}
   */
  connectedCallback() {
    this.renderHeaders();
    this.setupScrollSync();
    // Defer initial jump until layout is ready so we don't land on the leading ghost.
    requestAnimationFrame(() => this.jumpToFirstPage());
  }

  /**
   * @returns {void}
   */
  render() {
    if (!this.shadowRoot || !this._container) return;
    this._container.innerHTML = `
      <div class="pivot-root">
        <div class="app-title">${this.appTitle}</div>
        <div class="header-strip" id="headerStrip"></div>
        <div class="content-viewport" id="viewport">
          <div class="ghost ghost-start"></div>
          <slot></slot>
          <div class="ghost ghost-end"></div>
        </div>
      </div>
    `;
  }

  /**
   * @returns {void}
   */
  renderHeaders() {
    const strip = this.shadowRoot?.getElementById('headerStrip');
    const viewport = this.shadowRoot?.getElementById('viewport');
    if (!strip || !viewport) return;

    const items = Array.from(this.querySelectorAll('disco-pivot-item'));
    strip.innerHTML = '';

    // Leading clone of last header to support last->first continuity
    if (items.length > 0) {
      const last = items[items.length - 1];
      const clone = document.createElement('div');
      clone.className = 'header-item';
      clone.dataset.index = `${items.length - 1}`;
      clone.dataset.clone = 'leading';
      clone.dataset.real = 'false';
      clone.textContent = last.getAttribute('header') || `item ${items.length}`;
      clone.style.opacity = '0.5';
      clone.onclick = () => {
        const span = this.getPageSpan(viewport);
        viewport.scrollTo({ left: items.length * span, behavior: 'smooth' });
      };
      strip.appendChild(clone);
    }

    // Build first real set
    items.forEach((item, i) => {
      const h = document.createElement('div');
      h.className = 'header-item';
      h.dataset.index = `${i}`;
      h.dataset.real = 'true';
      h.textContent = item.getAttribute('header') || `item ${i + 1}`;
      h.style.opacity = i === 0 ? '1' : '0.5';
      h.onclick = () => {
        const span = this.getPageSpan(viewport);
        viewport.scrollTo({ left: (i + 1) * span, behavior: 'smooth' });
      };
      strip.appendChild(h);
    });

    // Measure single set width, then append repeats to enable scrolling room.
    const repeats = 3;
    this._headerRepeats = repeats;

    requestAnimationFrame(() => {
      // Append repeats after measuring baseline widths (measure function will recompute live each time).
      for (let r = 1; r < repeats; r += 1) {
        items.forEach((item, i) => {
          const h = document.createElement('div');
          h.className = 'header-item';
          h.dataset.index = `${i}`;
          h.dataset.real = 'repeat';
          h.textContent = item.getAttribute('header') || `item ${i + 1}`;
          h.style.opacity = '0.5';
          h.onclick = () => {
            const span = this.getPageSpan(viewport);
            viewport.scrollTo({ left: (i + 1) * span, behavior: 'smooth' });
          };
          strip.appendChild(h);
        });
      }
    });
  }

  /**
   * @returns {void}
   */
  jumpToFirstPage() {
    const viewport = this.shadowRoot?.getElementById('viewport');
    if (!viewport) return;
    const span = this.getPageSpan ? this.getPageSpan(viewport) : (viewport.clientWidth || 1);
    const prevBehavior = viewport.style.scrollBehavior;
    viewport.style.scrollBehavior = 'auto';
    viewport.scrollLeft = span;
    viewport.style.scrollBehavior = prevBehavior || 'smooth';
  }

  /**
   * @returns {void}
   */
  setupScrollSync() {
    const viewport = this.shadowRoot?.getElementById('viewport');
    const strip = this.shadowRoot?.getElementById('headerStrip');
    if (!viewport || !strip) return;

    const items = () => Array.from(this.querySelectorAll('disco-pivot-item'));
    const measureHeaders = () => {
      const headersAll = Array.from(strip.children).map((el) => /** @type {HTMLElement} */ (el));
      const styles = getComputedStyle(strip);
      const gapVal = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      const realHeaders = headersAll.filter((h) => h.dataset.real === 'true');
      const leadingClone = headersAll.find((h) => h.dataset.clone === 'leading');

      const offsets = [0];
      realHeaders.forEach((el, i) => {
        const prev = offsets[i];
        offsets.push(prev + el.offsetWidth + (i < realHeaders.length - 1 ? gapVal : 0));
      });

      const baseOffset = leadingClone ? leadingClone.offsetWidth + gapVal : 0;
      const totalWidth = baseOffset + (offsets[offsets.length - 1] || 1);
      return { offsets, totalWidth, gapVal, baseOffset };
    };
    const getPageSpan = (vp = viewport) => {
      const width = vp.clientWidth || 1;
      const first = items()[0];
      const mr = first ? parseFloat(getComputedStyle(first).marginRight || '0') || 0 : 0;
      return width + mr;
    };
    this.getPageSpan = getPageSpan;

    viewport.addEventListener('scroll', () => {
      let scrollX = viewport.scrollLeft;
      const pageSpan = getPageSpan();
      const headers = Array.from(strip.children).map((el) => /** @type {HTMLElement} */ (el));
      const count = items().length || 1;
      if (count === 0) return;

      const totalRealSpan = count * pageSpan;
      const leadingOffset = pageSpan; // after first ghost
      const trailingStart = leadingOffset + totalRealSpan; // start of trailing ghost

      const disableSmooth = () => {
        const prev = viewport.style.scrollBehavior;
        viewport.style.scrollBehavior = 'auto';
        return prev;
      };

      let snapRestoreRaf = null;
      const withSnapDisabled = (fn) => {
        const prevSnap = viewport.style.scrollSnapType;
        viewport.style.scrollSnapType = 'none';
        fn();
        // Ensure snap always comes back, even across rapid teleports.
        if (snapRestoreRaf) cancelAnimationFrame(snapRestoreRaf);
        snapRestoreRaf = requestAnimationFrame(() => {
          snapRestoreRaf = requestAnimationFrame(() => {
            viewport.style.scrollSnapType = prevSnap && prevSnap !== 'none' ? prevSnap : 'x mandatory';
          });
        });
      };

      // Teleport when entering the teleport zones (second half of leading ghost, first half of trailing ghost).
      if (scrollX <= pageSpan * 0.5) {
        const prev = disableSmooth();
        withSnapDisabled(() => {
          viewport.scrollLeft = scrollX + totalRealSpan;
        });
        viewport.style.scrollBehavior = prev || 'smooth';
        return;
      }

      if (scrollX >= trailingStart - pageSpan * 0.5) {
        const prev = disableSmooth();
        withSnapDisabled(() => {
          viewport.scrollLeft = scrollX - totalRealSpan;
        });
        viewport.style.scrollBehavior = prev || 'smooth';
        return;
      }

      // Map page scroll to header scroll distance based on measured header widths.
      const { offsets, totalWidth: headerSetWidth, baseOffset } = measureHeaders();
      const repeats = this._headerRepeats || 1;
      const maxScrollable = Math.max(headerSetWidth * repeats - strip.clientWidth, 0);

      // If we're in the leading ghost (before the first real page), interpolate across the clone width.
      if (scrollX < leadingOffset) {
        const ratio = Math.max(0, Math.min(scrollX / leadingOffset, 1));
        const headerPos = Math.min(baseOffset * ratio, maxScrollable);
        const currentIndexGhost = count - 1; // last title clone
        strip.scrollLeft = headerPos;
        headers.forEach((h) => {
          const idx = Number(h.dataset.index || 0);
          h.style.opacity = idx === currentIndexGhost ? '1' : '0.5';
          h.style.transform = 'none';
        });
        return;
      }

      // Adjust for leading ghost to compute active index.
      const effective = Math.max(scrollX - leadingOffset, 0);
      const currentIndex = Math.round(effective / pageSpan) % count;

      const pagePos = effective / pageSpan; // pages scrolled (can be fractional)

      // Use live measured widths + uniform gap for precise interpolation per page.
      const clampedBase = Math.max(0, Math.min(Math.floor(pagePos), offsets.length - 2));
      const frac = pagePos - clampedBase;
      const start = offsets[clampedBase] ?? 0;
      const end = offsets[clampedBase + 1] ?? headerSetWidth;
      const headerPos = Math.min(baseOffset + start + frac * (end - start), maxScrollable);
      strip.scrollLeft = headerPos;

      headers.forEach((h) => {
        const idx = Number(h.dataset.index || 0);
        h.style.opacity = idx === currentIndex ? '1' : '0.5';
        h.style.transform = 'none'; // disable scale animation
      });
    });
  }
}

customElements.define('disco-pivot-page', DiscoPivotPage);

export default DiscoPivotPage;
