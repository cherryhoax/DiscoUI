import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export default class DiscoTextBox extends DiscoUIElement {
  value: string;
  placeholder: string;
  type: string;
  focus(): void;
}

export type DiscoTextBoxElement = DiscoTextBox;
