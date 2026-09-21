const CACHE='yar-keshavarz-shell-v13';
const CORE=['./','./index.html','./offline/offline-ai.js','./offline/agriculture-db.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./logo.png','./wheat-hero.jpg','./admin.html','./admin.js','./admin.css','./knowledge/knowledge.json','./presence.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).catch(()=>{})).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==location.origin)return;
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));return res}).catch(()=>caches.match('./index.html'))));
});
