import type DiscoUIElement from './disco-ui-element.js';

export default class DiscoPage extends DiscoUIElement {
  animateIn(options?: DiscoPageAnimationOptions): Promise<void>;
  animateOut(options?: DiscoPageAnimationOptions): Promise<void>;
}

export type DiscoPageElement = DiscoPage;

export type DiscoPageAnimationOptions = {
  direction: 'forward' | 'back';
};
