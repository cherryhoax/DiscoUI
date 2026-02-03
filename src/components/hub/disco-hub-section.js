import { html, css, unsafeCSS } from 'lit';
import DiscoUIElement from '../disco-ui-element.js';
import hubSectionStyles from './disco-hub-section.scss';

/**
 * A section within a DiscoHub.
 */
class DiscoHubSection extends DiscoUIElement {
    static styles = css`${unsafeCSS(hubSectionStyles)}`;

    static get properties() {
        return {
            header: { type: String },
            width: { type: String }
        };
    }

    constructor() {
        super();
        this.header = '';
        this.width = '';
    }

    updated(changedProperties) {
        if (changedProperties.has('width')) {
            this.style.width = this.width || '';
        }
    }

    render() {
        return html`
            <div class="section-root">
                <div class="section-header">
                    <h2 class="section-title">${this.header}</h2>
                </div>
                <div class="section-content">
                    <slot></slot>
                </div>
            </div>
        `;
    }
}

customElements.define('disco-hub-section', DiscoHubSection);

export default DiscoHubSection;
