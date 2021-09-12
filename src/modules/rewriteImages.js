addEventListener('fetch', function (event) {
  const response = handleRequest(event).catch(handleError);
  event.respondWith(response);
});

/**
 * Receives a HTTP request and replies with a response.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(event) {
  const { request } = event;

  cf = {
    cacheTtl: 86400,
    cacheTtlByStatus: { '200-299': 86400, '400-499': 1, '500-599': 0 },
    //image: { format: 'avif' },
  };
  const cache = await caches.open('mydot');
  let response = await cache.match(imageRequest.url);
  if (response) {
    console.log({ cacheHit: response, event });
    return response;
  }
  response = await fetch(
    request.url
      .replace('assets.lysto.cl', 'assets.jumpseller.com')
      .replace('cdnx.lysto.cl', 'cdnx.jumpseller.com'),
    { headers: request.headers, cf },
  );
  const contentType = response.headers.get('Content-Type') || '';
  // console.log({ cacheMiss: response, event, contentType });
  if (response.ok && contentType.startsWith('image')) {
    // Reconstruct the Response object to make its headers mutable.
    console.log(response);
    response = new Response(response.body, response);
    //Set cache control headers to cache on browser for 1 year

    response.headers.set('Cache-Control', 'public, max-age=31536000');

    //response.headers.set('Content-Disposition', `inline; filename=image.webp`);
    event.waitUntil(cache.put(request.url, response.clone()));
  }
  return response;
  // Makes a fetch request to the origin server
}

/**
 * Responds with an uncaught error.
 * @param {Error} error
 * @returns {Response}
 */
function handleError(error) {
  console.error('Uncaught error:', error);

  const { stack } = error;
  return new Response(stack || error, {
    status: 500,
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
  });
}
