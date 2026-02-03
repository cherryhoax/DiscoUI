import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import DiscoUIElement from '../disco-ui-element.js';

/**
 * A section within a DiscoHub.
 */
class DiscoHubSection extends DiscoUIElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            flex-shrink: 0;
            touch-action: none;
            overscroll-behavior: contain;
        }

        :host([data-animating]) {
            overflow: visible !important;
        }

        .section-root {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
            touch-action: none;
            overscroll-behavior: contain;
        }

        :host([data-animating]) .section-root {
            overflow: visible !important;
        }

        .section-header {
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 24px;
            font-weight: 600;
            text-transform: uppercase;
            margin: 0;
            opacity: 0.8;
        }

        .section-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            touch-action: none;
            overscroll-behavior: contain;
        }

        :host([data-animating]) .section-content {
            overflow: visible !important;
        }

        .section-content ::slotted(disco-scroll-view),
        .section-content ::slotted(disco-list-view) {
            flex: 1;
            min-height: 0;
            align-self: stretch;
            padding: 0 20px;
            padding-bottom: 120px;
            margin: 0 -20px;
        }

        .section-content ::slotted(disco-list-view),
        .section-content ::slotted(disco-scroll-view),
        .section-content ::slotted(disco-flip-view) {
            flex: 1;
            align-self: stretch;
            width: 100%;
            height: 100%;
            min-height: 0;
        }
    `;

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
