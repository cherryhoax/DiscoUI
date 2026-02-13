import type DiscoPickerBox from '../picker-box/disco-picker-box.js';

export interface DiscoLongListSelectorOptions {
  mode?: 'auto' | 'custom';
  labelField?: string;
  separatorField?: string;
  separators?: string[];
  locale?: string;
}

export interface DiscoLongListSelectorSelectDetail {
  key: string;
  label: string;
  index: number;
}

export default class DiscoLongListSelector extends DiscoPickerBox {
  constructor(title?: string, items?: unknown[], options?: DiscoLongListSelectorOptions);
  get mode(): 'auto' | 'custom';
  set mode(value: 'auto' | 'custom');
  get items(): unknown[];
  set items(value: unknown[]);
  setData(items: unknown[], options?: DiscoLongListSelectorOptions): void;
  refresh(): void;
  open(): Promise<string | null>;
  close(options?: { fromPopState?: boolean }): Promise<void>;
}

export type DiscoLongListSelectorElement = DiscoLongListSelector;
