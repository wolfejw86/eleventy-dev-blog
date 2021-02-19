// Minimum PWA
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open('sw-cache').then(function (cache) {
            return cache.addAll([
                '{{PATH_PREFIX}}index.html',
                '{{PATH_PREFIX}}assets/images/logo-white-512.png',
                '{{PATH_PREFIX}}assets/images/logo-white-192.png'
            ]);
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});
