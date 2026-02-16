import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export default class DiscoRadioButton extends DiscoUIElement {
  checked: boolean;
  disabled: boolean;
  name: string;
}

export type DiscoRadioButtonElement = DiscoRadioButton;
