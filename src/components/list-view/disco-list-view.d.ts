import type DiscoScrollView from '../scroll-view/disco-scroll-view.js';

export type DiscoListItemClickDetail = {
  index: number;
  element: HTMLElement;
  data?: unknown;
};

export type DiscoListRecord = Record<string, unknown>;

export default class DiscoListView extends DiscoScrollView {
  items: Array<unknown | DiscoListRecord>;
  itemClickEnabled: boolean;
  selectionMode: string;
  groupStyle: 'auto' | 'custom' | null;
  groupField: string;
  groupLabelField: string;
}

export type DiscoListViewElement = DiscoListView;
