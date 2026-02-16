import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export default class DiscoImage extends DiscoUIElement {
  src: string;
  alt: string;
  fit: 'cover' | 'contain' | 'stretch';
  ratio: string;
}

export type DiscoImageElement = DiscoImage;
