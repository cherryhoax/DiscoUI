import type DiscoPage from '../disco-page.js';

export type DiscoPickerBoxAnimation = 'slide-up' | 'flip';

export default class DiscoPickerBox extends DiscoPage {
  appTitle: string;
  header: string;
  show(): Promise<void>;
  close(): Promise<void>;
}

export type DiscoPickerBoxElement = DiscoPickerBox;
