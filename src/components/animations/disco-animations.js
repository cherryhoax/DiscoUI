import './disco-animations.css';
import bspline from 'b-spline';

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

    perspective: '1000px',

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
    }
};
export default DiscoAnimations;