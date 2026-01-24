import type DiscoUIElement from './disco-ui-element.js';

export default class DiscoProgressBar extends DiscoUIElement {
  value: number;
  max: number;
  indeterminate: boolean;
}

export type DiscoProgressBarElement = DiscoProgressBar;
