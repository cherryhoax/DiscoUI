import type DiscoDialog from '../dialog/disco-dialog.js';

export interface DiscoMessageDialogOptions {
  unsafe?: boolean;
}

export type DiscoMessageDialogActions = Record<string, unknown | (() => unknown | Promise<unknown>)>;

export default class DiscoMessageDialog extends DiscoDialog {
  constructor(
    title?: string,
    message?: string,
    actions?: DiscoMessageDialogActions,
    options?: DiscoMessageDialogOptions
  );
  message: string;
  setActions(actions?: DiscoMessageDialogActions): void;
  open(): Promise<unknown | null>;
  close(options?: { fromPopState?: boolean }): Promise<void>;
}

export type DiscoMessageDialogElement = DiscoMessageDialog;
