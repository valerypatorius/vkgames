import Config from '../config';

const CONSOLE_STYLE = 'color: #E87E04';

/**
 * Send analytics events via GTM
 *
 * @param {String} label - Event label
 * @param {String} action - Event action ("Click" by default)
 */
const sendEvent = (label, action = 'Click') => {
    const value = `${Config.analyticsCategory} — ${label} — ${action}`;

    console.log(`Analytics: %c${value}`, CONSOLE_STYLE);

    if (window.dataLayer !== undefined && Config.analyticsCategory) {
        window.dataLayer.push({
            event: 'data_event',
            data_description: value,
        });
    }
};

/**
 * Send pageview event via GTM
 */
const sendPageView = () => {
    console.log('Analytics: %cPage — View', CONSOLE_STYLE);

    if (window.dataLayer !== undefined) {
        window.dataLayer.push({
            event: 'Page — View',
            post_details: {},
            section: 'special',
            tags: [],
            title: document.title,
            url: window.location.pathname,
        });
    }
};

export default {
    sendEvent,
    sendPageView,
};
