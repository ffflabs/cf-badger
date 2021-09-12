<center>

[![Logo](assets/logo_lysto._c_texto.svg)](https://wakatime.com/badge/github/TreidSPA/thumbnailer-worker)

![](https://img.shields.io/static/v1?label=Made%20With&message=TypeScript&color=f0f0f0&labelColor=3974c0&style=for-the-badge&logo=typescript&logoColor=white&messageColor=3974c0) &nbsp; &nbsp; ![](https://img.shields.io/badge/Cloudflare-Workers-orange?color=f38020&logo=cloudflare&logoColor=f38020&style=for-the-badge&labelColor=gainsboro)

Resize images according to URL parameters, and cache the result in the Edge.

</center>

### What are Workers Environment and Cloudflare Workers?

[Worker Environments Standard](https://workers.js.org/) describe an adaptation of the [ServiceWorkers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) that extends the typical browser's Service Workers to offer basic HTTP server features, while also removing other browser APIs that pertain to DOM or window objects.

Cloudflare Workers platform is an [Edge Computing](https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/) implementation of Worker Environments. This serverless platform includes [Workers KV](https://www.cloudflare.com/products/workers-kv/), an eventually consistent key-value storage that self replicates to 200 edge locations, and also [Worker Sites](https://github.com/cloudflare/worker-sites-template) to serve static frontends.
