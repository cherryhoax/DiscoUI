import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export default class DiscoPivotItem extends DiscoUIElement {
  /**
   * Defaults to a vertical scroll view with extra bottom padding.
   * If the only child is a scroll or list view, scrolling is delegated to that child.
   */
  constructor();
  playEntranceAnimation(startOffset: number, duration?: number): Promise<void>;
}

export type DiscoPivotItemElement = DiscoPivotItem;
