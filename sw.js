const C='plan-v1';
const FILES=['./','index.html','index.css','index.js','manifest.json','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.all(
    FILES.map(f=>c.add(f).catch(()=>console.warn('sw: could not cache',f)))
  )));
  self.skipWaiting();
});

self.addEventListener('activate',e=>e.waitUntil(clients.claim()));

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(hit=>{
    const net=fetch(e.request).then(r=>{
      if(r.ok){
        const copy=r.clone();
        caches.open(C).then(c=>c.put(e.request,copy));
      }
      return r;
    }).catch(()=>hit);
    return hit||net;
  }));
});