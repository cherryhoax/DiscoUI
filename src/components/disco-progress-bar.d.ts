import type DiscoUIElement from './ui-elements/disco-ui-element.js';

export default class DiscoProgressBar extends DiscoUIElement {
  value: number;
  max: number;
  indeterminate: boolean;
}

export type DiscoProgressBarElement = DiscoProgressBar;
