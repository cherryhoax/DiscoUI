import type DiscoUIElement from './disco-ui-element.js';

export default class DiscoFrame extends DiscoUIElement {
  history: HTMLElement[];
  navigate(page?: HTMLElement | null): Promise<void>;
  goBack(): Promise<void>;
}

export type DiscoFrameElement = DiscoFrame;
