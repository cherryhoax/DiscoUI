import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import styles from './disco-scroll-view.scss';

/**
 * Scroll view with touch/mouse momentum, overscroll, and nested scrolling support.
 * Snap-back speed scales with release velocity for a more responsive bounce.
 * @extends DiscoUIElement
 */
class DiscoScrollView extends DiscoUIElement {
    static get observedAttributes() {
        return ['direction'];
    }

    /**
     * @constructor
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.loadStyle(styles, this.shadowRoot);

        this._wrapper = document.createElement('div');
        this._wrapper.className = 'scroll-content';
        this._wrapper.appendChild(document.createElement('slot'));
        this.shadowRoot.appendChild(this._wrapper);

        // State
        this._isDragging = false;
        this._lastPos = { x: 0, y: 0 };
        this._velocity = { x: 0, y: 0 };
        this._rafId = null;
        this._lastTimestamp = 0;
        this._isScrolling = false;
        this._isAnimating = false;

        // Overscroll state
        this._overscrollX = 0;
        this._overscrollY = 0;
        this._maxOverscroll = 120;
        this._virtualX = 0;
        this._virtualY = 0;
        this._snapBackRaf = null;
        this._snapBackStart = 0;
        this._snapBackDuration = 187;
        this._snapBackActiveX = false;
        this._snapBackActiveY = false;
        this._snapBackLast = 0;
        this._snapBackVX = 0;
        this._snapBackVY = 0;
        this._springK = 180;
        this._springC = 27;
        this._snapBackMaxScale = 3.0;
        this._snapBackSpeedMax = 1200; // px/sec
        this._snapBackSpeedX = 0;
        this._snapBackSpeedY = 0;
        this._momentumVX = 0;
        this._momentumVY = 0;
        this._bounceVelocityThreshold = 80; // px/sec
        this._minBounce = 5; // px

        // Animation target
        this._targetX = null;
        this._targetY = null;
        this._amplitudeX = 0;
        this._amplitudeY = 0;
        this._timeConstant = 400; // ms
        this._timestampStart = 0;

        this._nestedScrollView = null;

        // Bindings
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onPointerCancel = this._onPointerCancel.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._update = this._update.bind(this);

        this._capturePointer = true;

        // Setup events
        this.addEventListener('pointerdown', this._onPointerDown);
        //this.addEventListener('wheel', this._onWheel, { passive: false });

        // Observers
        this._resizeObserver = new ResizeObserver(() => this._updateMetrics());
        this._resizeObserver.observe(this);

        this._mutationObserver = new MutationObserver(() => { });
        this._mutationObserver.observe(this, { childList: true, subtree: true });
    }

    connectedCallback() {
        this._updateMetrics();
    }

    disconnectedCallback() {
        this._resizeObserver.disconnect();
        this._mutationObserver.disconnect();
        this._stopAnimation();
    }


    get direction() {
        return this.getAttribute('direction') || 'both';
    }

    set direction(val) {
        if (!val || val === 'both') {
            this.removeAttribute('direction');
            return;
        }
        this.setAttribute('direction', val);
    }

    /**
     * @param {string | null | undefined} value
     * @returns {'horizontal' | 'vertical' | 'both'}
     */
    _normalizeDirection(value) {
        const dir = (value || '').toLowerCase();
        if (dir === 'horizontal' || dir === 'vertical') return dir;
        return 'both';
    }

    /**
     * @param {Event} e
     * @returns {DiscoScrollView | null}
     */
    _getNestedScrollViewFromEvent(e) {
        if (!e || typeof e.composedPath !== 'function') return null;
        const path = e.composedPath();
        for (const node of path) {
            if (node === this) break;
            if (node instanceof DiscoScrollView) return node;
        }
        return null;
    }

    /**
     * @param {Event} e
     * @returns {DiscoScrollView | null}
     */
    _getParentScrollViewFromEvent(e) {
        if (!e || typeof e.composedPath !== 'function') return null;
        const path = e.composedPath();
        let seenSelf = false;
        for (const node of path) {
            if (node === this) {
                seenSelf = true;
                continue;
            }
            if (!seenSelf) continue;
            if (node instanceof DiscoScrollView) return node;
        }
        return null;
    }

    /**
     * @param {PointerEvent} e
     * @param {boolean} isHorizontalMove
     * @param {number} moveDx
     * @param {number} moveDy
     * @returns {DiscoScrollView | null}
     */
    _getScrollableAncestorForHandoff(e, isHorizontalMove, moveDx, moveDy) {
        if (!e || typeof e.composedPath !== 'function') return null;
        const path = e.composedPath();
        let seenSelf = false;
        for (const node of path) {
            if (node === this) {
                seenSelf = true;
                continue;
            }
            if (!seenSelf) continue;
            if (!(node instanceof DiscoScrollView)) continue;
            if (!this._canScrollInAxis(node, isHorizontalMove)) continue;

            const atHorizontalEdge =
                (node.scrollLeft <= 0 && moveDx > 0) ||
                (node.scrollLeft >= node.maxScrollLeft && moveDx < 0);
            const atVerticalEdge =
                (node.scrollTop <= 0 && moveDy > 0) ||
                (node.scrollTop >= node.maxScrollTop && moveDy < 0);

            if ((isHorizontalMove && atHorizontalEdge) || (!isHorizontalMove && atVerticalEdge)) {
                continue;
            }

            return node;
        }
        return null;
    }

    /**
     * @param {PointerEvent} e
     * @param {DiscoScrollView} target
     */
    _handoffToTarget(e, target) {
        this._cancelDrag();
        try { this.releasePointerCapture(e.pointerId); } catch (err) { }
        this._virtualX = this.scrollLeft;
        this._virtualY = this.scrollTop;
        this._overscrollX = 0;
        this._overscrollY = 0;
        this._renderOverscroll(0, 0);

        const cloneEvent = (type) => new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            pointerId: e.pointerId,
            isPrimary: e.isPrimary,
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY,
            button: e.button,
            buttons: e.buttons
        });

        target.dispatchEvent(cloneEvent('pointerdown'));
        target.dispatchEvent(cloneEvent('pointermove'));
    }

    /**
     * @param {PointerEvent} e
     * @param {DiscoScrollView} parent
     * @param {boolean} isHorizontalMove
     * @param {number} moveDx
     * @param {number} moveDy
     */
    _handoffToParent(e, parent, isHorizontalMove, moveDx, moveDy) {
        parent._handoffChild = this;
        parent._handoffAxis = isHorizontalMove ? 'horizontal' : 'vertical';
        parent._handoffOrigin = { x: parent.scrollLeft, y: parent.scrollTop };
        parent._handoffDirection = { x: Math.sign(moveDx), y: Math.sign(moveDy) };
        if (typeof parent._snapToNearestPage === 'function') {
            parent._handoffSnap = true;
        }
        this._handoffToTarget(e, parent);
    }

    /**
     * @param {PointerEvent} e
     * @param {DiscoScrollView} child
     */
    _handoffToChild(e, child) {
        this._clearHandoff();
        this._handoffToTarget(e, child);
    }

    _clearHandoff() {
        this._handoffChild = null;
        this._handoffAxis = null;
        this._handoffOrigin = null;
        this._handoffDirection = null;
    }

    /**
     * @param {DiscoScrollView} view
     * @param {boolean} isHorizontal
     * @returns {boolean}
     */
    _canScrollInAxis(view, isHorizontal) {
        const dir = this._normalizeDirection(view.direction || view.getAttribute('direction'));
        if (dir === 'horizontal' && !isHorizontal) return false;
        if (dir === 'vertical' && isHorizontal) return false;

        const overscrollMode = (view.getAttribute('overscroll-mode') || '').toLowerCase();
        if (overscrollMode === 'loop') return true;

        const maxScroll = isHorizontal ? view.maxScrollLeft : view.maxScrollTop;
        return Number(maxScroll) > 0;
    }

    _removePointerListeners() {
        this.removeEventListener('pointermove', this._onPointerMove);
        this.removeEventListener('pointerup', this._onPointerUp);
        this.removeEventListener('pointercancel', this._onPointerCancel);
    }

    _cancelDrag() {
        this._isDragging = false;
        this._isPreDragging = false;
        this._nestedScrollView = null;
        this._removePointerListeners();
    }

    get maxScrollLeft() {
        return this.scrollWidth - this.clientWidth;
    }

    get maxScrollTop() {
        return this.scrollHeight - this.clientHeight;
    }

    /**
     * @param {PointerEvent} e
     */
    _onPointerDown(e) {
        this._nestedScrollView = this._getNestedScrollViewFromEvent(e);
        const tiltTarget = e.composedPath().find((node) =>
            node instanceof DiscoUIElement && node.tiltEnabled
        );
        // Stop any ongoing animation
        this._stopAnimation();
        this._wrapper.style.transition = '';
        if (this._snapBackRaf) {
            cancelAnimationFrame(this._snapBackRaf);
            this._snapBackRaf = null;
        }
        this._snapBackActiveX = false;
        this._snapBackActiveY = false;
        
        // Initialize pre-drag state instead of capturing immediately
        this._isDragging = false;
        this._isPreDragging = true;
        this._startDragPos = { x: e.clientX, y: e.clientY };
        this._lastPos = { x: e.clientX, y: e.clientY };
        this._velocity = { x: 0, y: 0 };
        this._lastTimestamp = performance.now();
        this._virtualX = this.scrollLeft - (this._overscrollX * 2);
        this._virtualY = this.scrollTop - (this._overscrollY * 2);

        this.addEventListener('pointermove', this._onPointerMove);
        this.addEventListener('pointerup', this._onPointerUp);
        this.addEventListener('pointercancel', this._onPointerCancel);
    }

    /**
     * @param {PointerEvent} e
     */
    _onPointerMove(e) {
        if (this._isPreDragging) {
            if (!this._capturePointer) return;
            
            const dx = Math.abs(e.clientX - this._startDragPos.x);
            const dy = Math.abs(e.clientY - this._startDragPos.y);
            const threshold = 5; // px

            if (dx < threshold && dy < threshold) return;

            const isHorizontal = dx > dy;

            // Check if captured by a nested view during the wait
            const nested = this._nestedScrollView;
            if (nested && nested !== this) {
                if (nested.hasPointerCapture(e.pointerId) || this._canScrollInAxis(nested, isHorizontal)) {
                    this._cancelDrag();
                    return;
                }
            }

            const direction = this.direction;
            let shouldCapture = false;

            if (direction === 'both') shouldCapture = true;
            else if (direction === 'horizontal' && isHorizontal) shouldCapture = true;
            else if (direction === 'vertical' && !isHorizontal) shouldCapture = true;

            if (shouldCapture) {
                if (!this._canScrollInAxis(this, isHorizontal)) {
                    this._isPreDragging = false;
                    return;
                }
                this._isPreDragging = false;
                this._isDragging = true;
                this.setPointerCapture(e.pointerId);
                // Reset lastPos so the move starts smoothly from here
                this._lastPos = { x: e.clientX, y: e.clientY };
                return;
            } else {
                // Not our direction
                this._isPreDragging = false;
                return;
            }
        }

        if (!this._isDragging) return;

        const moveDx = e.clientX - this._lastPos.x;
        const moveDy = e.clientY - this._lastPos.y;
        const absX = Math.abs(moveDx);
        const absY = Math.abs(moveDy);
        const isHorizontalMove = absX >= absY;
        const direction = this.direction;

        const atHorizontalEdge =
            (this.scrollLeft <= 0 && moveDx > 0) ||
            (this.scrollLeft >= this.maxScrollLeft && moveDx < 0);
        const atVerticalEdge =
            (this.scrollTop <= 0 && moveDy > 0) ||
            (this.scrollTop >= this.maxScrollTop && moveDy < 0);

        if (this._handoffChild && this._handoffAxis) {
            const axis = this._handoffAxis;
            const handoffDir = axis === 'horizontal'
                ? this._handoffDirection?.x
                : this._handoffDirection?.y;
            const currentDir = axis === 'horizontal'
                ? Math.sign(moveDx)
                : Math.sign(moveDy);
            const origin = this._handoffOrigin || { x: 0, y: 0 };
            if (handoffDir && currentDir && currentDir === -handoffDir) {
                const atOrPastOrigin = axis === 'horizontal'
                    ? (handoffDir > 0 ? this.scrollLeft >= origin.x : this.scrollLeft <= origin.x)
                    : (handoffDir > 0 ? this.scrollTop >= origin.y : this.scrollTop <= origin.y);
                if (atOrPastOrigin) {
                    const child = this._handoffChild;
                    this._handoffToChild(e, child);
                    return;
                }
            }
        }

        const overscrollMode = (this.getAttribute('overscroll-mode') || '').toLowerCase();
        const loopEnabled = overscrollMode === 'loop';
        const shouldHandoff = !loopEnabled && (
            (direction === 'horizontal' && atHorizontalEdge) ||
            (direction === 'vertical' && atVerticalEdge) ||
            (direction === 'both' && (isHorizontalMove ? atHorizontalEdge : atVerticalEdge))
        );

        if (shouldHandoff) {
            const parent = this._getScrollableAncestorForHandoff(e, isHorizontalMove, moveDx, moveDy);
            if (parent) {
                this._handoffToParent(e, parent, isHorizontalMove, moveDx, moveDy);
                return;
            }
        }

        const now = performance.now();
        const dt = now - this._lastTimestamp;

        let dx = moveDx;
        let dy = moveDy;
        if (direction === 'horizontal') dy = 0;
        if (direction === 'vertical') dx = 0;

        // Direct manipulation
        this._handleMove(dx, dy);

        // Calculate instantaneous velocity (pixels per ms)
        if (dt > 0) {
            // Exponential moving average for smoother velocity
            const alpha = 0.8;
            this._velocity.x = alpha * (dx / dt) + (1 - alpha) * this._velocity.x;
            this._velocity.y = alpha * (dy / dt) + (1 - alpha) * this._velocity.y;
        }

        this._lastPos = { x: e.clientX, y: e.clientY };
        this._lastTimestamp = now;
    }

    _handleMove(dx, dy) {
        this._virtualX -= dx;
        this._virtualY -= dy;

        const resistance = 0.5;
        const { clampedX, clampedY, overscrollX, overscrollY } = this._computeOverscroll(this._virtualX, this._virtualY, resistance);

        if (overscrollX !== 0) {
            this._virtualX = clampedX - (overscrollX / resistance);
        }
        if (overscrollY !== 0) {
            this._virtualY = clampedY - (overscrollY / resistance);
        }

        this.scrollLeft = clampedX;
        this.scrollTop = clampedY;

        this._overscrollX = overscrollX;
        this._overscrollY = overscrollY;
        this._renderOverscroll(overscrollX, overscrollY);
        this._emitScroll();
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} [resistance=0.5]
     * @returns {{ clampedX: number, clampedY: number, overscrollX: number, overscrollY: number }}
     */
    _computeOverscroll(x, y, resistance = 0.5) {
        const maxX = Math.max(0, this.maxScrollLeft);
        const maxY = Math.max(0, this.maxScrollTop);

        const clampedX = Math.max(0, Math.min(x, maxX))
        const clampedY = Math.max(0, Math.min(y, maxY));

        let overscrollX = (clampedX - x) * resistance;
        let overscrollY = (clampedY - y) * resistance;

        if (maxX === 0) overscrollX = 0;
        if (maxY === 0) overscrollY = 0;

        overscrollX = Math.max(-this._maxOverscroll, Math.min(overscrollX, this._maxOverscroll));
        overscrollY = Math.max(-this._maxOverscroll, Math.min(overscrollY, this._maxOverscroll));

        return { clampedX, clampedY, overscrollX, overscrollY };
    }


    /**
     * Defines the visual overscroll appearance
     * @param {number} x 
     * @param {number} y 
     */
    _renderOverscroll(x, y) {
        // Apply transform to the wrapper
        if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) {
            this._wrapper.style.transform = '';
            return;
        }
        const minScale = 0.9;
        const scaleX = 1 - (Math.min(this._maxOverscroll, Math.abs(x)) / this._maxOverscroll) * (1 - minScale);
        const scaleY = 1 - (Math.min(this._maxOverscroll, Math.abs(y)) / this._maxOverscroll) * (1 - minScale);
        Object.assign(this._wrapper.style, {
            "-webkit-transform-origin-x": x < 0 ? '0%' : '100%',
            "-webkit-transform-origin-y": y < 0 ? '100%' : '0%',
            transform: `translate3d(${x}px, ${y}px, 0) scale(${scaleX}, ${scaleY})`
        });
    }

    /**
     * @param {PointerEvent} e
     */
    _onPointerUp(e) {
        this._isDragging = false;
        this._isPreDragging = false;
        this._nestedScrollView = null;
        this._clearHandoff();
        try { this.releasePointerCapture(e.pointerId); } catch (err) { }
        this._removePointerListeners();
        this._virtualX = this.scrollLeft;
        this._virtualY = this.scrollTop;

        const overscrollX = Math.abs(this._overscrollX) > 1;
        const overscrollY = Math.abs(this._overscrollY) > 1;

        this._snapBackSpeedX = Math.abs(this._velocity.x * 1000);
        this._snapBackSpeedY = Math.abs(this._velocity.y * 1000);

        if (overscrollX || overscrollY) {
            if (overscrollX && overscrollY) {
                this._snapBack(true, true);
                return;
            }
            if (overscrollX) {
                this._velocity.x = 0;
                this._snapBack(true, false, false);
            }
            if (overscrollY) {
                this._velocity.y = 0;
                this._snapBack(false, true, false);
            }
        }

        this._launchMomentum();
    }

    /**
     * @param {PointerEvent} e
     */
    _onPointerCancel(e) {
        this._isDragging = false;
        this._isPreDragging = false;
        this._nestedScrollView = null;
        this._clearHandoff();
        try { this.releasePointerCapture(e.pointerId); } catch (err) { }
        this._removePointerListeners();
        this._virtualX = this.scrollLeft;
        this._virtualY = this.scrollTop;

        const overscrollX = Math.abs(this._overscrollX) > 1;
        const overscrollY = Math.abs(this._overscrollY) > 1;

        this._snapBackSpeedX = Math.abs(this._velocity.x * 1000);
        this._snapBackSpeedY = Math.abs(this._velocity.y * 1000);

        if (overscrollX || overscrollY) {
            this._velocity.x = 0;
            this._velocity.y = 0;
            this._snapBack(overscrollX, overscrollY, true);
        }

        this._stopAnimation();
    }

    /**
     * @param {number} speedPxPerSec
     * @returns {number}
     */
    _getSnapBackScale(speedPxPerSec) {
        const capped = Math.max(0, Math.min(speedPxPerSec, this._snapBackSpeedMax));
        const t = this._snapBackSpeedMax === 0 ? 0 : (capped / this._snapBackSpeedMax);
        const curved = t * t;
        return 1 + curved * (this._snapBackMaxScale - 1);
    }

    _snapBack(snapX = true, snapY = true, stopMomentum = true) {
        if (stopMomentum) {
            this._stopAnimation();
        }
        if (this._snapBackRaf) {
            cancelAnimationFrame(this._snapBackRaf);
            this._snapBackRaf = null;
        }

        if (snapX) this._snapBackActiveX = true;
        if (snapY) this._snapBackActiveY = true;

        this._virtualX = this.scrollLeft;
        this._virtualY = this.scrollTop;

        const startX = snapX ? this._overscrollX : 0;
        const startY = snapY ? this._overscrollY : 0;
        if (Math.abs(startX) < 0.5 && Math.abs(startY) < 0.5) {
            if (snapX) this._overscrollX = 0;
            if (snapY) this._overscrollY = 0;
            this._renderOverscroll(this._overscrollX, this._overscrollY);
            return;
        }

        const speedX = snapX
            ? (stopMomentum ? this._snapBackSpeedX : Math.abs(this._momentumVX))
            : 0;
        const speedY = snapY
            ? (stopMomentum ? this._snapBackSpeedY : Math.abs(this._momentumVY))
            : 0;
        const scaleX = this._getSnapBackScale(speedX);
        const scaleY = this._getSnapBackScale(speedY);

        this._snapBackStart = performance.now();
        this._snapBackLast = this._snapBackStart;
        this._snapBackVX = 0;
        this._snapBackVY = 0;
        const animate = (now) => {
            const dt = Math.min(0.032, (now - this._snapBackLast) / 1000);
            this._snapBackLast = now;

            let doneX = !snapX;
            let doneY = !snapY;

            if (snapX) {
                const springKX = this._springK * scaleX;
                const springCX = this._springC * (1 + (scaleX - 1) * 0.55);
                const ax = (-springKX * this._overscrollX) - (springCX * this._snapBackVX);
                this._snapBackVX += ax * dt;
                this._overscrollX += this._snapBackVX * dt;
                if (Math.abs(this._overscrollX) < 0.5 && Math.abs(this._snapBackVX) < 0.02) {
                    this._overscrollX = 0;
                    this._snapBackVX = 0;
                    doneX = true;
                }
            }

            if (snapY) {
                const springKY = this._springK * scaleY;
                const springCY = this._springC * (1 + (scaleY - 1) * 0.55);
                const ay = (-springKY * this._overscrollY) - (springCY * this._snapBackVY);
                this._snapBackVY += ay * dt;
                this._overscrollY += this._snapBackVY * dt;
                if (Math.abs(this._overscrollY) < 0.5 && Math.abs(this._snapBackVY) < 0.02) {
                    this._overscrollY = 0;
                    this._snapBackVY = 0;
                    doneY = true;
                }
            }

            this._renderOverscroll(this._overscrollX, this._overscrollY);

            if (!(doneX && doneY)) {
                this._snapBackRaf = requestAnimationFrame(animate);
            } else {
                this._snapBackRaf = null;
                if (snapX) this._snapBackActiveX = false;
                if (snapY) this._snapBackActiveY = false;
                this._renderOverscroll(this._overscrollX, this._overscrollY);
                this._markScrollEndIfIdle();
            }
        };

        this._snapBackRaf = requestAnimationFrame(animate);
    }


    /**
     * @param {WheelEvent} e
     */
    _onWheel(e) {
        const nestedScrollView = this._getNestedScrollViewFromEvent(e);
        if (nestedScrollView && nestedScrollView !== this) {
            const absX = Math.abs(e.deltaX);
            const absY = Math.abs(e.deltaY);
            let isHorizontal = absX > absY;
            if (absX === absY) {
                const dir = this._normalizeDirection(this.direction);
                if (dir === 'horizontal') isHorizontal = true;
                if (dir === 'vertical') isHorizontal = false;
            }
            if (this._canScrollInAxis(nestedScrollView, isHorizontal)) return;
        }
        e.preventDefault();
        this._stopAnimation();
        const direction = this.direction;
        const deltaX = direction === 'vertical' ? 0 : e.deltaX;
        const deltaY = direction === 'horizontal' ? 0 : e.deltaY;
        this.scrollLeft += deltaX;
        this.scrollTop += deltaY;
        this._virtualX = this.scrollLeft;
        this._virtualY = this.scrollTop;
        this._overscrollX = 0;
        this._overscrollY = 0;
        this._renderOverscroll(0, 0);
        this._emitScroll();
    }

    _launchMomentum() {
        const timeConstant = 325; // ms

        // Natural destination
        // velocity is px/ms
        // velocity.y < 0 (drag up) => scroll down
        const direction = this.direction;
        const vX = (direction === 'vertical' ? 0 : this._velocity.x * 1000); // px/sec
        const vY = (direction === 'horizontal' ? 0 : this._velocity.y * 1000); // px/sec
        this._momentumVX = vX;
        this._momentumVY = vY;

        let targetX = this.scrollLeft - (vX * (timeConstant / 1000));
        let targetY = this.scrollTop - (vY * (timeConstant / 1000));
        if (direction === 'vertical') targetX = this.scrollLeft;
        if (direction === 'horizontal') targetY = this.scrollTop;

        // No automatic snap points in DiscoScrollView — keep natural momentum destination
        if (targetX < 0 || targetX > this.maxScrollLeft) {
            const overscrollLimit = this._maxOverscroll * 4;
            targetX = Math.max(-overscrollLimit, Math.min(targetX, this.maxScrollLeft + overscrollLimit));
        }
        if (targetY < 0 || targetY > this.maxScrollTop) {
            const overscrollLimit = this._maxOverscroll * 4;
            targetY = Math.max(-overscrollLimit, Math.min(targetY, this.maxScrollTop + overscrollLimit));
        }

        this._targetX = targetX;
        this._targetY = targetY;

        this._amplitudeX = targetX - this.scrollLeft;
        this._amplitudeY = targetY - this.scrollTop;

        this._timestampStart = performance.now();
        this._isAnimating = true;
        this._rafId = requestAnimationFrame(this._update);
    }

    _stopAnimation() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this._isAnimating = false;
    }

    _updateMetrics() {
        // Force browser to recalculate if needed
    }

    _update() {
        const now = performance.now();
        const elapsed = now - this._timestampStart;
        const timeConstant = this._timeConstant;

        if (elapsed > timeConstant * 6) {
            this._stopAnimation();
            if (this._targetX !== null) this.scrollLeft = this._targetX;
            if (this._targetY !== null) this.scrollTop = this._targetY;
            this._emitScroll();
            this._markScrollEndIfIdle();
            return;
        }

        const delta = -elapsed / timeConstant;
        const scrollX = this._targetX - this._amplitudeX * Math.exp(delta);
        const scrollY = this._targetY - this._amplitudeY * Math.exp(delta);

        const overscroll = this._computeOverscroll(scrollX, scrollY, 1.5);
        let { clampedX, clampedY, overscrollX, overscrollY } = overscroll;

        const maxX = Math.max(0, this.maxScrollLeft);
        const maxY = Math.max(0, this.maxScrollTop);
        const atMinX = clampedX <= 0;
        const atMaxX = clampedX >= maxX;
        const atMinY = clampedY <= 0;
        const atMaxY = clampedY >= maxY;

        if (maxX > 0 && !this._snapBackActiveX && overscrollX === 0) {
            if (atMinX && this._momentumVX > this._bounceVelocityThreshold) {
                overscrollX = this._minBounce;
            } else if (atMaxX && this._momentumVX < -this._bounceVelocityThreshold) {
                overscrollX = -this._minBounce;
            }
        }

        if (maxY > 0 && !this._snapBackActiveY && overscrollY === 0) {
            if (atMinY && this._momentumVY > this._bounceVelocityThreshold) {
                overscrollY = this._minBounce;
            } else if (atMaxY && this._momentumVY < -this._bounceVelocityThreshold) {
                overscrollY = -this._minBounce;
            }
        }

        this.scrollLeft = clampedX;
        this.scrollTop = clampedY;

        if (!this._snapBackActiveX) this._overscrollX = overscrollX;
        if (!this._snapBackActiveY) this._overscrollY = overscrollY;
        this._renderOverscroll(this._overscrollX, this._overscrollY);
        this._emitScroll();

        // If momentum hits an edge, allow a visible bounce before snapping back
        if (overscrollX !== 0 || overscrollY !== 0) {
            const snapX = overscrollX !== 0 && !this._snapBackActiveX;
            const snapY = overscrollY !== 0 && !this._snapBackActiveY;

            if (elapsed > timeConstant * .45) {
                if (snapX) {
                    this._targetX = clampedX;
                    this._amplitudeX = 0;
                }
                if (snapY) {
                    this._targetY = clampedY;
                    this._amplitudeY = 0;
                }

                if (snapX || snapY) {
                    this._snapBack(snapX, snapY, false);
                    this._stopAnimation();
                    return;
                }
            }
        }

        this._rafId = requestAnimationFrame(this._update);
    }

    /**
     * Snap candidate detection removed from DiscoScrollView.
     * Flip / Carousel components should provide their own snapping behavior.
     * @returns {Array<{x: number, y: number}>}
     */
    getScrollSnapCandidates() {
        return [];
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {boolean} [animate=false]
     */
    scrollTo(x, y, animate = false) {
        const nativeScrollTo = HTMLElement.prototype.scrollTo || Element.prototype.scrollTo;
        if (nativeScrollTo) {
            if (animate) {
                nativeScrollTo.call(this, { left: x, top: y, behavior: 'smooth' });
            } else {
                nativeScrollTo.call(this, x, y);
            }
            this._emitScroll();
            return;
        }
        this.scrollLeft = x;
        this.scrollTop = y;
        this._emitScroll();
    }

    _emitScroll() {
        this._isScrolling = true;
        this.dispatchEvent(new Event('scroll', { bubbles: true, composed: true }));
    }

    _markScrollEndIfIdle() {
        if (this._isDragging || this._isPreDragging) return;
        if (this._isAnimating) return;
        if (this._snapBackRaf) return;
        this._emitScrollEnd();
    }

    _emitScrollEnd() {
        if (!this._isScrolling) return;
        this._isScrolling = false;
        this.dispatchEvent(new Event('scroll-end', { bubbles: true, composed: true }));
    }

    _hasSnapPoints() {
        // Snap detection removed — ScrollView has no built-in snap points.
        return false;
    }
}

customElements.define('disco-scroll-view', DiscoScrollView);
export default DiscoScrollView;
