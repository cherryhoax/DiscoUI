export type DiscoTiltOptions = {
  selector?: string | null;
  tiltMultiplier?: number;
  margin?: number;
  pressDown?: number;
  keyPress?: boolean;
  skipTransformWhenHostDisabled?: boolean;
};

export default class DiscoUIElement extends HTMLElement {
  constructor();
  loadStyle(styleText: string, target?: Document['head'] | ShadowRoot): void;
  setPressed(target: HTMLElement, isPressed: boolean): void;
  enableTilt(options?: DiscoTiltOptions): void;
}

export type DiscoUIElementElement = DiscoUIElement;
