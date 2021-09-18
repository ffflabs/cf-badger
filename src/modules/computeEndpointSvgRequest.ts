import type { RequestWithParams, EnvWithBindings } from '../index';

export async function computeEndpointSvgRequest(
    request: RequestWithParams,
    env: EnvWithBindings
    //,ctx: TctxWithSentry
): Promise<Response> {

    const { url, params: { hash } } = request;


    const requestURL = new URL(url), style = requestURL.searchParams.get('style') || 'flat', branch = requestURL.searchParams.get('branch') || 'master', endpoint = `${env.WORKER_URL}/${hash}?branch=${branch}`, cf: RequestInitCfProperties = {
        cacheTtlByStatus: { '200-299': 300, '400-499': 1, '500-599': 0 },
    };
    console.log({ requestURL })
    let endpointRequest = `https://img.shields.io/endpoint.svg?url=${encodeURIComponent(endpoint)}&style=${style}`;

    return fetch(endpointRequest, { cf })

}
