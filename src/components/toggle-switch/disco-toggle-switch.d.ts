import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export default class DiscoToggleSwitch extends DiscoUIElement {
  checked: boolean;
  disabled: boolean;
}

export type DiscoToggleSwitchElement = DiscoToggleSwitch;
