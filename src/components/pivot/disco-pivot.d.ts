import type DiscoPage from '../page/disco-page.js';
import type { DiscoPageAnimationOptions } from '../page/disco-page.js';

/**
 * Pivot-style page with header strip and flip-view content.
 */
export default class DiscoPivotPage extends DiscoPage {
  /**
   * @param appTitle The title string displayed above pivot headers.
   */
  constructor(appTitle?: string);

  /**
   * The small title string displayed above the pivot headers.
   */
  appTitle: string;

  /**
   * Runs the enter animation for the page.
   */
  animateInFn(options?: DiscoPageAnimationOptions): Promise<void>;

  /**
   * Runs the exit animation for the page.
   */
  animateOutFn(options?: DiscoPageAnimationOptions): Promise<void>;
}

export type DiscoPivotPageElement = DiscoPivotPage;
