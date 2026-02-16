import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export interface DiscoContextMenuItem {
  id?: string;
  label: string;
  value?: unknown;
  disabled?: boolean;
  danger?: boolean;
  action?: (item: DiscoContextMenuItem, menu: DiscoContextMenu) => unknown | Promise<unknown>;
}

export interface DiscoContextMenuOpenOptions {
  items?: DiscoContextMenuItem[];
  backgroundRoot?: HTMLElement | null;
}

export interface DiscoContextMenuBindOptions {
  trigger?: 'contextmenu' | 'longpress' | 'both';
  longPressMs?: number;
  backgroundRoot?: HTMLElement | null;
}

export default class DiscoContextMenu extends DiscoUIElement {
  constructor(items?: DiscoContextMenuItem[], options?: { backgroundRoot?: HTMLElement | null });
  setItems(items?: DiscoContextMenuItem[]): void;
  openFor(target: HTMLElement, options?: DiscoContextMenuOpenOptions): Promise<unknown | null>;
  close(options?: { fromPopState?: boolean }): Promise<void>;
  static openFor(
    target: HTMLElement,
    items: DiscoContextMenuItem[],
    options?: { backgroundRoot?: HTMLElement | null }
  ): Promise<unknown | null>;
  static bind(
    target: HTMLElement,
    getItems: (target: HTMLElement, event: Event) => DiscoContextMenuItem[] | Promise<DiscoContextMenuItem[]>,
    options?: DiscoContextMenuBindOptions
  ): () => void;
}

export type DiscoContextMenuElement = DiscoContextMenu;
