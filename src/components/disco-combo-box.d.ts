import type DiscoUIElement from './disco-ui-element.js';
import type DiscoComboBoxItem from './disco-combo-box-item.js';

export default class DiscoComboBox extends DiscoUIElement {
  items: DiscoComboBoxItem[];
  selectedIndex: number;
  value: string;
  open(): void;
  close(): void;
  toggle(): void;
}

export type DiscoComboBoxElement = DiscoComboBox;
