import type DiscoUIElement from '../disco-ui-element.js';

export type DiscoListItemClickDetail = {
  index: number;
  element: HTMLElement;
  data?: unknown;
};

export default class DiscoListView extends DiscoUIElement {
  items: unknown[];
  itemClickEnabled: boolean;
  selectionMode: string;
}

export type DiscoListViewElement = DiscoListView;
