import DiscoUIElement from '../disco-ui-element.js';

/**
 * A circular icon button for the app bar.
 * Always visible in the app bar, with its label shown in the ellipsis menu.
 */
declare class DiscoAppBarIconButton extends DiscoUIElement {
  /**
   * The icon name (from Metro UI icon set)
   */
  icon?: string;

  /**
   * The label for the button (shown in ellipsis menu and as aria-label)
   */
  label?: string;

  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
}

export default DiscoAppBarIconButton;
