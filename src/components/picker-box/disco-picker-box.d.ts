import type DiscoPage from '../page/disco-page.js';

export type DiscoPickerBoxAnimation = 'slide-up' | 'flip' | 'none';

export default class DiscoPickerBox extends DiscoPage {
  constructor(appTitle?: string, header?: string);
  appTitle: string;
  header: string;
  show(): Promise<void>;
  close(options?: { fromPopState?: boolean }): Promise<void>;
}

export type DiscoPickerBoxElement = DiscoPickerBox;
