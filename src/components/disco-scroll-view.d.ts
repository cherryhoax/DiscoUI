import DiscoUIElement from './disco-ui-element.js';

export default class DiscoScrollView extends DiscoUIElement {
  /**
   * The current scroll position X
   */
  scrollLeft: number;

  /**
   * The current scroll position Y
   */
  scrollTop: number;

  /**
   * The maximum scroll position X
   */
  readonly maxScrollLeft: number;

  /**
   * The maximum scroll position Y
   */
  readonly maxScrollTop: number;

  /**
   * Scrolls to a specific position
   */
  scrollTo(x: number, y: number, animate?: boolean): void;
}
