import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export default class DiscoProgressBar extends DiscoUIElement {
  value: number;
  max: number;
  indeterminate: boolean;
  startIndeterminate(): void;
  stopIndeterminate(options?: { graceful?: boolean }): Promise<void>;
}

export type DiscoProgressBarElement = DiscoProgressBar;
