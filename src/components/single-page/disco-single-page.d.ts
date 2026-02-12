import type DiscoPage from '../page/disco-page.js';

export default class DiscoSinglePage extends DiscoPage {
  /**
   * Defaults to a vertical scroll view with extra bottom padding.
   * If the only child is a scroll or list view, scrolling is delegated to that child.
   */
  appTitle: string;
  header: string;
}

export type DiscoSinglePageElement = DiscoSinglePage;
