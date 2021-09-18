import type { RequestWithParams, TctxWithSentry, EnvWithBindings } from '../index';

export async function computeEndpointSvgRequest(
    request: RequestWithParams,
    env: EnvWithBindings
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
    let res = await fetch(endpointRequest, { cf })
    if (res.ok) {
        let resClone = res.clone()
        resClone.headers.set('cached_on', String(Date.now()))
        resClone.headers.set("cache-control", "max-age=300, s-maxage=300")

        ctx.waitUntil(cache.put(endpointRequest, resClone));
    }
    return res;

}
