export type DiscoKeyframe = Keyframe & {
  offset?: number;
};

export interface DiscoSplineOptions {
  steps?: number;
  props?: string[];
  staticProps?: string[];
  stringProps?: string[];
  transform?: (values: Record<string, number>) => string;
}

export type DiscoKeyframeOptions = DiscoSplineOptions & {
  stringProps?: string[];
};

export type DiscoAnimateOptions = KeyframeAnimationOptions & {
  spline?: boolean | DiscoSplineOptions;
};

export interface DiscoPageAnimationOptions {
  direction?: 'forward' | 'back';
}

export interface PageAnimations {
  in(target: Element, options?: DiscoPageAnimationOptions): Promise<void>;
  out(target: Element, options?: DiscoPageAnimationOptions): Promise<void>;
}

export interface AnimationSet {
  page: PageAnimations;
}

declare const DiscoAnimations: {
  linear: string;
  ease: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
  easeInQuad: string;
  easeInCubic: string;
  easeInQuart: string;
  easeInQuint: string;
  easeInSine: string;
  easeInExpo: string;
  easeInCirc: string;
  easeInBack: string;
  easeOutQuad: string;
  easeOutCubic: string;
  easeOutQuart: string;
  easeOutQuint: string;
  easeOutSine: string;
  easeOutExpo: string;
  easeOutCirc: string;
  easeOutBack: string;
  easeInOutQuad: string;
  easeInOutCubic: string;
  easeInOutQuart: string;
  easeInOutQuint: string;
  easeInOutSine: string;
  easeInOutExpo: string;
  easeInOutCirc: string;
  easeInOutBack: string;
  perspective: string;
  splineBasisPoint: (p0: number, p1: number, p2: number, p3: number, t: number) => number;
  buildClampedKnots: (pointCount: number, degree: number) => number[];
  normalizeOffsets: (keyframes: DiscoKeyframe[]) => number[];
  mapTimeToParam: (offsets: number[], t: number) => number;
  sampleLinear: (values: number[], offsets: number[], t: number) => number;
  splineSample: (points: number[] | number[][], t: number) => number | number[];
  parseStringTemplate: (input: string) => {
    parts: Array<string | { tokenIndex: number }>;
    tokens: Array<{ value: number; unit: string }>;
  } | null;
  buildStringFromTemplate: (
    template: { parts: Array<string | { tokenIndex: number }>; tokens: Array<{ value: number; unit: string }> },
    values: number[]
  ) => string;
  fillMissingValues: (values: Array<number | null>, offsets?: number[] | null) => number[];
  splineKeyframes: (keyframes: DiscoKeyframe[], options?: DiscoKeyframeOptions) => DiscoKeyframe[];
  linearKeyframes: (keyframes: DiscoKeyframe[], options?: DiscoKeyframeOptions) => DiscoKeyframe[];
  inferSplineOptions: (keyframes: DiscoKeyframe[], base?: DiscoSplineOptions) => DiscoSplineOptions;
  animate: (target: Element, keyframes: DiscoKeyframe[] | Keyframe[], options?: DiscoAnimateOptions) => Animation;
  animationSet: AnimationSet;
};

export default DiscoAnimations;
