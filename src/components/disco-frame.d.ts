import type DiscoUIElement from './disco-ui-element.js';

export default class DiscoFrame extends DiscoUIElement {
  history: HTMLElement[];
  historyIndex: number;
  navigate(page?: HTMLElement | null): Promise<void>;
  goBack(): Promise<void>;
}

export type DiscoFrameElement = DiscoFrame;
