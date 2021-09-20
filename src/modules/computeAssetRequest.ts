
import * as mime from 'mime'

import { missing, TRequestWithParams, EnvWithDurableObject } from 'itty-router-extras';
import type { TctxWithSentry } from '../index';
import type {
    Options,
    CacheControl,

    AssetManifestType,
} from '@cloudflare/kv-asset-handler/dist/types'
import {
    MethodNotAllowedError,
    NotFoundError,
    InternalError,
} from '@cloudflare/kv-asset-handler/dist/types'
const defaultCacheControl: CacheControl = {
    browserTTL: null,
    edgeTTL: 2 * 60 * 60 * 24, // 2 days
    bypassCache: false, // do not bypass Cloudflare's cache
} as unknown as CacheControl
const parseStringAsObject = <T>(maybeString: string | T): T =>
    typeof maybeString === 'string' ? (JSON.parse(maybeString) as T) : maybeString

export const getAssetFromKVDefaultOptions = (env: EnvWithDurableObject) => {
    return {
        ASSET_NAMESPACE: typeof env.__STATIC_CONTENT !== 'undefined' ? env.__STATIC_CONTENT : undefined,
        ASSET_MANIFEST:
            typeof env.__STATIC_CONTENT_MANIFEST !== 'undefined'
                ? parseStringAsObject<AssetManifestType>(env.__STATIC_CONTENT_MANIFEST)
                : undefined,
        cacheControl: defaultCacheControl,
        defaultMimeType: 'text/plain',
        defaultDocument: 'index.html',
    } as Partial<Options> & { defaultDocument: string }
}
function assignOptions(env: EnvWithDurableObject, options?: Partial<Options>): Options & { defaultDocument: string } {
    // Assign any missing options passed in to the default
    // options.mapRequestToAsset is handled manually later
    return <Options & { defaultDocument: string }>Object.assign({}, getAssetFromKVDefaultOptions(env), options)
}
/**
* maps the path of incoming request to the request pathKey to look up
* in bucket and in cache
* e.g.  for a path '/' returns '/index.html' which serves
* the content of bucket/index.html
* @param {Request} request incoming request
*/
const mapRequestToAsset = (request: Request, env: EnvWithDurableObject, options?: Partial<Options>) => {
    options = assignOptions(env, options) as Options & { defaultDocument: string }

    const parsedUrl = new URL(request.url)
    let pathname = parsedUrl.pathname

    if (pathname.endsWith('/')) {
        // If path looks like a directory append options.defaultDocument
        // e.g. If path is /about/ -> /about/index.html
        pathname = pathname.concat(options.defaultDocument as string)
    } else if (!mime.getType(pathname)) {
        // If path doesn't look like valid content
        //  e.g. /about.me ->  /about.me/index.html
        pathname = pathname.concat('/' + options.defaultDocument)
    }

    parsedUrl.pathname = pathname
    return new Request(parsedUrl.toString(), request)
}

/**
 * takes the path of the incoming request, gathers the appropriate content from KV, and returns
 * the response. 
 * 
 * This is just an adaptation of the real @cloudflare/kv-asset-handler to work on modules format
*/
const getAssetFromKV = async (request: TRequestWithParams, env: EnvWithDurableObject, options: Partial<Options>): Promise<Response> => {
    options = assignOptions(env, options)


    const ASSET_NAMESPACE = options.ASSET_NAMESPACE
    const ASSET_MANIFEST = parseStringAsObject<AssetManifestType>(options.ASSET_MANIFEST as string)

    if (typeof ASSET_NAMESPACE === 'undefined') {
        throw new InternalError(`there is no KV namespace bound to the script`)
    }

    const rawPathKey = new URL(request.url).pathname.replace(/^\/+/, '') // strip any preceding /'s
    let pathIsEncoded = false
    let requestKey
    // if options.mapRequestToAsset is explicitly passed in, always use it and assume user has own intentions
    // otherwise handle request as normal, with default mapRequestToAsset below
    if (options.mapRequestToAsset) {
        requestKey = options.mapRequestToAsset(request)
    } else if (ASSET_MANIFEST[rawPathKey]) {
        requestKey = request
    } else if (ASSET_MANIFEST[decodeURIComponent(rawPathKey)]) {
        pathIsEncoded = true
        requestKey = request
    } else {
        const mappedRequest = mapRequestToAsset(request, env)
        const mappedRawPathKey = new URL(mappedRequest.url).pathname.replace(/^\/+/, '')
        if (ASSET_MANIFEST[decodeURIComponent(mappedRawPathKey)]) {
            pathIsEncoded = true
            requestKey = mappedRequest
        } else {
            // use default mapRequestToAsset
            requestKey = mapRequestToAsset(request, env, options)
        }
    }

    const SUPPORTED_METHODS = ['GET', 'HEAD']
    if (!SUPPORTED_METHODS.includes(requestKey.method)) {
        throw new MethodNotAllowedError(`${requestKey.method} is not a valid request method`)
    }

    const parsedUrl = new URL(requestKey.url)
    const pathname = pathIsEncoded ? decodeURIComponent(parsedUrl.pathname) : parsedUrl.pathname // decode percentage encoded path only when necessary

    // pathKey is the file path to look up in the manifest
    let pathKey = pathname.replace(/^\/+/, '') // remove prepended /

    // @ts-ignore

    let mimeType = (mime.getType(pathKey) || options.defaultMimeType) as string
    if (mimeType.startsWith('text') || mimeType === 'application/javascript') {
        mimeType += '; charset=utf-8'
    }


    // TODO this excludes search params from cache, investigate ideal behavior
    let cacheKey = new Request(`${parsedUrl.origin}/${pathKey}`, request)

    // if argument passed in for cacheControl is a function then
    // evaluate that function. otherwise return the Object passed in
    // or default Object
    const evalCacheOpts = (() => {
        switch (typeof options.cacheControl) {
            case 'function':
                return options.cacheControl(request)
            case 'object':
                return options.cacheControl
            default:
                return defaultCacheControl
        }
    })()

    // formats the etag depending on the response context. if the entityId
    // is invalid, returns an empty string (instead of null) to prevent the
    // the potentially disastrous scenario where the value of the Etag resp
    // header is "null". Could be modified in future to base64 encode etc
    const formatETag = (entityId: any = pathKey, validatorType = 'strong') => {
        if (!entityId) {
            return ''
        }
        switch (validatorType) {
            case 'weak':
                if (!entityId.startsWith('W/')) {
                    return `W/${entityId}`
                }
                return entityId
            case 'strong':
                if (entityId.startsWith(`W/"`)) {
                    entityId = entityId.replace('W/', '')
                }
                if (!entityId.endsWith(`"`)) {
                    entityId = `"${entityId}"`
                }
                return entityId
            default:
                return ''
        }
    }

    options.cacheControl = Object.assign({}, defaultCacheControl, evalCacheOpts)

    // override shouldEdgeCache if options say to bypassCache

    // only set max-age if explicitly passed in a number as an arg
    const shouldSetBrowserCache = typeof options.cacheControl.browserTTL === 'number'



    const body = await ASSET_NAMESPACE.get(pathKey, 'arrayBuffer')
    if (body === null) {
        throw new NotFoundError(`could not find ${pathKey} in your content namespace`)
    }
    let response = new Response(body)



    response.headers.set('Content-Type', mimeType)

    if (response.status === 304) {
        let etag = formatETag(response.headers.get('etag'), 'strong')
        let ifNoneMatch = cacheKey.headers.get('if-none-match')
        let proxyCacheStatus = response.headers.get('CF-Cache-Status')
        if (etag) {
            if (ifNoneMatch && ifNoneMatch === etag && proxyCacheStatus === 'MISS') {
                response.headers.set('CF-Cache-Status', 'EXPIRED')
            } else {
                response.headers.set('CF-Cache-Status', 'REVALIDATED')
            }
            response.headers.set('etag', formatETag(etag, 'weak'))
        }
    }
    if (shouldSetBrowserCache) {
        response.headers.set('Cache-Control', `max-age=${options.cacheControl.browserTTL}`)
    } else {
        response.headers.delete('Cache-Control')
    }
    return response
}
export async function computeAssetRequest(request: TRequestWithParams, env: EnvWithDurableObject, ctx: TctxWithSentry): Promise<Response> {
    // console.info({ env })
    return getAssetFromKV(request, env, { cacheControl: { bypassCache: true } })
        .then((page) => {


            // allow headers to be altered
            const response = new Response(page.body, page);

            response.headers.set('X-XSS-Protection', '1; mode=block');
            response.headers.set('X-Content-Type-Options', 'nosniff');
            response.headers.set('X-Frame-Options', 'DENY');
            response.headers.set('Referrer-Policy', 'unsafe-url');
            response.headers.set('Feature-Policy', 'none');

            return response;

        }).catch(e => {

            console.error(e.stack)
            ctx.sentry.captureException(e)
            // if an error is thrown try to serve the asset at 404.html
            return missing('not found: ' + request.url);
        })


}
