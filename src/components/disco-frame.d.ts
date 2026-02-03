import type DiscoUIElement from './disco-ui-element.js';

export default class DiscoFrame extends DiscoUIElement {
  history: HTMLElement[];
  historyIndex: number;
  loadPage(path: string, options?: { onLoad?: (page: HTMLElement) => void; onError?: (error: Error) => void }): Promise<HTMLElement>;
  navigate(page?: HTMLElement | null): Promise<void>;
  goBack(): Promise<void>;
}

export type DiscoFrameElement = DiscoFrame;
