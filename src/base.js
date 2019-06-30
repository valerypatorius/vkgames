import Config from './config';
import Analytics from './lib/analytics';

/**
 * Base special constructor with common methods
 */
class BaseSpecial {
    constructor() {
        this.params = {
            container: document.body,
        };

        Object.assign(this.params, Config);

        this.container = this.params.container;

        if (Config.sendPageView) {
            Analytics.sendPageView();
        }

        this.addEventsListeners();
    }

    /**
     * Add events listeners to container
     */
    addEventsListeners() {
        this.params.listenedEvents.forEach((eventName) => {
            this.container.addEventListener(eventName, event => this.defaultEventHandler(event, eventName));
        });
    }

    /**
     * Default event listener
     *
     * @param {Object} event - Event object
     * @param {String} eventName - Event name to listen
     */
    defaultEventHandler(event, eventName) {
        let { target } = event;
        let action = null;
        let canCallAction = true;

        while (target.parentNode && target !== event.currentTarget) {
            action = target.dataset[eventName];

            /** Send all links clicks to analytics */
            if (eventName === 'click' && target.tagName.toLowerCase() === 'a') {
                Analytics.sendEvent(target.href);
            }

            if (action) break;
            target = target.parentNode;
        }

        action = target.dataset[eventName];

        if (['mouseover', 'mouseout'].includes(eventName)) {
            const { relatedTarget } = event;

            canCallAction = false;

            if (relatedTarget && target !== relatedTarget && !target.contains(relatedTarget)) {
                canCallAction = true;
            }
        }

        if (canCallAction && action && this[action]) {
            this[action](target, event);
        }
    }
}

export default BaseSpecial;
