import type DiscoUIElement from './ui-elements/disco-ui-element.js';

export default class DiscoCheckbox extends DiscoUIElement {
  checked: boolean;
  disabled: boolean;
}

export type DiscoCheckboxElement = DiscoCheckbox;
