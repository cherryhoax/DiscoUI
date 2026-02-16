import type DiscoUIElement from '../ui-elements/disco-ui-element.js';

export default class DiscoProgressRing extends DiscoUIElement {
	indeterminate: boolean;
	value: number;
	max: number;
	colorMode: 'accent' | 'foreground';
	startIndeterminate(): void;
	stopIndeterminate(options?: { graceful?: boolean }): Promise<void>;
}

export type DiscoProgressRingElement = DiscoProgressRing;
