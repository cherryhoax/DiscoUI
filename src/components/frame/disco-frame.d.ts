import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export default class DiscoFrame extends DiscoUIElement {
  history: HTMLElement[];
  historyIndex: number;
  loadPage(path: string, options?: { onLoad?: (page: HTMLElement) => void; onError?: (error: Error) => void }): Promise<HTMLElement>;
  navigate(page?: HTMLElement | null): Promise<void>;
  goBack(): Promise<void>;
  predictiveBackProgress(t: number): Promise<void>;
  predictiveBackCancel(): Promise<void>;
  predictiveBackCommit(): Promise<boolean>;
}

export type DiscoFrameElement = DiscoFrame;
