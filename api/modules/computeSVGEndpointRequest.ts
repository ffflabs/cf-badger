import type { TctxWithSentry } from '../index';
import type { TRequestWithParams, EnvWithDurableObject } from 'itty-router-extras';
export async function computeSVGEndpointRequest(
    request: TRequestWithParams,
    env: EnvWithDurableObject
    , ctx: TctxWithSentry
): Promise<Response> {

    const { url, params: { hash } } = request;
    const cache = caches.default,



        requestURL = new URL(url), style = requestURL.searchParams.get('style') || 'flat',
        branch = requestURL.searchParams.get('branch') || 'master',
        endpoint = `${env.WORKER_URL}/badger/_${hash.replace(/^_/, '')}?branch=${branch}`, cf: RequestInitCfProperties = {
            cacheTtlByStatus: { '200-299': 300, '400-499': 1, '500-599': 0 },
        };
    let endpointUrl = `https://img.shields.io/endpoint.svg?url=${encodeURIComponent(endpoint)}&style=${style}`;
    console.log({ endpoint, endpointUrl })
    const cachedResponse = await cache.match(endpointUrl)
    if (cachedResponse && Number(cachedResponse.headers.get('cached_on')) > (Date.now() - 300000)) {
        return cachedResponse
    }
    let response = await fetch(endpointUrl, { cf })

    if (response.ok && response.headers.get('content-type') === 'image/svg') {
        // Reconstruct the Response object to make its headers mutable.
        //  debug(response);
        ctx.sentry.addBreadcrumb({
            data: Object.fromEntries(response.headers.entries()),
        });
        response = new Response(response.body, response);

        response.headers.set('Vary', 'Viewport-Width, Width');
        response.headers.set('cached_on', String(Date.now()))
        response.headers.set('Cache-Control', 'public, max-age=300');

        //response.headers.set('Content-Disposition', `inline; filename=image.webp`);
        ctx.waitUntil(cache.put(endpointUrl, response.clone()));
    }
    return response;

    //metadata = this.getMetadata(metadata)


}
export async function computeEmbeddedSVGEndpointRequest(
    request: TRequestWithParams,
    env: EnvWithDurableObject

): Promise<Response> {

    const { url, params: { hash } } = request,
        requestURL = new URL(url), style = requestURL.searchParams.get('style') || 'flat',
        branch = requestURL.searchParams.get('branch') || 'master',
        endpoint = `${env.WORKER_URL}/badger/${hash}?branch=${branch}`, cf: RequestInitCfProperties = {
            cacheTtlByStatus: { '200-299': 300, '400-499': 1, '500-599': 0 },
        };
    let endpointUrl = `https://img.shields.io/endpoint.svg?url=${encodeURIComponent(endpoint)}&style=${style}`;
    console.log({ endpoint, endpointUrl })



    return fetch(endpoint).then(res => res.json()).then(runProps => {


        return new Response(`
        <img src="${endpointUrl}" >
        <pre>${endpointUrl}</pre>
        <pre>${endpoint}</pre>
        <pre>${JSON.stringify(runProps, null, 4)}</pre>
        `, {
            headers: {
                'content-type': 'text/html'
            }
        })
    })


    //metadata = this.getMetadata(metadata)


}
