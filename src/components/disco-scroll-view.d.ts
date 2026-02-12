import DiscoUIElement from './ui-elements/disco-ui-element.js';

/**
 * Scroll view with momentum and overscroll.
 * Snap-back speed scales with release velocity for a more responsive bounce.
 */
export default class DiscoScrollView extends DiscoUIElement {
  /**
   * The current scroll position X
   */
  get scrollLeft(): number;
  set scrollLeft(value: number);

  /**
   * The current scroll position Y
   */
  get scrollTop(): number;
  set scrollTop(value: number);

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
  scrollTo(options?: ScrollToOptions): void;
  scrollTo(x: number, y: number): void;
  scrollTo(x: number, y: number, animate?: boolean): void;
}
