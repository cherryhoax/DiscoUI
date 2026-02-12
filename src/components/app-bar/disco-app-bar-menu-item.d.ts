import DiscoUIElement from '../ui-elements/disco-ui-element.js';

/**
 * A menu item that appears in the app bar ellipsis menu.
 */
declare class DiscoAppBarMenuItem extends DiscoUIElement {
  /**
   * The label text for the menu item
   */
  label?: string;

  /**
   * Whether the menu item is disabled
   */
  disabled?: boolean;
}

export default DiscoAppBarMenuItem;
