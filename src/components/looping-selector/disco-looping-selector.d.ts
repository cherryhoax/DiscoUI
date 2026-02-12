import type DiscoPickerBox from '../picker-box/disco-picker-box.js';

export default class DiscoLoopingSelector extends DiscoPickerBox {
  constructor(appTitle?: string, header?: string);

  _initSliderPicker(kinds: string[]): void;
  _registerSliderKind(
    kind: string,
    config?: {
      column?: HTMLElement;
      view?: HTMLElement;
      items?: HTMLElement[];
      values?: any[];
    }
  ): void;

  _resetSliderInteractionState(): void;
  _markUserInteraction(kind: string): void;
  _onScroll(kind: string): void;
  _onScrollEnd(kind: string): void;
  _onSnap(kind: string, event: CustomEvent): void;
  _scrollSliderToIndex(kind: string, index: number): void;
}

export type DiscoLoopingSelectorElement = DiscoLoopingSelector;
