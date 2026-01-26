import type DiscoScrollView from '../disco-scroll-view.js';

export type DiscoListItemClickDetail = {
  index: number;
  element: HTMLElement;
  data?: unknown;
};

export default class DiscoListView extends DiscoScrollView {
  items: unknown[];
  itemClickEnabled: boolean;
  selectionMode: string;
}

export type DiscoListViewElement = DiscoListView;
