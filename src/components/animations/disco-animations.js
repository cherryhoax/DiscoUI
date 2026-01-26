import animationsCss from './disco-animations.scss';
import bspline from 'b-spline';

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = animationsCss;
    document.head.appendChild(style);
}

/**
 * @typedef {Object} DiscoSplineOptions
 * @property {number} [steps]
 * @property {string[]} [props]
 * @property {string[]} [staticProps]
 * @property {string[]} [stringProps]
 * @property {(values: Record<string, number>) => string} [transform]
 */

/**
 * @typedef {Object} DiscoKeyframe
 * @property {number} [offset]
 */

/**
 * @typedef {DiscoSplineOptions & { stringProps?: string[] }} DiscoKeyframeOptions
 */

/**
 * @typedef {KeyframeAnimationOptions & { spline?: boolean | DiscoSplineOptions }} DiscoAnimateOptions
 */

const animationSet = {
    page: {
        /**
         * @param {Element} target
         * @param {DiscoPageAnimationOptions} [options]
         * @returns {Promise<void>}
         */
        in: async (target, options = { direction: 'forward' }) => {
            const animation = options.direction === 'forward' ? DiscoAnimations.animate(
                target,
                [
                    {
                        opacity: 1,
                        transformOrigin: 'left center',
                        transform: `translateX(${window.innerWidth / 8}px) rotateY(80deg) translateX(${window.innerWidth / 5}px)`
                    },
                    {
                        transform: `translateX(${window.innerWidth / 16}px) rotateY(40deg) translateX(${window.innerWidth / 8}px)`
                    },
                    {
                        opacity: 1,
                        transformOrigin: 'left center',
                        transform: `translateX(0px) rotateY(0deg) translateX(0px)`
                    }
                ],
                {
                    duration: 300,
                    easing: DiscoAnimations.easeOutQuart,
                    spline: true,
                    fill: 'forwards'
                }
            ) : DiscoAnimations.animate(
                target,
                [
                    {
                        opacity: 1,
                        transformOrigin: 'left center',
                        transform: `translateX(${-window.innerWidth / 2}px) rotateY(-180deg) translateX(0px)`
                    },
                    {
                        opacity: 1,
                        transformOrigin: 'left center',
                        transform: `translateX(0px) rotateY(0deg) translateX(0px)`
                    }
                ],
                {
                    duration: 300,
                    easing: DiscoAnimations.easeOutQuart,
                    spline: true,
                    fill: 'forwards'
                }
            );
            await animation.finished;
        },

        /**
         * @param {Element} target
         * @param {DiscoPageAnimationOptions} [options]
         * @returns {Promise<void>}
         */
        out: async (target, options = { direction: 'forward' }) => {
            const animation = options.direction === 'forward' ? DiscoAnimations.animate(
                target,
                [
                    {
                        opacity: 1,
                        transformOrigin: 'left center',
                        transform: `translateX(0px) rotateY(0deg) translateX(0px)`
                    },
                    {
                        opacity: 1,
                        transformOrigin: 'left center',
                        transform: `translateX(${-window.innerWidth / 2}px) rotateY(-180deg) translateX(0px)`
                    }
                ],
                {
                    duration: 150,
                    easing: DiscoAnimations.easeInQuad,
                    fill: 'forwards',
                    spline: true
                }
            ) : DiscoAnimations.animate(
                target,
                [
                    {
                        opacity: 1,
                        transformOrigin: 'left center',
                        transform: `translateX(0px) rotateY(0deg) translateX(0px)`
                    },
                    {
                        opacity: 1,
                        transformOrigin: 'left center',
                        transform: `translateX(${window.innerWidth / 8}px) rotateY(90deg) translateX(${window.innerWidth / 5}px)`
                    }
                ],
                {
                    duration: 150,
                    easing: DiscoAnimations.easeInQuad,
                    fill: 'forwards',
                    spline: true
                }
            );
            await animation.finished;
        }

    },
    list: {
        /**
         * @param {Element[]} targets
         * @param {DiscoPageAnimationOptions} [options]
         * @returns {Promise<void>}
         */
        in: async (targets, options = { direction: 'forward' }) => {
            const items = Array.isArray(targets) ? targets : [];
            const animationItems = items
                .filter((target) => target)
                .map((target, index) => ({
                    target,
                    delay: index * 50,
                    run: () => animationSet.page.in(target, options)
                }));

            await DiscoAnimations.animateAll(animationItems);
        },

        /**
         * @param {Element[]} targets
         * @param {DiscoPageAnimationOptions} [options]
         * @returns {Promise<void>}
         */
        out: async (targets, options = { direction: 'forward' }) => {
            const items = Array.isArray(targets) ? targets : [];
            const animationItems = items
                .filter((target) => target)
                .map((target, index) => ({
                    target,
                    delay: index * 50,
                    run: () => animationSet.page.out(target, options)
                }));

            await DiscoAnimations.animateAll(animationItems);
        }
    }
}

const animationVisibilityCache = new WeakMap();

const cubicBezierAt = (t, x1, y1, x2, y2) => {
    const clamp = (value) => Math.max(0, Math.min(1, value));
    const clamped = clamp(t);
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    const sampleX = (tValue) => ((ax * tValue + bx) * tValue + cx) * tValue;
    const sampleY = (tValue) => ((ay * tValue + by) * tValue + cy) * tValue;
    const sampleDerivativeX = (tValue) => (3 * ax * tValue + 2 * bx) * tValue + cx;

    let u = clamped;
    for (let i = 0; i < 8; i += 1) {
        const x = sampleX(u) - clamped;
        const d = sampleDerivativeX(u);
        if (Math.abs(x) < 1e-6 || d === 0) break;
        u -= x / d;
    }

    let low = 0;
    let high = 1;
    for (let i = 0; i < 12; i += 1) {
        const x = sampleX(u);
        if (Math.abs(x - clamped) < 1e-6) break;
        if (x < clamped) {
            low = u;
        } else {
            high = u;
        }
        u = (low + high) / 2;
    }

    return sampleY(u);
};

const DiscoAnimations = {
    linear: 'cubic-bezier(0.250, 0.250, 0.750, 0.750)',
    ease: 'cubic-bezier(0.250, 0.100, 0.250, 1.000)',
    easeIn: 'cubic-bezier(0.420, 0.000, 1.000, 1.000)',
    easeOut: 'cubic-bezier(0.000, 0.000, 0.580, 1.000)',
    easeInOut: 'cubic-bezier(0.420, 0.000, 0.580, 1.000)',
    easeInQuad: 'cubic-bezier(0.550, 0.085, 0.680, 0.530)',
    easeInCubic: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)',
    easeInQuart: 'cubic-bezier(0.895, 0.030, 0.685, 0.220)',
    easeInQuint: 'cubic-bezier(0.755, 0.050, 0.855, 0.060)',
    easeInSine: 'cubic-bezier(0.470, 0.000, 0.745, 0.715)',
    easeInExpo: 'cubic-bezier(0.950, 0.050, 0.795, 0.035)',
    easeInCirc: 'cubic-bezier(0.600, 0.040, 0.980, 0.335)',
    easeInBack: 'cubic-bezier(0.600, -0.280, 0.735, 0.045)',
    easeOutQuad: 'cubic-bezier(0.250, 0.460, 0.450, 0.940)',
    easeOutCubic: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
    easeOutQuart: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
    easeOutQuint: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
    easeOutSine: 'cubic-bezier(0.390, 0.575, 0.565, 1.000)',
    easeOutExpo: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
    easeOutCirc: 'cubic-bezier(0.075, 0.820, 0.165, 1.000)',
    easeOutBack: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
    easeInOutQuad: 'cubic-bezier(0.455, 0.030, 0.515, 0.955)',
    easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1.000)',
    easeInOutQuart: 'cubic-bezier(0.770, 0.000, 0.175, 1.000)',
    easeInOutQuint: 'cubic-bezier(0.860, 0.000, 0.070, 1.000)',
    easeInOutSine: 'cubic-bezier(0.445, 0.050, 0.550, 0.950)',
    easeInOutExpo: 'cubic-bezier(1.000, 0.000, 0.000, 1.000)',
    easeInOutCirc: 'cubic-bezier(0.785, 0.135, 0.150, 0.860)',
    easeInOutBack: 'cubic-bezier(0.680, -0.550, 0.265, 1.550)',
    calculate: {
        linear: (t) => cubicBezierAt(t, 0.25, 0.25, 0.75, 0.75),
        ease: (t) => cubicBezierAt(t, 0.25, 0.1, 0.25, 1),
        easeIn: (t) => cubicBezierAt(t, 0.42, 0, 1, 1),
        easeOut: (t) => cubicBezierAt(t, 0, 0, 0.58, 1),
        easeInOut: (t) => cubicBezierAt(t, 0.42, 0, 0.58, 1),
        easeInQuad: (t) => cubicBezierAt(t, 0.55, 0.085, 0.68, 0.53),
        easeInCubic: (t) => cubicBezierAt(t, 0.55, 0.055, 0.675, 0.19),
        easeInQuart: (t) => cubicBezierAt(t, 0.895, 0.03, 0.685, 0.22),
        easeInQuint: (t) => cubicBezierAt(t, 0.755, 0.05, 0.855, 0.06),
        easeInSine: (t) => cubicBezierAt(t, 0.47, 0, 0.745, 0.715),
        easeInExpo: (t) => cubicBezierAt(t, 0.95, 0.05, 0.795, 0.035),
        easeInCirc: (t) => cubicBezierAt(t, 0.6, 0.04, 0.98, 0.335),
        easeInBack: (t) => cubicBezierAt(t, 0.6, -0.28, 0.735, 0.045),
        easeOutQuad: (t) => cubicBezierAt(t, 0.25, 0.46, 0.45, 0.94),
        easeOutCubic: (t) => cubicBezierAt(t, 0.215, 0.61, 0.355, 1),
        easeOutQuart: (t) => cubicBezierAt(t, 0.165, 0.84, 0.44, 1),
        easeOutQuint: (t) => cubicBezierAt(t, 0.23, 1, 0.32, 1),
        easeOutSine: (t) => cubicBezierAt(t, 0.39, 0.575, 0.565, 1),
        easeOutExpo: (t) => cubicBezierAt(t, 0.19, 1, 0.22, 1),
        easeOutCirc: (t) => cubicBezierAt(t, 0.075, 0.82, 0.165, 1),
        easeOutBack: (t) => cubicBezierAt(t, 0.175, 0.885, 0.32, 1.275),
        easeInOutQuad: (t) => cubicBezierAt(t, 0.455, 0.03, 0.515, 0.955),
        easeInOutCubic: (t) => cubicBezierAt(t, 0.645, 0.045, 0.355, 1),
        easeInOutQuart: (t) => cubicBezierAt(t, 0.77, 0, 0.175, 1),
        easeInOutQuint: (t) => cubicBezierAt(t, 0.86, 0, 0.07, 1),
        easeInOutSine: (t) => cubicBezierAt(t, 0.445, 0.05, 0.55, 0.95),
        easeInOutExpo: (t) => cubicBezierAt(t, 1, 0, 0, 1),
        easeInOutCirc: (t) => cubicBezierAt(t, 0.785, 0.135, 0.15, 0.86),
        easeInOutBack: (t) => cubicBezierAt(t, 0.68, -0.55, 0.265, 1.55)
    },
    perspective: () => window.innerWidth * 4 + "px",

    /**
     * @param {number} p0
     * @param {number} p1
     * @param {number} p2
     * @param {number} p3
     * @param {number} t
     * @returns {number}
     */
    splineBasisPoint: (p0, p1, p2, p3, t) => {
        const t2 = t * t;
        const t3 = t2 * t;
        return (
            ((-t3 + 3 * t2 - 3 * t + 1) * p0 +
                (3 * t3 - 6 * t2 + 4) * p1 +
                (-3 * t3 + 3 * t2 + 3 * t + 1) * p2 +
                (t3) * p3) /
            6
        );
    },

    /**
     * @param {number} pointCount
     * @param {number} degree
     * @returns {number[]}
     */
    buildClampedKnots: (pointCount, degree) => {
        const knotCount = pointCount + degree + 1;
        const knots = new Array(knotCount).fill(0);
        const endStart = degree + 1;
        const endStop = knotCount - (degree + 1);
        const interiorCount = endStop - endStart;

        for (let i = 0; i < knotCount; i += 1) {
            if (i <= degree) {
                knots[i] = 0;
            } else if (i >= knotCount - degree - 1) {
                knots[i] = 1;
            } else if (interiorCount > 0) {
                const idx = i - endStart + 1;
                knots[i] = idx / (interiorCount + 1);
            } else {
                knots[i] = 0;
            }
        }

        return knots;
    },

    /**
     * @param {DiscoKeyframe[]} keyframes
     * @returns {number[]}
     */
    normalizeOffsets: (keyframes) => {
        const n = keyframes.length;
        if (n === 0) return [];
        const offsets = keyframes.map((kf) => {
            const value = kf?.offset;
            return Number.isFinite(Number(value)) ? Number(value) : null;
        });

        const hasAny = offsets.some((value) => value != null);
        if (!hasAny) {
            return offsets.map((_, i) => (n === 1 ? 0 : i / (n - 1)));
        }

        let firstDefined = offsets.findIndex((value) => value != null);
        let lastDefined = offsets.length - 1 - [...offsets].reverse().findIndex((value) => value != null);
        if (firstDefined < 0 || lastDefined < 0) {
            return offsets.map((_, i) => (n === 1 ? 0 : i / (n - 1)));
        }

        if (firstDefined > 0) {
            const end = offsets[firstDefined];
            for (let i = 0; i < firstDefined; i += 1) {
                offsets[i] = (end * i) / firstDefined;
            }
        }

        if (lastDefined < n - 1) {
            const start = offsets[lastDefined];
            const span = n - 1 - lastDefined;
            for (let i = 1; i <= span; i += 1) {
                offsets[lastDefined + i] = start + ((1 - start) * i) / span;
            }
        }

        let i = 0;
        while (i < n) {
            if (offsets[i] != null) {
                i += 1;
                continue;
            }
            let prev = i - 1;
            while (prev >= 0 && offsets[prev] == null) prev -= 1;
            let next = i + 1;
            while (next < n && offsets[next] == null) next += 1;
            const start = prev >= 0 ? offsets[prev] : 0;
            const end = next < n ? offsets[next] : 1;
            const span = next - prev;
            for (let j = 1; j < span; j += 1) {
                offsets[prev + j] = start + ((end - start) * j) / span;
            }
            i = next + 1;
        }

        return offsets.map((value) => Math.max(0, Math.min(1, Number(value ?? 0))));
    },

    /**
     * @param {number[]} offsets
     * @param {number} t
     * @returns {number}
     */
    mapTimeToParam: (offsets, t) => {
        const n = offsets.length;
        if (n <= 1) return 0;
        const clamped = Math.max(0, Math.min(1, t));
        if (clamped <= offsets[0]) return 0;
        if (clamped >= offsets[n - 1]) return 1;

        let idx = 0;
        while (idx < n - 1 && clamped > offsets[idx + 1]) idx += 1;
        const start = offsets[idx];
        const end = offsets[idx + 1] ?? start;
        const local = end === start ? 0 : (clamped - start) / (end - start);
        return (idx + local) / (n - 1);
    },

    /**
     * @param {number[]} values
     * @param {number[]} offsets
     * @param {number} t
     * @returns {number}
     */
    sampleLinear: (values, offsets, t) => {
        const n = values.length;
        if (n === 0) return 0;
        if (n === 1) return values[0];
        const clamped = Math.max(0, Math.min(1, t));
        if (clamped <= offsets[0]) return values[0];
        if (clamped >= offsets[n - 1]) return values[n - 1];

        let idx = 0;
        while (idx < n - 1 && clamped > offsets[idx + 1]) idx += 1;
        const startOffset = offsets[idx];
        const endOffset = offsets[idx + 1] ?? startOffset;
        const local = endOffset === startOffset ? 0 : (clamped - startOffset) / (endOffset - startOffset);
        const startValue = values[idx];
        const endValue = values[idx + 1] ?? values[idx];
        return startValue + (endValue - startValue) * local;
    },

    /**
     * @param {number[] | number[][]} points
     * @param {number} t
     * @returns {number | number[]}
     */
    splineSample: (points, t) => {
        const n = points.length;
        if (n === 0) return 0;
        if (n === 1) return points[0];
        const clampedT = Math.max(0, Math.min(1, t));
        const degree = Math.max(1, Math.min(3, n - 1));
        const knots = DiscoAnimations.buildClampedKnots(n, degree);
        const isScalar = typeof points[0] === 'number';
        const inputPoints = isScalar ? points.map((value) => [value]) : points;
        const result = bspline(clampedT, degree, inputPoints, knots);
        if (isScalar) {
            return Array.isArray(result) && Number.isFinite(result[0]) ? result[0] : points[0];
        }
        return result;
    },

    /**
     * @param {string} input
     * @returns {{ parts: Array<string | { tokenIndex: number }>, tokens: Array<{ value: number, unit: string }> } | null}
     */
    parseStringTemplate: (input) => {
        if (typeof input !== 'string') return null;
        const parts = [];
        const tokens = [];
        const re = /-?\d*\.?\d+(?:e[+-]?\d+)?/ig;
        let lastIndex = 0;
        let match = null;

        while ((match = re.exec(input)) !== null) {
            const start = match.index;
            const end = re.lastIndex;
            if (start > 0 && input[start - 1] === '#') {
                continue;
            }

            const unitMatch = /^[a-z%]+/i.exec(input.slice(end));
            const unit = unitMatch ? unitMatch[0] : '';
            const tokenEnd = end + unit.length;

            parts.push(input.slice(lastIndex, start));
            parts.push({ tokenIndex: tokens.length });
            tokens.push({ value: Number(match[0]), unit });

            lastIndex = tokenEnd;
            re.lastIndex = tokenEnd;
        }

        parts.push(input.slice(lastIndex));
        return { parts, tokens };
    },

    /**
     * @param {{ parts: Array<string | { tokenIndex: number }>, tokens: Array<{ value: number, unit: string }> }} template
     * @param {number[]} values
     * @returns {string}
     */
    buildStringFromTemplate: (template, values) => {
        if (!template) return '';
        return template.parts
            .map((part) => {
                if (part && typeof part === 'object' && part.tokenIndex != null) {
                    const index = part.tokenIndex;
                    const unit = template.tokens[index]?.unit ?? '';
                    const raw = values[index];
                    const numeric = Number(raw);
                    const fallback = template.tokens[index]?.value ?? 0;
                    const value = Number.isFinite(numeric) ? numeric : fallback;
                    return `${value}${unit}`;
                }
                return part;
            })
            .join('');
    },

    /**
     * @param {Array<number | null>} values
     * @param {number[] | null} [offsets]
     * @returns {number[]}
     */
    fillMissingValues: (values, offsets = null) => {
        const result = values.slice();
        const n = result.length;
        const isValid = (value) => Number.isFinite(Number(value));

        for (let i = 0; i < n; i += 1) {
            if (isValid(result[i])) continue;
            let prev = i - 1;
            while (prev >= 0 && !isValid(result[prev])) prev -= 1;
            let next = i + 1;
            while (next < n && !isValid(result[next])) next += 1;

            if (prev >= 0 && next < n) {
                const start = Number(result[prev]);
                const end = Number(result[next]);
                if (offsets && Number.isFinite(offsets[prev]) && Number.isFinite(offsets[next])) {
                    const span = offsets[next] - offsets[prev];
                    const t = span === 0 ? 0 : (offsets[i] - offsets[prev]) / span;
                    result[i] = start + (end - start) * t;
                } else {
                    const t = (i - prev) / (next - prev);
                    result[i] = start + (end - start) * t;
                }
            } else if (prev >= 0) {
                result[i] = Number(result[prev]);
            } else if (next < n) {
                result[i] = Number(result[next]);
            } else {
                result[i] = 0;
            }
        }

        return result;
    },

    /**
     * Build dense keyframes using spline interpolation.
     * @param {DiscoKeyframe[]} keyframes
     * @param {DiscoKeyframeOptions} [options]
     * @returns {DiscoKeyframe[]}
     */
    splineKeyframes: (keyframes, options = {}) => {
        const steps = options.steps ?? 24;
        const props = options.props || [];
        const staticProps = options.staticProps || [];
        const transform = options.transform || null;
        const stringProps = options.stringProps || [];

        if (!Array.isArray(keyframes) || keyframes.length < 2) return keyframes;

        const offsets = DiscoAnimations.normalizeOffsets(keyframes);
        const channels = {};
        props.forEach((prop) => {
            const values = [];
            const propOffsets = [];
            keyframes.forEach((kf, index) => {
                const value = kf?.[prop];
                if (value == null) return;
                const numeric = Number(value);
                if (!Number.isFinite(numeric)) return;
                values.push(numeric);
                propOffsets.push(offsets[index]);
            });
            if (values.length > 0) {
                channels[prop] = { values, offsets: propOffsets };
            }
        });

        const base = {};
        staticProps.forEach((prop) => {
            if (keyframes[0] && keyframes[0][prop] != null) {
                base[prop] = keyframes[0][prop];
            }
        });

        const stringTemplates = {};
        const stringChannels = {};
        const stringOffsets = {};
        const stringEndpoints = {};
        stringProps.forEach((prop) => {
            const firstDefined = keyframes.find((kf) => typeof kf?.[prop] === 'string');
            const first = DiscoAnimations.parseStringTemplate(firstDefined?.[prop]);
            if (!first || first.tokens.length === 0) return;

            const tokenCount = first.tokens.length;
            const channels = Array.from({ length: tokenCount }, () => []);
            const propOffsets = [];
            let valid = true;

            keyframes.forEach((kf, index) => {
                const value = kf?.[prop];
                if (value == null) return;

                const parsed = DiscoAnimations.parseStringTemplate(value);
                if (!parsed || parsed.tokens.length !== tokenCount) {
                    valid = false;
                    return;
                }
                for (let i = 0; i < tokenCount; i += 1) {
                    if (parsed.tokens[i].unit !== first.tokens[i].unit) {
                        valid = false;
                        return;
                    }
                    channels[i].push(parsed.tokens[i].value);
                }
                propOffsets.push(offsets[index]);
            });

            if (!valid || propOffsets.length === 0) return;
            stringTemplates[prop] = first;
            stringChannels[prop] = channels;
            stringOffsets[prop] = propOffsets;
            stringEndpoints[prop] = {
                start: keyframes[0]?.[prop],
                end: keyframes[keyframes.length - 1]?.[prop]
            };
        });

        const dense = [];
        for (let i = 0; i <= steps; i += 1) {
            const t = i / steps;
            const frame = { offset: t, ...base };
            const values = {};
            props.forEach((prop) => {
                const channel = channels[prop];
                if (!channel) return;
                const paramT = DiscoAnimations.mapTimeToParam(channel.offsets, t);
                const v = DiscoAnimations.splineSample(channel.values, paramT);
                frame[prop] = v;
                values[prop] = v;
            });
            if (typeof transform === 'function') {
                frame.transform = transform(values);
            }

            Object.keys(stringChannels).forEach((prop) => {
                const channels = stringChannels[prop];
                const propOffsets = stringOffsets[prop];
                const paramT = DiscoAnimations.mapTimeToParam(propOffsets, t);
                const tokenValues = channels.map((channel) => DiscoAnimations.splineSample(channel, paramT));
                frame[prop] = DiscoAnimations.buildStringFromTemplate(stringTemplates[prop], tokenValues);
                if (i === 0 && stringEndpoints[prop]?.start) {
                    frame[prop] = stringEndpoints[prop].start;
                }
                if (i === steps && stringEndpoints[prop]?.end) {
                    frame[prop] = stringEndpoints[prop].end;
                }
            });
            dense.push(frame);
        }

        return dense;
    },

    /**
     * Build dense keyframes using linear interpolation.
     * @param {DiscoKeyframe[]} keyframes
     * @param {DiscoKeyframeOptions} [options]
     * @returns {DiscoKeyframe[]}
     */
    linearKeyframes: (keyframes, options = {}) => {
        const steps = options.steps ?? 24;
        const props = options.props || [];
        const staticProps = options.staticProps || [];
        const transform = options.transform || null;
        const stringProps = options.stringProps || [];

        if (!Array.isArray(keyframes) || keyframes.length < 2) return keyframes;

        const offsets = DiscoAnimations.normalizeOffsets(keyframes);
        const channels = {};
        props.forEach((prop) => {
            const values = [];
            const propOffsets = [];
            keyframes.forEach((kf, index) => {
                const value = kf?.[prop];
                if (value == null) return;
                const numeric = Number(value);
                if (!Number.isFinite(numeric)) return;
                values.push(numeric);
                propOffsets.push(offsets[index]);
            });
            if (values.length > 0) {
                channels[prop] = { values, offsets: propOffsets };
            }
        });

        const base = {};
        staticProps.forEach((prop) => {
            if (keyframes[0] && keyframes[0][prop] != null) {
                base[prop] = keyframes[0][prop];
            }
        });

        const stringTemplates = {};
        const stringChannels = {};
        const stringOffsets = {};
        const stringEndpoints = {};
        stringProps.forEach((prop) => {
            const firstDefined = keyframes.find((kf) => typeof kf?.[prop] === 'string');
            const first = DiscoAnimations.parseStringTemplate(firstDefined?.[prop]);
            if (!first || first.tokens.length === 0) return;

            const tokenCount = first.tokens.length;
            const channels = Array.from({ length: tokenCount }, () => []);
            const propOffsets = [];
            let valid = true;

            keyframes.forEach((kf, index) => {
                const value = kf?.[prop];
                if (value == null) return;

                const parsed = DiscoAnimations.parseStringTemplate(value);
                if (!parsed || parsed.tokens.length !== tokenCount) {
                    valid = false;
                    return;
                }
                for (let i = 0; i < tokenCount; i += 1) {
                    if (parsed.tokens[i].unit !== first.tokens[i].unit) {
                        valid = false;
                        return;
                    }
                    channels[i].push(parsed.tokens[i].value);
                }
                propOffsets.push(offsets[index]);
            });

            if (!valid || propOffsets.length === 0) return;
            stringTemplates[prop] = first;
            stringChannels[prop] = channels;
            stringOffsets[prop] = propOffsets;
            stringEndpoints[prop] = {
                start: keyframes[0]?.[prop],
                end: keyframes[keyframes.length - 1]?.[prop]
            };
        });

        const dense = [];
        for (let i = 0; i <= steps; i += 1) {
            const t = i / steps;
            const frame = { offset: t, ...base };
            const values = {};
            props.forEach((prop) => {
                const channel = channels[prop];
                if (!channel) return;
                const v = DiscoAnimations.sampleLinear(channel.values, channel.offsets, t);
                frame[prop] = v;
                values[prop] = v;
            });
            if (typeof transform === 'function') {
                frame.transform = transform(values);
            }

            Object.keys(stringChannels).forEach((prop) => {
                const channels = stringChannels[prop];
                const propOffsets = stringOffsets[prop];
                const tokenValues = channels.map((channel) => DiscoAnimations.sampleLinear(channel, propOffsets, t));
                frame[prop] = DiscoAnimations.buildStringFromTemplate(stringTemplates[prop], tokenValues);
                if (i === 0 && stringEndpoints[prop]?.start) {
                    frame[prop] = stringEndpoints[prop].start;
                }
                if (i === steps && stringEndpoints[prop]?.end) {
                    frame[prop] = stringEndpoints[prop].end;
                }
            });
            dense.push(frame);
        }

        return dense;
    },

    /**
     * Infer spline options from provided keyframes.
     * @param {DiscoKeyframe[]} keyframes
     * @param {DiscoSplineOptions} [base]
     * @returns {DiscoSplineOptions}
     */
    inferSplineOptions: (keyframes, base = {}) => {
        if (!Array.isArray(keyframes) || keyframes.length === 0) {
            return { ...base };
        }

        const numericProps = new Set();
        const stringProps = new Set(base.stringProps || []);
        const defaultStringProps = ['transform', 'filter', 'backdropFilter'];

        keyframes.forEach((kf) => {
            if (!kf) return;
            Object.keys(kf).forEach((key) => {
                if (key === 'offset') return;
                const value = kf[key];
                if (typeof value === 'number' && Number.isFinite(value)) {
                    numericProps.add(key);
                } else if (typeof value === 'string' && defaultStringProps.includes(key)) {
                    stringProps.add(key);
                }
            });
        });

        const staticProps = new Set(base.staticProps || []);
        const first = keyframes[0] || {};
        Object.keys(first).forEach((key) => {
            if (key === 'offset') return;
            if (numericProps.has(key)) return;
            if (stringProps.has(key)) return;
            staticProps.add(key);
        });

        return {
            ...base,
            props: base.props || Array.from(numericProps),
            stringProps: Array.from(stringProps),
            staticProps: Array.from(staticProps)
        };
    },

    /**
     * @param {Array<{ target?: Element, delay?: number, run: () => Promise<unknown> | Animation | void }>} items
     * @returns {Promise<void>}
     */
    animateAll: async (items) => {
        const list = Array.isArray(items) ? items : [];
        list.forEach((item) => {
            const target = item?.target;
            if (!(target instanceof Element)) return;
            if (!animationVisibilityCache.has(target)) {
                animationVisibilityCache.set(target, target.style.visibility);
            }
            target.style.visibility = 'hidden';
        });

        const results = list.map((item) => new Promise((resolve, reject) => {
            const start = () => {
                try {
                    const target = item?.target;
                    if (target instanceof Element) {
                        const previous = animationVisibilityCache.get(target);
                        if (previous != null) {
                            target.style.visibility = previous;
                        } else {
                            target.style.visibility = '';
                        }
                    }
                    const result = item?.run?.();
                    if (result && typeof result === 'object' && typeof result.finished?.then === 'function') {
                        result.finished.then(resolve, reject);
                        return;
                    }
                    if (result && typeof result.then === 'function') {
                        result.then(resolve, reject);
                        return;
                    }
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            const delay = Number(item?.delay) || 0;
            if (delay > 0) {
                window.setTimeout(start, delay);
            } else {
                start();
            }
        }));
        await Promise.all(results);
    },

    /**
     * @param {Element} target
     * @param {DiscoKeyframe[] | Keyframe[]} keyframes
     * @param {DiscoAnimateOptions} [options]
     * @returns {Animation}
     */
    animate: (target, keyframes, options = {}) => {
        const { spline, ...rest } = options;
        const duration = rest.duration ?? 300;
        const derivedSteps = Math.max(2, Math.round((duration / 1000) * 60));
        const resolvedSpline = spline === true ? {} : spline;
        const baseSplineOptions = resolvedSpline
            ? {
                steps: resolvedSpline.steps ?? derivedSteps,
                props: resolvedSpline.props,
                staticProps: resolvedSpline.staticProps,
                transform: resolvedSpline.transform,
                stringProps: resolvedSpline.stringProps
            }
            : null;
        const splineOptions = baseSplineOptions
            ? DiscoAnimations.inferSplineOptions(keyframes, baseSplineOptions)
            : null;
        const frames = splineOptions ? DiscoAnimations.splineKeyframes(keyframes, splineOptions) : keyframes;
        const easing = rest.easing;
        return target.animate(frames, { ...rest, easing });
    },
    animationSet
};
export default DiscoAnimations;