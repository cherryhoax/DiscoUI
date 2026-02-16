import type DiscoPickerBox from '../flyout/disco-flyout.js';

export interface DiscoDatePickerOptions {
  min?: Date;
  max?: Date;
  format?: string;
  locale?: string;
}

export default class DiscoDatePicker extends DiscoPickerBox {
  constructor(title?: string, initialDate?: Date, options?: DiscoDatePickerOptions);
  open(): Promise<Date | null>;
  close(): Promise<void>;
}

export type DiscoDatePickerElement = DiscoDatePicker;
