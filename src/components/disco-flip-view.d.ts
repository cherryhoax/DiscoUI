import type DiscoScrollView from './disco-scroll-view.js';

export default class DiscoFlipView extends DiscoScrollView {
  constructor();
  connectedCallback(): void;
  disconnectedCallback(): void;

  direction: 'vertical' | 'horizontal';
  _wrapper: HTMLElement;
  _loopVirtualY?: number;
  _nonLoopVirtualY?: number;
  _emitScroll?: () => void;

  _updateChildrenLayout(): void;
  _getPageElements(): HTMLElement[];
  _isLooping(): boolean;
  _getPageSize(): number;
  _getLoopMetrics(): { pageSize: number; span: number; count: number };
  _renderLoop(): void;

  get scrollLeft(): number;
  set scrollLeft(val: number);
  get scrollTop(): number;
  set scrollTop(val: number);
}

export type DiscoFlipViewElement = DiscoFlipView;
