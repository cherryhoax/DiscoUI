import DiscoUIElement from '../disco-ui-element.js';
import sectionCss from './disco-hub-section.scss';

/**
 * A section within a DiscoHub.
 */
class DiscoHubSection extends DiscoUIElement {
    /**
     * @param {string} [header]
     */
    constructor(header = '') {
        super();
        this.header = header;
        this.attachShadow({ mode: 'open' });
        this.loadStyle(sectionCss, this.shadowRoot);

        this._container = document.createElement('div');
        this._container.className = 'section-root';
        this.shadowRoot.appendChild(this._container);
    }

    static get observedAttributes() {
        return ['header', 'width'];
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
        if (name === 'header' && newValue != null) {
            this.header = newValue;
            this.render();
        }
        if (name === 'width' && newValue != null) {
            this.style.width = newValue;
        }
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (!this.shadowRoot || !this._container) return;
        this._container.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">${this.header}</h2>
            </div>
            <div class="section-content">
                <slot></slot>
            </div>
        `;
    }
}

customElements.define('disco-hub-section', DiscoHubSection);

export default DiscoHubSection;
