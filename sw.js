self.addEventListener("install", e => {
    e.waitUntil(
        caches.open("static").then(cache => {
            return cache.addAll(["./AudioPlayer.html", "./AudioPlayer.css", "./AudioLogin.css", "./AudioPlayer.js", "./AudioList.js", "./AudioLogin.js", "./SystemImages/192px-Logo.png", "./SystemImages/512px-Logo.png", "./Assets/css/all.css", "./Assets/fonts/MaterialIcons-Regular.ttf", "./Assets/webfonts/fa-brands-400.ttf", "./Assets/webfonts/fa-brands-400.woff2", "./Assets/webfonts/fa-regular-400.ttf", "./Assets/webfonts/fa-regular-400.woff2", "./Assets/webfonts/fa-solid-900.ttf", "./Assets/webfonts/fa-solid-900.woff2", "./Assets/webfonts/fa-v4compatibility.ttf", "./Assets/webfonts/fa-v4compatibility.woff2"])
        })
    );
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })
    );
});