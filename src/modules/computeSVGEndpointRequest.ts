import type { TctxWithSentry } from '../index';
import type { TRequestWithParams, EnvWithDurableObject } from 'itty-router-extras';
export async function computeSVGEndpointRequest(
    request: TRequestWithParams,
    env: EnvWithDurableObject
    , ctx: TctxWithSentry
): Promise<Response> {

    const { url, params: { hash } } = request;
    const cache = caches.default,



        requestURL = new URL(url), style = requestURL.searchParams.get('style') || 'flat', branch = requestURL.searchParams.get('branch') || 'master', endpoint = `${env.WORKER_URL}/${hash}?branch=${branch}`, cf: RequestInitCfProperties = {
            cacheTtlByStatus: { '200-299': 300, '400-499': 1, '500-599': 0 },
        };
    console.log({ url })
    let endpointRequest = `https://img.shields.io/endpoint.svg?url=${encodeURIComponent(endpoint)}&style=${style}`;
    const cachedResponse = await cache.match(endpointRequest)
    if (cachedResponse) {
        console.log(cachedResponse)
    }
    let response = await fetch(endpointRequest, { cf })

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
        ctx.waitUntil(cache.put(endpointRequest, response.clone()));
    }
    return response;

    //metadata = this.getMetadata(metadata)




}
