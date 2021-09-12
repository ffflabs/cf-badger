import { TctxWithSentry } from '../index';
let debug = console.log.bind(
  console,
  '\x1b[36m%s\x1b[0m',
  `to_weserve:toWeserve`,
);
/**
 *
 * @param imageRequest
 * @param event
 * @param cf
 * @returns
 */
export async function fireModifiedRequest(
  imageRequest: Request,
  ctx: TctxWithSentry,
  cf: RequestInitCfProperties,
): Promise<Response> {
  debug = console.log.bind(
    console,
    '\x1b[36m%s\x1b[0m',
    `fireModifiedRequest`,
  );
  const resizedUrlStr: string = imageRequest.url,
    requestedUrl = ctx.request.url,
    url = new URL(requestedUrl),
    nocache = url.searchParams.has('nocache');

  const cache = caches.default;
  let response = await cache.match(requestedUrl);
  if (response && !nocache) {
    debug({ cacheHit: true, ctx });
    ctx.sentry.addBreadcrumb({
      data: { cacheHit: true, resizedUrlStr, nocache, imageRequest },
    });
    if (USE_CACHE) return response;
  } else {
    ctx.sentry.addBreadcrumb({
      data: { cacheHit: false, resizedUrlStr, nocache, imageRequest },
    });
  }

  response = await fetch(resizedUrlStr, { cf });

  const contentType = response.headers.get('Content-Type') || '';
  // console.log({ cacheMiss: response, event, contentType });
  if (response.ok && contentType.startsWith('image')) {
    // Reconstruct the Response object to make its headers mutable.
    debug(response);
    ctx.sentry.addBreadcrumb({
      data: Object.fromEntries(response.headers.entries()),
    });
    response = new Response(response.body, response);
    //Set cache control headers to cache on browser for 1 year
    response.headers.set('Accept-CH', 'Viewport-Width');
    response.headers.append('Accept-CH', 'Width');
    response.headers.set('Vary', 'Viewport-Width, Width');
    response.headers.set('Requested-CF', JSON.stringify(cf));
    response.headers.set('Cache-Control', 'public, max-age=31536000');
    response.headers.set('X-resizedUrl', resizedUrlStr);
    response.headers.set('X-GITHUB_TOKEN', GITHUB_TOKEN ? 'TRUE' : 'FALSE');
    response.headers.set('X-USE_AVIF', USE_AVIF ? 'TRUE' : 'FALSE');

    //response.headers.set('Content-Disposition', `inline; filename=image.webp`);
    if (USE_CACHE) ctx.waitUntil(cache.put(requestedUrl, response.clone()));
    return response;
  } else {
    throw new Error(response.statusText);
  }
}
