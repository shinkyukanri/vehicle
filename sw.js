// sw.js - 新急車両管理アプリ Service Worker
// 常にネットワークから最新版を取得する（キャッシュなし）

// インストール時：即座にアクティベート
self.addEventListener('install', event => {
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを全て削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

// フェッチ時：常にネットワークから取得（キャッシュ一切使わない）
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .catch(() => {
        // オフライン時のみキャッシュから返す（緊急用）
        return caches.match(event.request);
      })
  );
});
