import './_index.scss';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('{{PATH_PREFIX}}sw.js');
};
