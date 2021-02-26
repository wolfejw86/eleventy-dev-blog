import './_index.scss';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('{{PATH_PREFIX}}sw.js');
};

import(
    /* webpackChunkName: "analytics" */
    '@scripts/utilities/analytics'
).then(({ default: module }) => {
    module();
});
