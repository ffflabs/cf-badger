import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import { missing } from 'itty-router-extras';

export async function computeAssetRequest(request: FetchEvent['request']): Promise<Response> {


    try {

        const page = await getAssetFromKV({ request } as FetchEvent, { cacheControl: { bypassCache: true } });

        // allow headers to be altered
        const response = new Response(page.body, page);

        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('Referrer-Policy', 'unsafe-url');
        response.headers.set('Feature-Policy', 'none');

        return response;

    } catch (e) {
        // if an error is thrown try to serve the asset at 404.html
        return missing('not found: ' + request.url);

    }
}
