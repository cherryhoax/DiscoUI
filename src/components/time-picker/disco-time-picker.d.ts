import type DiscoPickerBox from '../flyout/disco-flyout.js';

export interface DiscoTimePickerOptions {
  minuteIncrement?: number;
  locale?: string;
  format?: string;
}

export default class DiscoTimePicker extends DiscoPickerBox {
  constructor(title?: string, value?: Date | string, options?: DiscoTimePickerOptions);
  get locale(): string;
  set locale(value: string);
  get format(): string;
  set format(value: string);
  get minuteIncrement(): number;
  set minuteIncrement(value: number);
  get value(): Date;
  set value(value: Date | string);
  open(): Promise<Date | null>;
  close(): Promise<void>;
}

export type DiscoTimePickerElement = DiscoTimePicker;
