import { html, css, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import DiscoUIElement from '../disco-ui-element.js';
import hubSectionStyles from './disco-hub-section.scss';

/**
 * A section within a DiscoHub.
 */
class DiscoHubSection extends DiscoUIElement {
    static styles = css`${unsafeCSS(hubSectionStyles)}`;

    @property({ type: String }) header = '';
    @property({ type: String }) width = '';

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
