const CACHE_NAME = "graph-note-cache-v2";
const urlsToCache = [
  "index.html",
  "style.css",
  "app.js",
  "graph.js",
  "canvas.js",
  "speech.js",
  "storage.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png"
];

// インストール時にキャッシュ
self.addEventListener("install", (event) => {
  self.skipWaiting(); // 即時反映
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// アクティベート時に古いキャッシュ削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// フェッチ時にキャッシュ優先＋エラーハンドリング
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() =>
          new Response("オフラインです。接続を確認してください。", {
            status: 503,
            statusText: "Service Unavailable"
          })
        )
      );
    })
  );
});
