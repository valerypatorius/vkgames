import Likely from 'cmtt-likely';
import Parallax from 'parallax-js';

import Config from './config';
import BaseSpecial from './base';
import { cacheElements } from './lib/dom';

function log(...args) {
    console.log(`%c[${Config.name}]`, 'color: #19b5fe', ...args);
}

const TRANSITION_DURATION = 200;

const EL = {};
const ANCHORS = {};
const OBSERVED = [];

const CSS = {
    above: 'state--aboveall',
    visible: 'state--visible',
    hidden: 'state--hidden',
    touch: 'state--touch',
    observed: 'state--observed',
    unobserved: 'state--unobserved',
    activated: 'state--activated',
};

/**
 * Helps to detect first touch event
 */
function onFirstTouch() {
    document.body.classList.add(CSS.touch);
    window.removeEventListener('touchstart', onFirstTouch);
}

/**
 * Overlay has background color only when not mobile, so check for media query
 */
function isOverlayColored() {
    return window.matchMedia('(min-width: 760px)').matches;
}

/**
 * If sidebar is present, enable some mechanics (e.g. intersection observer)
 */
function isSidebarPresent() {
    return window.matchMedia('(min-width: 1280px)').matches;
}

class Special extends BaseSpecial {
    constructor() {
        super();

        this.isTransitionActive = false;
        this.transitionTimeout = null;

        this.activeAnchor = null;

        this.parallaxInstance = null;
        this.observer = null;

        this.init();
    }

    /**
     * Cache elements, watch for touch device and hide preloader
     */
    init() {
        cacheElements(EL);
        this.cacheAnchors();
        this.cacheObserved();

        window.addEventListener('touchstart', onFirstTouch);

        Likely.initate();

        this.enableParallax();

        if (isSidebarPresent()) {
            this.observer = new IntersectionObserver(this.observeGames.bind(this), {
                threshold: [0, 0.5, 0.75, 1],
            });

            for (let i = 0, len = OBSERVED.length; i < len; i += 1) {
                this.observer.observe(OBSERVED[i]);
            }
        }

        this.preloadHeaderIcons().then(() => {
            this.hidePreloader();
        });
    }

    /**
     * Hide preloader
     */
    hidePreloader() {
        EL.preloader.classList.add(CSS.hidden);
    }

    /**
     * Enable parallax on some icons
     */
    enableParallax() {
        const scenes = [...document.querySelectorAll('[data-parallax-scene]')];

        for (let i = 0, len = scenes.length; i < len; i += 1) {
            const scene = scenes[i];

            this.parallaxInstance = new Parallax(scene, {
                selector: '[data-parallax]',
            });
        }
    }

    /**
     * Observe entries and toggle visibility
     *
     * @param {Array} entries
     */
    observeGames(entries) {
        const delta = 0.5;

        for (let i = 0, len = entries.length; i < len; i += 1) {
            const entry = entries[i];
            const { target, boundingClientRect, rootBounds, intersectionRatio } = entry;
            const isVisible = (boundingClientRect.top + boundingClientRect.height * delta) < rootBounds.bottom;
            const { anchor } = target.dataset;

            if (isVisible && intersectionRatio >= delta) {
                target.classList.add(CSS.observed);
                target.classList.remove(CSS.unobserved);

                if (anchor) {
                    ANCHORS[anchor].forEach((anchor) => {
                        anchor.classList.add(CSS.activated);
                    });
                }
            }

            if (!isVisible && intersectionRatio <= delta) {
                target.classList.remove(CSS.observed);
                target.classList.add(CSS.unobserved);

                if (anchor) {
                    ANCHORS[anchor].forEach((anchor) => {
                        anchor.classList.remove(CSS.activated);
                    });
                }
            }
        }
    }

    /**
     * Wait for all header images to load
     */
    preloadHeaderIcons() {
        const images = [...EL.headerIcons.querySelectorAll('img')];
        const imagesToLoad = images.length;

        let imagesLoaded = 0;

        return new Promise((resolve, reject) => {
            images.forEach((image) => {
                const imageInstance = new Image();

                imageInstance.onload = () => {
                    image.src = image.dataset.src;
                    image.dataset.src = '';

                    imagesLoaded += 1;

                    if (imagesLoaded >= imagesToLoad) {
                        setTimeout(resolve, 100);
                    }
                };

                imageInstance.onerror = () => {
                    reject();
                };

                imageInstance.src = image.dataset.src;
            });
        });
    }

    /**
     * Cache all anchors before interactions
     */
    cacheAnchors() {
        const elements = document.querySelectorAll('[data-anchor]');

        for (let i = 0, len = elements.length; i < len; i += 1) {
            const el = elements[i];
            const name = el.dataset.anchor;

            if (!ANCHORS[name]) {
                ANCHORS[name] = [];
            }

            ANCHORS[name].push(el);
        }
    }

    /**
     * Cache all elements, which should be observed
     */
    cacheObserved() {
        const elements = document.querySelectorAll('[data-observed]');

        for (let i = 0, len = elements.length; i < len; i += 1) {
            const el = elements[i];

            OBSERVED.push(el);
        }
    }

    /**
     * Activate or deactivate active anchor elements
     *
     * @param {Boolean} activate
     */
    activateAnchors(activate = true) {
        if (!this.activeAnchor) {
            return;
        }

        for (let i = 0, len = ANCHORS[this.activeAnchor].length; i < len; i += 1) {
            const el = ANCHORS[this.activeAnchor][i];

            if (activate) {
                el.classList.add(CSS.above);
            } else {
                el.classList.remove(CSS.above);
            }
        }
    }

    /**
     * Toggle overlay on mouse events
     *
     * @param {Element} target
     * @param {Object} event
     */
    toggleOverlay(target, event) {
        const { type } = event;

        if (this.transitionTimeout) {
            this.clearOverlay();
        }

        if (type === 'mouseover' || type === 'touchend') {
            this.activeAnchor = target.dataset.anchor;
            this.showOverlay();
        }

        if (type === 'mouseout') {
            this.hideOverlay();
        }
    }

    /**
     * Clears overlay and timeout. Useful on fast mouse interactions
     */
    clearOverlay() {
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
        }

        if (this.activeAnchor) {
            this.activateAnchors(false);
        }

        EL.overlay.classList.remove(CSS.visible);
    }

    /**
     * Show overlay, if there is an active anchor
     */
    showOverlay() {
        if (!this.activeAnchor) {
            return;
        }

        this.activateAnchors(true);

        EL.overlay.classList.add(CSS.visible);
    }

    /**
     * Hide overlay
     */
    hideOverlay() {
        EL.overlay.classList.remove(CSS.visible);

        const delay = isOverlayColored() ? TRANSITION_DURATION : 0;

        this.transitionTimeout = setTimeout(() => {
            this.activateAnchors(false);
            this.activeAnchor = null;

            clearTimeout(this.transitionTimeout);
        }, delay);
    }
}

export default Special;
