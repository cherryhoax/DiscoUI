import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export default class DiscoSlider extends DiscoUIElement {
  min: string;
  max: string;
  step: string;
  value: string;
  disabled: boolean;
}

export type DiscoSliderElement = DiscoSlider;
