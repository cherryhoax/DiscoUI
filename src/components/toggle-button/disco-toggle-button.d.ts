import type DiscoButton from '../buttons/disco-button.js';

export default class DiscoToggleButton extends DiscoButton {
  checked: boolean;
  disabled: boolean;
}

export type DiscoToggleButtonElement = DiscoToggleButton;
