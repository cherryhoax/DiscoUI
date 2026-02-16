import type DiscoFlyout from '../flyout/disco-flyout.js';

export default class DiscoDialog extends DiscoFlyout {
  constructor(title?: string);
  title: string;
  open(): Promise<void>;
}

export type DiscoDialogElement = DiscoDialog;
