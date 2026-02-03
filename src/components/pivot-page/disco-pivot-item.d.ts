import type DiscoUIElement from '../disco-ui-element.js';

export default class DiscoPivotItem extends DiscoUIElement {
  constructor();
  playEntranceAnimation(startOffset: number, duration?: number): Promise<void>;
}

export type DiscoPivotItemElement = DiscoPivotItem;
