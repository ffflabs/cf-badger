if(!self.define){const e=e=>{"require"!==e&&(e+=".js");let s=Promise.resolve();return r[e]||(s=new Promise((async s=>{if("document"in self){const r=document.createElement("script");r.src=e,document.head.appendChild(r),r.onload=s}else importScripts(e),s()}))),s.then((()=>{if(!r[e])throw new Error(`Module ${e} didn’t register its module`);return r[e]}))},s=(s,r)=>{Promise.all(s.map(e)).then((e=>r(1===e.length?e[0]:e)))},r={require:Promise.resolve(s)};self.define=(s,i,c)=>{r[s]||(r[s]=Promise.resolve().then((()=>{let r={};const d={uri:location.origin+s.slice(1)};return Promise.all(i.map((s=>{switch(s){case"exports":return r;case"module":return d;default:return e(s)}}))).then((e=>{const s=c(...e);return r.default||(r.default=s),r}))})))}}define("./sw.js",["./workbox-ac8ffed3"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/[...all].3ed168ed.js",revision:"a6baf21be062d1de0141f84389213fac"},{url:"assets/[name].dfb61f55.js",revision:"d2ab613975fc5fd08d9636588245e055"},{url:"assets/404.655945d2.js",revision:"c30a37aa0564eeade0935d99432f5e59"},{url:"assets/about.a50812c2.js",revision:"f42343b32569311d7e7119441f097812"},{url:"assets/home.b6c79793.js",revision:"af4959e90f27809bec05efa479021042"},{url:"assets/index.290c93b6.js",revision:"4c907dbfdb55e4f492fc8749ef655edc"},{url:"assets/index.31876c0f.js",revision:"24241c82020c625796b0b6b00cb58b90"},{url:"assets/index.c678b3c5.css",revision:"3ddda5fd6a7b51853ee947e3c780d809"},{url:"assets/README.45e1ef7f.js",revision:"a24fdb54835c7bedaf69c2aad1f18e5d"},{url:"assets/vendor.eb742c19.js",revision:"2997f3e3ccc1ecd51e8a44d403b6d190"},{url:"index.html",revision:"c837d50be8fc4db3f23cac06915167f0"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"scripts/masking-input2.js",revision:"f26b860fc39017f2748469390c5e3ab1"},{url:"pwa-192x192.png",revision:"cbdb55b28ca2defcedffadb8a1e7a5c0"},{url:"pwa-512x512.png",revision:"77c7889fb71dad6d73f9b16e3b1c64fa"},{url:"manifest.webmanifest",revision:"37e8d18026b05432f623fc5efac2b4b1"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
//# sourceMappingURL=sw.js.map
