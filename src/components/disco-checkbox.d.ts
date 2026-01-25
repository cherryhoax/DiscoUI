import type DiscoUIElement from './disco-ui-element.js';

export default class DiscoCheckbox extends DiscoUIElement {
  checked: boolean;
  disabled: boolean;
}

export type DiscoCheckboxElement = DiscoCheckbox;
