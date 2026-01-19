import type DiscoUIElement from './disco-ui-element.js';

export default class DiscoPage extends DiscoUIElement {
  animationInDuration: number;
  animationOutDuration: number;
  animateIn(): Promise<void>;
  animateOut(): Promise<void>;
}

export type DiscoPageElement = DiscoPage;
