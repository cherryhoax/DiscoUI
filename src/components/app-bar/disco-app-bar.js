import DiscoUIElement from '../disco-ui-element.js';
import appBarStyles from './disco-app-bar.scss';
import './disco-app-bar-ellipsis.js'; // Import the new component
import DiscoPage from '../disco-page.js';
import DiscoAnimations from '../animations/disco-animations.js';

/**
 * A Disco UI app bar element that displays icon buttons and menu items.
 * @extends DiscoUIElement
 */
class DiscoAppBar extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(appBarStyles, this.shadowRoot);

    const container = document.createElement('div');
    container.className = 'app-bar';
    
    // Top Row: Icons + Ellipsis
    const row = document.createElement('div');
    row.className = 'app-bar-row';

    const iconsContainer = document.createElement('div');
    iconsContainer.className = 'icons-container';
    const iconsSlot = document.createElement('slot');
    iconsSlot.name = 'icons';
    iconsContainer.appendChild(iconsSlot);

    // Use the encapsulated component
    const ellipsisButton = document.createElement('disco-app-bar-ellipsis');
    
    row.appendChild(iconsContainer);
    row.appendChild(ellipsisButton);

    // Menu Container
    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';
    const menuSlot = document.createElement('slot');
    menuSlot.name = 'menu';
    menuContainer.appendChild(menuSlot);

    container.appendChild(row);
    container.appendChild(menuContainer);
    this.shadowRoot.appendChild(container);

    // Overlay to catch clicks outside when open
    const backdrop = document.createElement('div');
    backdrop.className = 'app-bar-backdrop';
    this.shadowRoot.insertBefore(backdrop, container);

    // State
    this._isOpen = false;
    this._container = container;
    this._backdrop = backdrop;
    this._ellipsisButton = ellipsisButton;

    // Events
    ellipsisButton.addEventListener('click', () => this.toggleMenu());
    backdrop.addEventListener('click', () => this.closeMenu());
    
    // Close on any menu item click (bubbling)
    menuContainer.addEventListener('click', () => {
        this.closeMenu();
    });

    this._iconsSlot = iconsSlot;
    this._menuSlot = menuSlot;

    // Detect children changes to update collapsed height
    iconsSlot.addEventListener('slotchange', () => this.updateCollapsedHeight());
    menuSlot.addEventListener('slotchange', () => this.updateCollapsedHeight());
  }

  static get observedAttributes() {
    return ['mode', 'opacity'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'mode') {
      this._container.setAttribute('data-mode', newValue || 'compact');
    } else if (name === 'opacity') {
      this._container.style.setProperty('--app-bar-opacity', newValue || '1');
    }
  }

  connectedCallback() {
      // Auto-slot into single page footer
      // Wait for parent to be defined to check inheritance
      const parent = this.parentElement;
      if (parent) {
          customElements.whenDefined(parent.localName).then(() => {
              if (parent instanceof DiscoPage) {
                  if (!this.hasAttribute('slot')) {
                      this.setAttribute('slot', 'footer');
                  }
              }
          });
      }
      this.updateCollapsedHeight();
  }

  updateCollapsedHeight() {
      if (this._isOpen) return; // Don't resize if open
      const metrics = this._getMetrics();
      this._container.style.height = `${metrics.collapsedHeight}px`;
  }

  _getMetrics() {
      const iconButtons = this._iconsSlot.assignedElements()
          .filter(e => e.tagName === 'DISCO-APP-BAR-ICON-BUTTON');
      const menuItems = this._menuSlot.assignedElements();

      const hasIcons = iconButtons.length > 0;
      const hasMenuItems = menuItems.length > 0;

      // 1. Collapsed, No Icon -> 30px
      // 2. Collapsed, Has Icon -> 72px
      const collapsedHeight = hasIcons ? 72 : 30;

      // 3. Expanded
      // Measure content height logic or use fixed rules
      // Rule: Icon exists, No Menu Items -> 102px
      let expandedHeight = 0;
      if (hasIcons && !hasMenuItems) {
          expandedHeight = 102;
      } else {
          // Measure content
          const prevHeight = this._container.style.height;
          this._container.style.height = 'auto'; // Let it expand to content naturally for measurement
          const scrollHeight = this._container.scrollHeight;
          this._container.style.height = prevHeight; // Restore immediately
          
          // Max height logic: 458px or ~55vh (100vh / 1.8)
          // "statik heighttansa viewport heightı önemlidir o zaman vw / 1.8" -> 100vh / 1.8
          const viewportLimit = window.innerHeight / 1.8;
          const maxLimit = Math.min(458, viewportLimit);
          
          expandedHeight = Math.min(scrollHeight, maxLimit);
          // If strictly expanded, ensure at least collapsed height? usually yes.
          expandedHeight = Math.max(expandedHeight, collapsedHeight);
      }
      
      return { collapsedHeight, expandedHeight, hasIcons };
  }

  toggleMenu() {
    if (this._animating) return;
    if (this._isOpen) this.closeMenu();
    else this.openMenu();
  }

  openMenu() {
    if (this._isOpen || this._animating) return;
    this._animating = true;
    this._isOpen = true;
    
    const metrics = this._getMetrics();
    
    // 1. Make labels visible BEFORE animation logic
    // We already do this via toggleIconsLabels(true) but we ensure it happens now
    this.toggleIconsLabels(true);
    
    // Add classes for styling (backdrop etc)
    this._container.classList.add('is-open');
    this._backdrop.classList.add('is-visible');

    // recalculate expanded height NOW that labels might have affected layout (if labels take space?)
    // Actually labels are absolute often or handled by buttons, 
    // but better to remeasure if needed. metrics.expandedHeight uses 'auto' measuring, 
    // so if toggleIconsLabels changed layout, we should re-measure inside animation setup if possible 
    // or just rely on the heuristic.
    // Re-measure just in case showing labels changed scrollHeight (it does, logic implies labels show below icons)
    const activeMetrics = this._getMetrics(); 

    DiscoAnimations.animate(
        this._container,
        [
            { height: `${activeMetrics.collapsedHeight}px` },
            { height: `${activeMetrics.expandedHeight}px` }
        ],
        {
            duration: 300, // Standard Metro open speed
            easing: DiscoAnimations.easeOutQuart,
            fill: 'forwards'
        }
    ).finished.then(() => {
        this._animating = false;
        // Ensure final height is set strictly or kept by forwards fill
        this._container.style.height = `${activeMetrics.expandedHeight}px`;
    });
  }

  closeMenu() {
    if (!this._isOpen || this._animating) return;
    this._animating = true;
    this._isOpen = false;

    // Remove backdrop immediately? usually fade out. But here logic is simple.
    // CSS transitions opacity for backdrop? 
    // The previous CSS had "transition: ... background-color"
    this._backdrop.classList.remove('is-visible');
    
    const metrics = this._getMetrics(); // Get current state heights
    const currentHeight = this._container.offsetHeight;

    DiscoAnimations.animate(
        this._container,
        [
            { height: `${currentHeight}px` },
            { height: `${metrics.collapsedHeight}px` }
        ],
        {
            duration: 250, // Slightly faster close?
            easing: DiscoAnimations.easeOutQuad, // Using Quad for exit usually
            fill: 'forwards'
        }
    ).finished.then(() => {
        this._animating = false;
        this._container.classList.remove('is-open');
        this._container.style.height = `${metrics.collapsedHeight}px`;

        // Hide labels AFTER animation
        this.toggleIconsLabels(false);
    });
  }

  toggleIconsLabels(show) {
    const iconsSlot = this.shadowRoot.querySelector('slot[name="icons"]');
    if (!iconsSlot) return;
    const elements = iconsSlot.assignedElements();
    elements.forEach(el => {
      if (el.tagName.toLowerCase() === 'disco-app-bar-icon-button') {
        if (show) el.setAttribute('show-label', '');
        else el.removeAttribute('show-label');
      }
    });
  }
}

customElements.define('disco-app-bar', DiscoAppBar);
export default DiscoAppBar;

