addEventListener('fetch', function (event) {
  const { request } = event;
  const response = handleRequest(request).catch(handleError);
  event.respondWith(response);
});

/**
 * Receives a HTTP request and replies with a response.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const { method, url } = request;
  const { host, pathname } = new URL(url);

  switch (pathname) {
    case '/time':
      return respondTime(request);
    case '/echo':
      return respondEcho(request);
    case '/favicon.ico':
    case '/robots.txt':
      return new Response(null, { status: 204 });
  }
  let headers = {};

  for (let [key, value] of request.headers.entries()) {
    if (key.includes('cookie') || key === 'cf') continue;
    headers[key] = value;
  }
  let {
      cf: { tlsClientAuth, tlsExportedAuthenticator, cfObject } = {},
      ...reqObj
    } = JSON.parse(JSON.stringify(request)),
    cf = {
      cacheTtl: 5,
      //image: { format: 'avif' },
    };
  let body = {};

  if (
    request.method === 'POST' &&
    request.headers.get('content-type') === 'application/json'
  ) {
    let bodyJson = await request.json();
    body = bodyJson || body;
  }
  reqObj = { ...reqObj, cfObject, body, headers };
  console.log({ reqObj });

  let finalResp = new Response(JSON.stringify(reqObj, null, 2), {
    headers: {
      content_type: 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
  return finalResp;
  if (headers.via === 'worker' || request.method === 'POST') {
    return finalResp;
  }
  let fetchOpt = {
    method: 'POST',
    body: JSON.stringify(headers),
    cf,
    headers: {
      accept: 'application/json',
      via: 'worker',
    },
  };
  console.log(fetchOpt);
  return fetch(request.url, fetchOpt);

  // Workers on these hostnames have no origin server,
  // therefore there is nothing else to be found
  if (
    host.endsWith('.workers.dev') ||
    host.endsWith('.cloudflareworkers.com')
  ) {
    return new Response('Not Found', { status: 404 });
  }
  return new Response('Not Found', { status: 404 });

  // Makes a fetch request to the origin server
  return finalResp;
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

/**
 * Responds with an echo of a request.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function respondEcho(request) {
  const { url, method, cf } = request;
  const headers = Object.fromEntries([...request.headers]);
  const body = await request.text();

  const echo = { method, url, body, headers, cf };
  const echoBody = JSON.stringify(echo, null, 2);

  return new Response(echoBody, {
    status: 200,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Gets a human-readable description of the local time.
 * @param {string} locale
 * @param {object} cf
 * @returns {string}
 */
function getTime(locale, cf) {
  // In the preview editor, the 'cf' object will be null.
  // To view the object and its variables: make sure you are logged in,
  // click the "Save and Deploy" button, then open the URL in a new tab.
  const { city, region, country, timezone: timeZone } = cf || {};
  const localTime = new Date().toLocaleTimeString(locale, { timeZone });
  const location = [city, region, country].filter(Boolean).join(', ');

  return timeZone
    ? 'The local time in ' + location + ' is ' + localTime
    : 'The UTC time is ' + localTime;
}

/**
 * Responds with the local time.
 * @param {Request} request
 * @returns {Response}
 */
function respondTime(request) {
  const { headers, cf } = request;
  const locale = (headers.get('Accept-Language') || 'en-US').split(',')[0];

  const body = getTime(locale, cf);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
      'Content-Language': locale,
    },
  });
}
