import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export default class DiscoSplash extends DiscoUIElement {
  logoNode?: HTMLElement | null;
  dismiss(): void;
}

export type DiscoSplashElement = DiscoSplash;
