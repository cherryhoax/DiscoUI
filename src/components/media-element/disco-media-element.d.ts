import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export default class DiscoMediaElement extends DiscoUIElement {
  src: string;
  artwork: string;
  kind: 'auto' | 'audio' | 'video';
  muted: boolean;
  play(): Promise<void>;
  pause(): void;
}

export type DiscoMediaElementElement = DiscoMediaElement;
