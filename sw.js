const CACHE='risk49-v1.3.0';
const ASSETS=['./','./index.html','./style.css','./app.js','./engine.js','./pingxiao.js','./worker.js','./xlsx.full.min.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('risk49-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='CHECK_READY')event.waitUntil((async()=>{const cache=await caches.open(CACHE);const entries=await Promise.all(ASSETS.map(x=>cache.match(x)));event.source?.postMessage({type:entries.every(Boolean)?'CACHE_READY':'CACHE_MISSING'});})());});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(event.request);if(cached)return cached;try{return await fetch(event.request);}catch(e){if(event.request.mode==='navigate')return await cache.match('./index.html');throw e;}})());});





