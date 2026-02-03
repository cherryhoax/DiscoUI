import type DiscoScrollView from './disco-scroll-view.js';

export default class DiscoFlipView extends DiscoScrollView {
  constructor();
  get scrollLeft(): number;
  set scrollLeft(val: number);
  get scrollTop(): number;
  set scrollTop(val: number);
}

export type DiscoFlipViewElement = DiscoFlipView;
