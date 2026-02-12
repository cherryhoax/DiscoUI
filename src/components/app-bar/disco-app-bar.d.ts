import DiscoUIElement from '../ui-elements/disco-ui-element.js';

/**
 * A Disco UI app bar element that displays icon buttons and menu items.
 * Icon buttons are always visible, while menu items appear in the ellipsis menu.
 * Icon button labels also appear in the ellipsis menu for accessibility.
 */
declare class DiscoAppBar extends DiscoUIElement {
  /**
   * The mode of the app bar (e.g., 'compact', 'minimal')
   */
  mode?: string;
  
  /**
   * The opacity of the app bar background (0-1)
   */
  opacity?: string;

  /**
   * Show the app bar with slide-up animation
   */
  show(): void;

  /**
   * Hide the app bar with slide-down animation
   */
  hide(): void;

  /**
   * Toggle the ellipsis menu
   */
  toggleMenu(): void;

  /**
   * Open the ellipsis menu
   */
  openMenu(): void;

  /**
   * Close the ellipsis menu
   */
  closeMenu(): void;
}

export default DiscoAppBar;
