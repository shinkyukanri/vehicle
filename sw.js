// sw.js - 新急車両管理アプリ Service Worker
// このファイルのバージョン番号を変えるだけで全端末のキャッシュが自動更新される
const CACHE_VERSION = 'shinkyu-v1';
const CACHE_NAME = `shinkyu-cache-${CACHE_VERSION}`;

// キャッシュするファイル
const CACHE_FILES = [
  './',
  './index.html',
];

// インストール時：キャッシュを作成
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを全て削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] 古いキャッシュ削除:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ時：ネットワーク優先・失敗時はキャッシュを使用
self.addEventListener('fetch', event => {
  // Firebase・外部APIはキャッシュしない
  const url = event.request.url;
  if (
    url.includes('firebase') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('cloudfunctions') ||
    url.includes('a.run.app') ||
    url.includes('cdnjs')
  ) {
    return; // ブラウザのデフォルト処理に任せる
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 成功したらキャッシュも更新
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});

// メッセージ受信（skipWaiting指示）
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
