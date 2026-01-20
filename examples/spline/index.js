import { DiscoAnimations } from '../../dist/index.js';

const graph = document.getElementById('graph');
const stepsInput = document.getElementById('steps');
const stepsValue = document.getElementById('stepsValue');
const splineToggle = document.getElementById('splineToggle');
const durationInput = document.getElementById('duration');
const durationValue = document.getElementById('durationValue');
const playButton = document.getElementById('play');
const preview = document.getElementById('preview');
const keyframesEditor = document.getElementById('keyframesEditor');
const applyKeyframesButton = document.getElementById('applyKeyframes');
const editorError = document.getElementById('editorError');
const interpolatedOutput = document.getElementById('interpolatedOutput');
const showInterpolatedButton = document.getElementById('showInterpolated');

const getDefaultKeyframes = () => [
    {
        opacity: 1,
        transformOrigin: 'left center',
        transform: `perspective(${DiscoAnimations.perspective}) rotateY(100deg) translateX(120px)`,
        filter: 'blur(20px) brightness(0.8)'
    },
    {
        transform: `perspective(${DiscoAnimations.perspective}) rotateY(0deg) translateX(60px)`,
    },
    {
        opacity: 1,
        transformOrigin: 'left center',
        transform: `perspective(${DiscoAnimations.perspective}) rotateY(0deg) translateX(0px)`,
        filter: 'blur(0px) brightness(1)'
    }
];

let currentKeyframes = getDefaultKeyframes();

const getKeyframes = () => currentKeyframes;

const writeEditor = () => {
    if (keyframesEditor) {
        keyframesEditor.value = JSON.stringify(currentKeyframes, null, 2);
    }
};

const applyEditor = () => {
    if (!keyframesEditor) return false;
    try {
        const parsed = JSON.parse(keyframesEditor.value);
        if (!Array.isArray(parsed)) {
            throw new Error('JSON must be an array of keyframes.');
        }
        currentKeyframes = parsed;
        if (editorError) editorError.textContent = '';
        return true;
    } catch (error) {
        if (editorError) editorError.textContent = error instanceof Error ? error.message : 'Invalid JSON.';
        return false;
    }
};

const parseValue = (input, regex, fallback = 0) => {
    const match = input.match(regex);
    if (!match) return fallback;
    return Number(match[1]);
};

const sampleSeries = (denseFrames) => {
    return denseFrames.map((frame) => ({
        rotate: parseValue(frame.transform || '', /rotateY\(([-\d.]+)deg\)/i, 0),
        translate: parseValue(frame.transform || '', /translateX\(([-\d.]+)px\)/i, 0),
        blur: parseValue(frame.filter || '', /blur\(([-\d.]+)px\)/i, 0)
    }));
};

const drawGraph = (series) => {
    if (!graph) return;
    const ctx = graph.getContext('2d');
    if (!ctx) return;

    const rect = graph.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    graph.width = rect.width * dpr;
    graph.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    const padding = 18;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    const maxRotate = 100;
    const maxTranslate = 140;
    const maxBlur = 8;

    const drawLine = (values, color, maxValue) => {
        ctx.beginPath();
        values.forEach((value, index) => {
            const t = values.length <= 1 ? 0 : index / (values.length - 1);
            const x = padding + t * plotWidth;
            const y = padding + plotHeight - (value / maxValue) * plotHeight;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    ctx.strokeStyle = 'rgba(120, 128, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
        const y = padding + (plotHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    const rotate = series.map((item) => item.rotate);
    const translate = series.map((item) => item.translate);
    const blur = series.map((item) => item.blur);

    drawLine(rotate, '#6f7bff', maxRotate);
    drawLine(translate, '#6fffd0', maxTranslate);
    drawLine(blur, '#ff7bf0', maxBlur);
};

const update = () => {
    const steps = Number(stepsInput?.value || 36);
    const keyframes = getKeyframes();
    const useSpline = splineToggle?.checked ?? true;
    const frames = useSpline
        ? DiscoAnimations.splineKeyframes(keyframes, {
                steps,
                props: ['opacity'],
                staticProps: ['transformOrigin'],
                stringProps: ['transform', 'filter', 'backdropFilter']
            })
        : DiscoAnimations.linearKeyframes(keyframes, {
                steps,
                props: ['opacity'],
                staticProps: ['transformOrigin'],
                stringProps: ['transform', 'filter', 'backdropFilter']
            });
    drawGraph(sampleSeries(frames));
};

const playPreview = () => {
    if (!preview) return;
    const duration = Number(durationInput?.value || 600);
    const steps = Number(stepsInput?.value || 36);
    const keyframes = getKeyframes();
    const useSpline = splineToggle?.checked ?? true;
    const frames = useSpline
        ? keyframes
        : DiscoAnimations.linearKeyframes(keyframes, {
                steps,
                props: ['opacity'],
                staticProps: ['transformOrigin'],
                stringProps: ['transform', 'filter', 'backdropFilter']
            });
    const animation = DiscoAnimations.animate(preview, frames, {
        duration,
        easing: DiscoAnimations.easeOutQuart,
        fill: 'forwards',
        spline: useSpline
            ? {
                    steps,
                    props: ['opacity'],
                    staticProps: ['transformOrigin'],
                    stringProps: ['transform', 'filter', 'backdropFilter']
                }
            : undefined
    });
    animation.finished.catch(() => undefined);
};

const showInterpolated = () => {
    if (!interpolatedOutput) return;
    const steps = Number(stepsInput?.value || 36);
    const keyframes = getKeyframes();
    const useSpline = splineToggle?.checked ?? true;
    const dense = useSpline
        ? DiscoAnimations.splineKeyframes(keyframes, {
                steps,
                props: ['opacity'],
                staticProps: ['transformOrigin'],
                stringProps: ['transform', 'filter', 'backdropFilter']
            })
        : DiscoAnimations.linearKeyframes(keyframes, {
                steps,
                props: ['opacity'],
                staticProps: ['transformOrigin'],
                stringProps: ['transform', 'filter', 'backdropFilter']
            });
    interpolatedOutput.value = JSON.stringify(dense, null, 2);
};

stepsInput?.addEventListener('input', () => {
    stepsValue.textContent = stepsInput.value;
    update();
    showInterpolated();
});

splineToggle?.addEventListener('change', () => {
    update();
    playPreview();
    showInterpolated();
});

durationInput?.addEventListener('input', () => {
    durationValue.textContent = `${durationInput.value}ms`;
});

playButton?.addEventListener('click', () => {
    playPreview();
});

applyKeyframesButton?.addEventListener('click', () => {
    if (applyEditor()) {
        update();
        playPreview();
        showInterpolated();
    }
});

showInterpolatedButton?.addEventListener('click', () => {
    showInterpolated();
});

window.addEventListener('resize', () => {
    update();
});

stepsValue.textContent = stepsInput?.value || '36';
if (durationInput) {
    durationValue.textContent = `${durationInput.value}ms`;
}

writeEditor();
showInterpolated();

update();
playPreview();
