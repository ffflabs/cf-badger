interface IdefaultSearchParams {
  fit: string;
  af: string;
  l?: string;
  w?: string | null;
  h?: string | null;
  output?: string;
  filename?: string;
  q?: string;
  n?: string;
  il?: string;
  sharp?: string;
  cw?: number
  cy?: number
  cx?: number
  ch?: number
}
let debug = console.log.bind(
  console,
  '\x1b[36m%s\x1b[0m',
  `handler:handleRequest`,
);
/**
 * This function will receive an URL whose path has the form
 * `/thumbnails/w=600_h=313/banners202102/01_lysto_grandes_formatos.jpg`
 *
 * From the original image url and its parameters, build the corresponding
 * weserv url using {fit = contain , af = true, q = 50 - l=-1 } @see https://images.weserv.nl/docs/fit.html#contain
 * the height and width are taken from a url part e.g. `/w=640_h=480/`.
 * the `url`  parameter is computed by rebuilding the original url (removal of worker namespace
 * and str)
 *
 * @param {URL} url
 * @returns {{resizedUrl:string,fullSizeImgStr:string,passThrough: boolean}}
 */
export function toWeserve(
  url: URL,
): {
  resizedUrl: URL;
  fullSizeImgStr: string;
  passThrough: boolean;
  weservUrl: URL;
  fullSizeImgWithParams: URL;
} {
  debug = console.log.bind(
    console,
    '\x1b[36m%s\x1b[0m',
    `to_weserve:toWeserve`,
  );
  let [blank, prefix, qsParams, ...imageParts] = url.pathname.split('/'),
    image = imageParts.join('/'),
    fullSizeImgStr = `${url.origin}/${image}`,
    fullSizeImgWithParams = new URL(
      `${fullSizeImgStr}?${(qsParams || '').replace(/_/g, '&')}`,
    ),
    passThrough = true;
  for (let [paramName, paramValue] of url.searchParams.entries()) {
    if (!fullSizeImgWithParams.searchParams.has(paramName)) {
      fullSizeImgWithParams.searchParams.set(paramName, paramValue);
    }
  }

  let defaultSearchParams = {
    fit: 'contain',
    af: '',
    //l: '-1',
    n: '-1',
  } as Record<string & keyof IdefaultSearchParams, string>;
  /**
   * Keys not explicitly set here will not be parsed nor added to 
   * the actual weServe url
   */
  let keys: Array<keyof IdefaultSearchParams> = [
    'output',
    'cw', 'cy', 'cx', 'ch',
    'q',
    'w',
    'h',
    'l',
    'il',
    'filename',
    'fit',
    'sharp',
  ];

  keys.forEach((key: keyof IdefaultSearchParams) => {
    if (fullSizeImgWithParams.searchParams.has(key)) {
      let value = fullSizeImgWithParams.searchParams.get(key);
      if (typeof value === 'string') {
        defaultSearchParams[key] = value;
      }
    }
  });
  debug({ fullSizeImgParams: Object.fromEntries(fullSizeImgWithParams.searchParams.entries()), defaultSearchParams });
  // Same as above but without protocol
  let urlParam = `${url.hostname}/${image}`,
    // this var is rewritten with the nice thumbnail image if we succeed
    resizedUrl = new URL(fullSizeImgStr);

  let weservUrl = new URL('https://images.weserv.nl/');
  if (defaultSearchParams.w || defaultSearchParams.h) {
    for (let [paramName, paramValue] of Object.entries(defaultSearchParams)) {
      weservUrl.searchParams.set(paramName, paramValue);
    }
    weservUrl.searchParams.set('url', `ssl:${urlParam}`);
    resizedUrl = weservUrl;
    passThrough = false;
  }

  return {
    resizedUrl,
    fullSizeImgStr,
    passThrough,
    fullSizeImgWithParams,
    weservUrl,
  };
}
