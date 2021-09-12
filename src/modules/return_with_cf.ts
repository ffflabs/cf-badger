import { fireModifiedRequest } from './fire_modified_request';
import { TctxWithSentry } from '../index';

interface defaultSearchParams {
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
}
function getFileName(url: URL): { fileName: string; extension: string } {
  const { pathname } = url,
    fileName = (pathname || '').split('/').pop() || '',
    extension = fileName.split('.').pop() || '';
  return { fileName, extension };
}
/**
 *
 * @param fullSizeImgStr
 * @param resizedUrl
 * @param event
 * @returns
 */
export async function returnWithCF(
  fullSizeImgStr: string,
  resizedUrl: URL,
  ctx: TctxWithSentry,
): Promise<Response> {
  let { fileName, extension } = getFileName(resizedUrl),
    fullSizeUrl = new URL(fullSizeImgStr);

  if (resizedUrl.searchParams.has('w')) {
    fullSizeUrl.searchParams.set(
      'width',
      resizedUrl.searchParams.get('w') || '',
    );
  }
  if (resizedUrl.searchParams.has('h')) {
    fullSizeUrl.searchParams.set(
      'height',
      resizedUrl.searchParams.get('h') || '',
    );
  }
  if (resizedUrl.searchParams.has('url')) {
    fullSizeUrl.searchParams.set(
      'url',
      resizedUrl.searchParams.get('url') || '',
    );
  }
  if (resizedUrl.searchParams.has('filename')) {
    fullSizeUrl.searchParams.set(
      'filename',
      resizedUrl.searchParams.get('filename') || '',
    );
  }
  let format: 'avif' | 'webp' | 'json' | undefined;
  const request: Request = ctx.request,
    headerVia: string = request.headers.get('via') || '',
    accepts: string = request.headers.get('accept') || '';
  if (USE_AVIF && accepts.includes('avif')) {
    format = 'avif';
  } else if (accepts.includes('webp')) {
    format = 'webp';
  }
  const viewportWidth = request.headers.get('Viewport-Width'),
    width = request.headers.get('Width'),
    dpr = request.headers.get('Dpr'),
    cf: RequestInitCfProperties = {
      cacheEverything: false,
      cacheTtl: 86400,
      image: {
        quality: 80,
        width: Number(fullSizeUrl.searchParams.get('width')),
        height: Number(fullSizeUrl.searchParams.get('height')),
        format: format,
        fit: 'contain',
        metadata: 'none',
      },
    };
  const logPayload = {
    USE_AVIF,
    GITHUB_TOKEN,
    accepts,
    viewportWidth,
    width,
    avif: accepts.includes('avif'),
    cf,
    dpr,
    fullSizeImgStr,
    headerVia: headerVia,

    requestedUrl: request.url.toString(),

    extension,

    includesNamespace: request.url.includes(WORKER_NAMESPACE),
  };
  console.log(logPayload);
  ctx.sentry.addBreadcrumb({ data: logPayload });

  const avifImgRequest = new Request(fullSizeImgStr, {
    headers: ctx.request.headers,
    cf,
  });

  avifImgRequest.headers.set(
    'original-image',
    fullSizeUrl.searchParams.get('url') || '',
  );

  return fireModifiedRequest(avifImgRequest, ctx, cf);
}
