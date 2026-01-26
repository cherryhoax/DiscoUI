import DiscoUIElement from './disco-ui-element.js';
import styles from './disco-scroll-view.scss';

class DiscoScrollView extends DiscoUIElement {
    static get observedAttributes() {
        return ['scroll-snap-stop'];
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
        this._momentumVX = 0;
        this._momentumVY = 0;
        this._bounceVelocityThreshold = 80; // px/sec
        this._minBounce = 20; // px

        // Animation target
        this._targetX = null;
        this._targetY = null;
        this._amplitudeX = 0;
        this._amplitudeY = 0;
        this._timeConstant = 217; // ms
        this._timestampStart = 0;

        // Bindings
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._update = this._update.bind(this);

        // Setup events
        this.addEventListener('pointerdown', this._onPointerDown);
        this.addEventListener('wheel', this._onWheel, { passive: false });

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

    get scrollSnapStop() {
        return this.hasAttribute('scroll-snap-stop');
    }

    set scrollSnapStop(val) {
        if (val) this.setAttribute('scroll-snap-stop', '');
        else this.removeAttribute('scroll-snap-stop');
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
        // Stop any ongoing animation
        this._stopAnimation();
        this._wrapper.style.transition = '';
        if (this._snapBackRaf) {
            cancelAnimationFrame(this._snapBackRaf);
            this._snapBackRaf = null;
        }
        this._snapBackActiveX = false;
        this._snapBackActiveY = false;
        this._isDragging = true;
        this._lastPos = { x: e.clientX, y: e.clientY };
        this._velocity = { x: 0, y: 0 };
        this._lastTimestamp = performance.now();
        this._virtualX = this.scrollLeft - (this._overscrollX * 2);
        this._virtualY = this.scrollTop - (this._overscrollY * 2);

        // Reset overscroll if we are starting a drag (unless we are catching a bounce)
        // For simplicity, we continue from where we are.

        this.setPointerCapture(e.pointerId);
        this.addEventListener('pointermove', this._onPointerMove);
        this.addEventListener('pointerup', this._onPointerUp);
        this.addEventListener('pointercancel', this._onPointerUp);
    }

    /**
     * @param {PointerEvent} e
     */
    _onPointerMove(e) {
        if (!this._isDragging) return;

        const now = performance.now();
        const dt = now - this._lastTimestamp;

        const dx = e.clientX - this._lastPos.x;
        const dy = e.clientY - this._lastPos.y;

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

        const { clampedX, clampedY, overscrollX, overscrollY } = this._computeOverscroll(this._virtualX, this._virtualY);

        this.scrollLeft = clampedX;
        this.scrollTop = clampedY;

        this._overscrollX = overscrollX;
        this._overscrollY = overscrollY;
        this._renderOverscroll(overscrollX, overscrollY);
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

        const clampedX = Math.max(0, Math.min(x, maxX));
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
            "--webkit-transform-origin-x": x < 0 ? 'right' : 'left',
            "--webkit-transform-origin-y": y < 0 ? 'bottom' : 'top',
            transform: `translate3d(${x}px, ${y}px, 0) scale(${scaleX}, ${scaleY})`
        });
    }

    /**
     * @param {PointerEvent} e
     */
    _onPointerUp(e) {
        this._isDragging = false;
        this.releasePointerCapture(e.pointerId);
        this.removeEventListener('pointermove', this._onPointerMove);
        this.removeEventListener('pointerup', this._onPointerUp);
        this.removeEventListener('pointercancel', this._onPointerUp);

        const overscrollX = Math.abs(this._overscrollX) > 1;
        const overscrollY = Math.abs(this._overscrollY) > 1;

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
                const ax = (-this._springK * this._overscrollX) - (this._springC * this._snapBackVX);
                this._snapBackVX += ax * dt;
                this._overscrollX += this._snapBackVX * dt;
                if (Math.abs(this._overscrollX) < 0.5 && Math.abs(this._snapBackVX) < 0.02) {
                    this._overscrollX = 0;
                    this._snapBackVX = 0;
                    doneX = true;
                }
            }

            if (snapY) {
                const ay = (-this._springK * this._overscrollY) - (this._springC * this._snapBackVY);
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
            }
        };

        this._snapBackRaf = requestAnimationFrame(animate);
    }


    /**
     * @param {WheelEvent} e
     */
    _onWheel(e) {
        e.preventDefault();
        this._stopAnimation();
        this.scrollLeft += e.deltaX;
        this.scrollTop += e.deltaY;
        this._virtualX = this.scrollLeft;
        this._virtualY = this.scrollTop;
        this._overscrollX = 0;
        this._overscrollY = 0;
        this._renderOverscroll(0, 0);
    }

    _launchMomentum() {
        const timeConstant = 325; // ms

        // Natural destination
        // velocity is px/ms
        // velocity.y < 0 (drag up) => scroll down
        const vX = this._velocity.x * 1000; // px/sec
        const vY = this._velocity.y * 1000; // px/sec
        this._momentumVX = vX;
        this._momentumVY = vY;

        let targetX = this.scrollLeft - (vX * (timeConstant / 1000));
        let targetY = this.scrollTop - (vY * (timeConstant / 1000));

        const candidates = this.getScrollSnapCandidates();
        if (candidates.length > 0) {
            const startX = this.scrollLeft;
            const startY = this.scrollTop;
            let bestCandidate = null;
            let minDistance = Infinity;

            const scrollDirY = this._velocity.y < 0 ? 1 : (this._velocity.y > 0 ? -1 : 0);
            const scrollDirX = this._velocity.x < 0 ? 1 : (this._velocity.x > 0 ? -1 : 0);
            const dominantAxis = Math.abs(this._velocity.x) > Math.abs(this._velocity.y) ? 'x' : 'y';

            for (const cand of candidates) {
                const dx = cand.x - targetX;
                const dy = cand.y - targetY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestCandidate = cand;
                }
            }

            if (this.scrollSnapStop && bestCandidate) {
                let firstInDirection = null;
                let firstDist = Infinity;

                if (dominantAxis === 'x') {
                    for (const cand of candidates) {
                        if (scrollDirX === 1 && cand.x > startX + 10) {
                            const dist = cand.x - startX;
                            if (dist < firstDist) {
                                firstDist = dist;
                                firstInDirection = cand;
                            }
                        } else if (scrollDirX === -1 && cand.x < startX - 10) {
                            const dist = startX - cand.x;
                            if (dist < firstDist) {
                                firstDist = dist;
                                firstInDirection = cand;
                            }
                        }
                    }

                    if (firstInDirection && Math.abs(vX) > 50) {
                        bestCandidate = firstInDirection;
                    }
                } else {
                    for (const cand of candidates) {
                        if (scrollDirY === 1 && cand.y > startY + 10) {
                            const dist = cand.y - startY;
                            if (dist < firstDist) {
                                firstDist = dist;
                                firstInDirection = cand;
                            }
                        } else if (scrollDirY === -1 && cand.y < startY - 10) {
                            const dist = startY - cand.y;
                            if (dist < firstDist) {
                                firstDist = dist;
                                firstInDirection = cand;
                            }
                        }
                    }

                    if (firstInDirection && Math.abs(vY) > 50) {
                        bestCandidate = firstInDirection;
                    }
                }
            }

            if (bestCandidate) {
                targetX = bestCandidate.x;
                targetY = bestCandidate.y;
            }
        }

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
        this._rafId = requestAnimationFrame(this._update);
    }

    _stopAnimation() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
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
            return;
        }

        const delta = -elapsed / timeConstant;
        const scrollX = this._targetX - this._amplitudeX * Math.exp(delta);
        const scrollY = this._targetY - this._amplitudeY * Math.exp(delta);

        const overscroll = this._computeOverscroll(scrollX, scrollY, 0.2);
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

        // If momentum hits an edge, allow a visible bounce before snapping back
        if (overscrollX !== 0 || overscrollY !== 0) {
            const snapX = overscrollX !== 0 && !this._snapBackActiveX;
            const snapY = overscrollY !== 0 && !this._snapBackActiveY;

            if (elapsed > timeConstant * 1.2) {
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
                }

                this._rafId = requestAnimationFrame(this._update);
                return;
            }
        }

        this._rafId = requestAnimationFrame(this._update);
    }

    /**
     * Identifies snap points based on children
     * @returns {Array<{x: number, y: number}>}
     */
    getScrollSnapCandidates() {
        const slot = this.shadowRoot.querySelector('slot');
        const nodes = slot.assignedElements({ flatten: true });
        const candidates = [];

        const maybeAddCandidate = (el) => {
            if (!(el instanceof HTMLElement)) return;
            const style = getComputedStyle(el);
            if (style.scrollSnapAlign === 'none') return;

            const alignParts = style.scrollSnapAlign.split(' ');
            const alignX = alignParts[0] || 'start';
            const alignY = alignParts[1] || alignParts[0] || 'start';

            const xStart = el.offsetLeft;
            const yStart = el.offsetTop;
            const xCenter = xStart - (this.clientWidth / 2 - el.offsetWidth / 2);
            const yCenter = yStart - (this.clientHeight / 2 - el.offsetHeight / 2);
            const xEnd = xStart - (this.clientWidth - el.offsetWidth);
            const yEnd = yStart - (this.clientHeight - el.offsetHeight);

            const x = alignX === 'center' ? xCenter : alignX === 'end' ? xEnd : xStart;
            const y = alignY === 'center' ? yCenter : alignY === 'end' ? yEnd : yStart;

            candidates.push({ x, y });
        };

        for (const node of nodes) {
            if (!(node instanceof HTMLElement)) continue;
            maybeAddCandidate(node);
            const descendants = node.querySelectorAll('*');
            for (const child of descendants) {
                maybeAddCandidate(child);
            }
        }
        return candidates;
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {boolean} [animate=false]
     */
    scrollTo(x, y, animate = false) {
        if (animate) {
            this.shadowRoot.host.scrollTo({ left: x, top: y, behavior: 'smooth' });
        } else {
            this.shadowRoot.host.scrollTo(x, y);
        }
    }

    _hasSnapPoints() {
        // Small optimization, could cache this
        const candidates = this.getScrollSnapCandidates();
        return candidates.length > 0;
    }
}

customElements.define('disco-scroll-view', DiscoScrollView);
export default DiscoScrollView;
