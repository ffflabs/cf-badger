if(!self.define){const e=e=>{"require"!==e&&(e+=".js");let s=Promise.resolve();return r[e]||(s=new Promise((async s=>{if("document"in self){const r=document.createElement("script");r.src=e,document.head.appendChild(r),r.onload=s}else importScripts(e),s()}))),s.then((()=>{if(!r[e])throw new Error(`Module ${e} didn’t register its module`);return r[e]}))},s=(s,r)=>{Promise.all(s.map(e)).then((e=>r(1===e.length?e[0]:e)))},r={require:Promise.resolve(s)};self.define=(s,i,d)=>{r[s]||(r[s]=Promise.resolve().then((()=>{let r={};const a={uri:location.origin+s.slice(1)};return Promise.all(i.map((s=>{switch(s){case"exports":return r;case"module":return a;default:return e(s)}}))).then((e=>{const s=d(...e);return r.default||(r.default=s),r}))})))}}define("./sw.js",["./workbox-ac8ffed3"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/[...all].3ed168ed.js",revision:"a6baf21be062d1de0141f84389213fac"},{url:"assets/[name].d9852abd.js",revision:"21c4846bf16647071f8ab7cc8b8b2625"},{url:"assets/404.655945d2.js",revision:"c30a37aa0564eeade0935d99432f5e59"},{url:"assets/about.a50812c2.js",revision:"f42343b32569311d7e7119441f097812"},{url:"assets/home.d1ea7c6e.js",revision:"bc349c3eed7e5f6394870dc2b7f3c09b"},{url:"assets/index.47bdf06b.js",revision:"1936ffdc004a3fb2588095062eb6ef91"},{url:"assets/index.c678b3c5.css",revision:"3ddda5fd6a7b51853ee947e3c780d809"},{url:"assets/index.efaee062.js",revision:"b1474a93a61a23fc47dedb4a39475ca5"},{url:"assets/README.556bf812.js",revision:"a8d136a5bdd803273691f9ce12577107"},{url:"assets/vendor.eb742c19.js",revision:"2997f3e3ccc1ecd51e8a44d403b6d190"},{url:"index.html",revision:"585e871259d76d309765146680ccbe31"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"scripts/masking-input2.js",revision:"f26b860fc39017f2748469390c5e3ab1"},{url:"pwa-192x192.png",revision:"cbdb55b28ca2defcedffadb8a1e7a5c0"},{url:"pwa-512x512.png",revision:"77c7889fb71dad6d73f9b16e3b1c64fa"},{url:"manifest.webmanifest",revision:"37e8d18026b05432f623fc5efac2b4b1"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
//# sourceMappingURL=sw.js.map