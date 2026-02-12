import type DiscoPickerBox from '../picker-box/disco-picker-box.js';

export interface DiscoTimeSpanStep {
  m?: number;
  s?: number;
}

export interface DiscoTimeSpanPickerOptions {
  max?: string;
  min?: string;
  step?: DiscoTimeSpanStep;
  showSeconds?: boolean;
}

export default class DiscoTimeSpanPicker extends DiscoPickerBox {
  constructor(title?: string, value?: string, options?: DiscoTimeSpanPickerOptions);
  get title(): string;
  set title(value: string);
  get value(): string;
  set value(value: string);
  get min(): string;
  set min(value: string);
  get max(): string;
  set max(value: string);
  get step(): DiscoTimeSpanStep;
  set step(value: DiscoTimeSpanStep);
  get showSeconds(): boolean;
  set showSeconds(value: boolean);
  open(): Promise<string | null>;
  close(): Promise<void>;
}

export type DiscoTimeSpanPickerElement = DiscoTimeSpanPicker;
