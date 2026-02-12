export default class DiscoUIElement extends HTMLElement {
  constructor();
  loadStyle(styleText: string, target?: Document['head'] | ShadowRoot): void;
  setPressed(target: HTMLElement, isPressed: boolean): void;
  enableTilt(options?: Record<string, any>): void;
}

export type DiscoUIElementElement = DiscoUIElement;
