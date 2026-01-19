import type DiscoUIElement from './disco-ui-element.js';

export default class DiscoSplash extends DiscoUIElement {
  logoNode?: HTMLElement | null;
  dismiss(): void;
}

export type DiscoSplashElement = DiscoSplash;
